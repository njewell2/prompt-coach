import time
from flask import Blueprint, request, jsonify
from backend.common.llm import get_client, model_id

execute_bp = Blueprint("execute", __name__)


@execute_bp.route("/api/execute", methods=["POST"])
def execute():
    body = request.get_json(force=True)
    prompt = (body.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    client = get_client()
    start = time.time()

    try:
        response = client.messages.create(
            model=model_id(),
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        msg = str(exc)
        if any(k in msg for k in ("credential", "AccessDenied", "UnrecognizedClient", "ExpiredToken")):
            return jsonify({
                "error": "AWS authentication failed. Run: aws sso login --profile ailab",
                "detail": msg,
            }), 503
        return jsonify({"error": "Execution failed", "detail": msg}), 500

    elapsed = int((time.time() - start) * 1000)
    text = next((b.text for b in response.content if b.type == "text"), "")
    usage = response.usage

    return jsonify({
        "response": text,
        "tokens": {
            "input": getattr(usage, "input_tokens", 0),
            "output": getattr(usage, "output_tokens", 0),
        },
        "execution_time_ms": elapsed,
    })


@execute_bp.route("/api/challenges", methods=["GET"])
def get_challenges():
    from backend.data.challenges import CHALLENGES
    return jsonify(CHALLENGES)
