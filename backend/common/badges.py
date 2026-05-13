from backend.data.challenges import CHALLENGES
from backend.db import get_db

DIMENSION_IDS = [
    "clarity",
    "context",
    "output",
    "examples",
    "thinking",
]

BEGINNER_IDS = [c["id"] for c in CHALLENGES if c["tier"] == "beginner"]
ALL_CHALLENGE_IDS = [c["id"] for c in CHALLENGES]


def compute_badges(user_id: int) -> dict:
    """Return {badge_id: {earned, earned_at_ms, progress: {current, target}}}."""
    with get_db() as conn:
        best_by_challenge: dict[str, int] = {}
        for row in conn.execute(
            """SELECT challenge_id, MAX(overall_score) AS best
               FROM attempts WHERE user_id = ? AND mode = 'training'
               GROUP BY challenge_id""",
            (user_id,),
        ).fetchall():
            best_by_challenge[row["challenge_id"]] = row["best"] or 0

        dim_rows = conn.execute(
            """SELECT metadata FROM xp_events
               WHERE user_id = ? AND reason = 'perfect_dim'""",
            (user_id,),
        ).fetchall()

    mastered_dims: set[str] = set()
    for r in dim_rows:
        import json
        try:
            meta = json.loads(r["metadata"]) if r["metadata"] else {}
        except ValueError:
            continue
        if meta.get("dim_id"):
            mastered_dims.add(meta["dim_id"])

    beginner_gold = sum(1 for cid in BEGINNER_IDS if best_by_challenge.get(cid, 0) >= 90)
    total_passed = sum(1 for cid in ALL_CHALLENGE_IDS if best_by_challenge.get(cid, 0) >= 75)
    dim_count = len(mastered_dims)

    return {
        "golden_beginner": {
            "earned": beginner_gold >= len(BEGINNER_IDS),
            "label": "Golden Beginner",
            "description": f"Score gold ({90}+) on all {len(BEGINNER_IDS)} beginner challenges.",
            "progress": {"current": beginner_gold, "target": len(BEGINNER_IDS)},
        },
        "dimension_master": {
            "earned": dim_count >= len(DIMENSION_IDS),
            "label": "Area Master",
            "description": f"Earn a perfect 10 on each of the {len(DIMENSION_IDS)} prompt areas.",
            "progress": {"current": dim_count, "target": len(DIMENSION_IDS)},
        },
        "completionist": {
            "earned": total_passed >= len(ALL_CHALLENGE_IDS),
            "label": "Completionist",
            "description": f"Pass all {len(ALL_CHALLENGE_IDS)} challenges.",
            "progress": {"current": total_passed, "target": len(ALL_CHALLENGE_IDS)},
        },
    }


def earned_badge_ids(badges: dict) -> set[str]:
    return {bid for bid, b in badges.items() if b.get("earned")}
