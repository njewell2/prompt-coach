from flask import Blueprint, jsonify, session

from backend.db import leaderboard_rows

leaderboard_bp = Blueprint("leaderboard", __name__)

TOP_COUNT_ATTENDEE = 4
ABOVE_COUNT = 2
BELOW_COUNT = 1
FACILITATOR_TOP_COUNT = 6


def _row_for_output(row: dict, *, include_user_id: bool = False) -> dict:
    out = {
        "username": row["username"],
        "xp": row["xp"],
        "challenges_passed": row["challenges_passed"],
    }
    if include_user_id:
        out["user_id"] = row["user_id"]
    return out


@leaderboard_bp.route("/api/leaderboard/me", methods=["GET"])
def leaderboard_me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "not authenticated"}), 401

    rows = leaderboard_rows()
    total = len(rows)

    you_idx = next((i for i, r in enumerate(rows) if r["user_id"] == user_id), None)
    if you_idx is None:
        return jsonify({
            "top": [_row_for_output(r) for r in rows[:TOP_COUNT_ATTENDEE]],
            "above": [],
            "below": [],
            "you": None,
            "rank": None,
            "total": total,
        })

    you_row = rows[you_idx]
    you_out = {**_row_for_output(you_row), "is_you": True}

    top = rows[:TOP_COUNT_ATTENDEE]
    top_out = [
        {**_row_for_output(r), "is_you": r["user_id"] == user_id}
        for r in top
    ]

    in_top = you_idx < TOP_COUNT_ATTENDEE
    if in_top:
        above_out: list[dict] = []
        below_out: list[dict] = []
    else:
        above_start = max(TOP_COUNT_ATTENDEE, you_idx - ABOVE_COUNT)
        above_out = [
            {**_row_for_output(r), "rank": i + 1}
            for i, r in enumerate(rows[above_start:you_idx], start=above_start)
        ]
        below_end = min(total, you_idx + 1 + BELOW_COUNT)
        below_out = [
            {**_row_for_output(r), "rank": i + 1}
            for i, r in enumerate(rows[you_idx + 1:below_end], start=you_idx + 1)
        ]

    return jsonify({
        "top": top_out,
        "above": above_out,
        "below": below_out,
        "you": {**you_out, "rank": you_idx + 1},
        "rank": you_idx + 1,
        "total": total,
    })


@leaderboard_bp.route("/api/leaderboard/top", methods=["GET"])
def leaderboard_top():
    rows = leaderboard_rows()
    return jsonify({
        "top": [
            {**_row_for_output(r), "rank": i + 1}
            for i, r in enumerate(rows[:FACILITATOR_TOP_COUNT])
        ],
        "total": len(rows),
    })
