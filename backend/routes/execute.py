import json
import time
import traceback

from flask import Blueprint, Response, jsonify, request

from backend.common.llm import get_client, model_id

execute_bp = Blueprint("execute", __name__)


def _sse(event: str, payload) -> bytes:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n".encode()


def _is_credential_error(msg: str) -> bool:
    return any(k in msg for k in ("credential", "AccessDenied", "UnrecognizedClient", "ExpiredToken"))


def _stream_execute(prompt: str):
    client = get_client()
    start = time.time()
    try:
        with client.messages.stream(
            model=model_id(),
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for delta in stream.text_stream:
                if delta:
                    yield _sse("delta", {"text": delta})
            final_msg = stream.get_final_message()
        usage = final_msg.usage
        yield _sse(
            "done",
            {
                "tokens": {
                    "input": getattr(usage, "input_tokens", 0),
                    "output": getattr(usage, "output_tokens", 0),
                },
                "execution_time_ms": int((time.time() - start) * 1000),
            },
        )
    except Exception as exc:
        traceback.print_exc()
        msg = str(exc)
        if _is_credential_error(msg):
            yield _sse("error", {
                "error": "AWS authentication failed. Run: aws sso login --profile ailab",
                "detail": msg,
            })
        else:
            yield _sse("error", {"error": "Execution failed", "detail": msg})


@execute_bp.route("/api/execute", methods=["POST"])
def execute():
    body = request.get_json(force=True)
    prompt = (body.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    return Response(
        _stream_execute(prompt),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@execute_bp.route("/api/challenges", methods=["GET"])
def get_challenges():
    from backend.data.challenges import CHALLENGES
    return jsonify(CHALLENGES)
