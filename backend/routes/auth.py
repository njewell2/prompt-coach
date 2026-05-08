from flask import Blueprint, request, jsonify, session
from backend.db import upsert_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json(force=True)
    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip().lower()

    if not username:
        return jsonify({"error": "username is required"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "valid email is required"}), 400

    user = upsert_user(username, email)
    session["user_id"] = user["id"]
    return jsonify({"id": user["id"], "username": user["username"], "email": user["email"]})


@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "not authenticated"}), 401
    from backend.db import get_db
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        session.pop("user_id", None)
        return jsonify({"error": "user not found"}), 401
    return jsonify({"id": row["id"], "username": row["username"], "email": row["email"]})


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"ok": True})
