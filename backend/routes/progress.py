from flask import Blueprint, jsonify, request, session

from backend.common.badges import compute_badges
from backend.db import (
    get_user_progress,
    get_user_xp,
    get_xp_events,
    leaderboard_rows,
    mark_revealed,
)

progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/api/user/progress", methods=["GET"])
def user_progress():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "not authenticated"}), 401
    challenges = get_user_progress(user_id)

    rows = leaderboard_rows()
    total = len(rows)
    rank = next((i + 1 for i, r in enumerate(rows) if r["user_id"] == user_id), None)

    return jsonify({
        "challenges": challenges,
        "xp_total": get_user_xp(user_id),
        "xp_events": get_xp_events(user_id),
        "badges": compute_badges(user_id),
        "rank": {"position": rank, "total": total},
    })


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
