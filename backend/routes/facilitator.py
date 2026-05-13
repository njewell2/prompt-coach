from flask import Blueprint, jsonify

from backend.common.clustering import is_running
from backend.db import get_all_focus_responses, get_latest_cluster

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
