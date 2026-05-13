from flask import Blueprint, jsonify, request

from backend.common.clustering import is_running
from backend.db import get_all_focus_responses, get_latest_cluster, get_db

facilitator_bp = Blueprint("facilitator", __name__)


@facilitator_bp.route("/api/facilitator/responses", methods=["GET"])
def facilitator_responses():
    responses = get_all_focus_responses()
    cluster = get_latest_cluster()
    return jsonify({
        "responses": responses,
        "cluster": cluster,
        "clustering": is_running(),
    })


@facilitator_bp.route("/api/admin/wipe", methods=["POST"])
def admin_wipe():
    body = request.get_json(silent=True) or {}
    if body.get("confirm") != "WIPE":
        return jsonify({"error": "confirmation phrase missing"}), 400
    with get_db() as conn:
        conn.executescript("""
            DELETE FROM xp_events;
            DELETE FROM attempts;
            DELETE FROM response_clusters;
            DELETE FROM users;
        """)
    return jsonify({"ok": True})
