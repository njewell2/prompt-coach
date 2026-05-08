import json
import re
import time
import uuid
from flask import Blueprint, request, jsonify
from backend.common.llm import get_client, model_id
from backend.prompts.evaluator_system import EVALUATOR_SYSTEM_PROMPT

analyze_bp = Blueprint("analyze", __name__)

# Server-side store: session_token → reveal data (withheld from frontend until earned)
_session_store: dict = {}


def _call_evaluator(user_prompt: str, context: str | None, mode: str) -> dict:
    client = get_client()
    start = time.time()

    user_content = ""
    if context:
        user_content += f"<context>\n{context}\n</context>\n\n"
    user_content += f"<prompt_to_evaluate>\n{user_prompt}\n</prompt_to_evaluate>"

    if mode == "practice":
        user_content += "\n\nMode: practice — also score the improved_prompt you generate and include improved_dimensions and improved_overall_score."

    response = client.messages.create(
        model=model_id(),
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": EVALUATOR_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )

    elapsed = int((time.time() - start) * 1000)
    raw = next((b.text for b in response.content if b.type == "text"), "")

    # Defensive JSON extraction
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            raise ValueError("Model returned non-JSON response")
        data = json.loads(match.group(0))

    usage = response.usage
    data["tokens"] = {
        "input": getattr(usage, "input_tokens", 0),
        "output": getattr(usage, "output_tokens", 0),
        "cache_read": getattr(usage, "cache_read_input_tokens", 0),
        "cache_creation": getattr(usage, "cache_creation_input_tokens", 0),
    }
    data["analysis_time_ms"] = elapsed
    return data


@analyze_bp.route("/api/analyze", methods=["POST"])
def analyze():
    body = request.get_json(force=True)
    prompt = (body.get("prompt") or "").strip()
    context = (body.get("context") or "").strip() or None
    mode = body.get("mode", "training")

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400
    if len(prompt) > 8000:
        return jsonify({"error": "prompt exceeds 8000 character limit"}), 400

    try:
        result = _call_evaluator(prompt, context, mode)
    except Exception as exc:
        msg = str(exc)
        if any(k in msg for k in ("credential", "AccessDenied", "UnrecognizedClient", "ExpiredToken")):
            return jsonify({
                "error": "AWS authentication failed. Run: aws sso login --profile ailab",
                "detail": msg,
            }), 503
        return jsonify({"error": "Analysis failed", "detail": msg}), 500

    if mode == "practice":
        return jsonify(result)

    # training mode: stash reveal data server-side
    token = str(uuid.uuid4())
    _session_store[token] = {
        "improved_prompt": result.pop("improved_prompt", ""),
        "improved_dimensions": result.pop("improved_dimensions", []),
        "improved_overall_score": result.pop("improved_overall_score", None),
    }
    result["session_token"] = token
    return jsonify(result)


@analyze_bp.route("/api/reveal", methods=["POST"])
def reveal():
    body = request.get_json(force=True)
    token = body.get("session_token", "")
    data = _session_store.get(token)
    if not data:
        return jsonify({"error": "Invalid or expired session token"}), 404
    return jsonify(data)
