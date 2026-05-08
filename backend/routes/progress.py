from flask import Blueprint, jsonify, session, request
from backend.db import get_user_progress, mark_revealed

progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/api/user/progress", methods=["GET"])
def user_progress():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "not authenticated"}), 401
    challenges = get_user_progress(user_id)
    return jsonify({"challenges": challenges})


@progress_bp.route("/api/user/reveal", methods=["POST"])
def user_reveal():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "not authenticated"}), 401
    body = request.get_json(force=True)
    challenge_id = body.get("challenge_id", "")
    if not challenge_id:
        return jsonify({"error": "challenge_id required"}), 400
    mark_revealed(user_id, challenge_id)
    return jsonify({"ok": True})
