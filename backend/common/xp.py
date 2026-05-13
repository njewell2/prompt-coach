from backend.db import add_xp_event, has_xp_event

TIER_WEIGHT = {"beginner": 1, "intermediate": 2, "advanced": 3}

PASS_BASE = 20
GOLD_BASE = 10
ATTEMPT_POINTS = 5
FIRST_TRY_POINTS = 15
IMPROVE_POINTS = 10
PERFECT_DIM_POINTS = 5

PASS_THRESHOLD = 75
GOLD_THRESHOLD = 85
IMPROVE_DELTA = 15


def score_attempt(*, user_id: int, attempt_id: int, challenge: dict, prior_best: int, overall_score: int, dimensions: list[dict], attempt_number: int) -> list[dict]:
    """Insert xp_events for this attempt. Returns events for the frontend to animate.

    Dedup rules:
      - 'pass' / 'gold' / 'first_try' awarded at most once per (user, challenge).
      - 'perfect_dim' awarded at most once per (user, dim_id).
    """
    events: list[dict] = []
    challenge_id = challenge["id"]
    tier_mult = TIER_WEIGHT.get(challenge.get("tier", "beginner"), 1)

    _award(events, user_id, attempt_id, "attempt", ATTEMPT_POINTS, {"challenge_id": challenge_id})

    if overall_score >= PASS_THRESHOLD:
        if not has_xp_event(user_id, "pass", challenge_id=challenge_id):
            _award(events, user_id, attempt_id, "pass", PASS_BASE * tier_mult, {"challenge_id": challenge_id})

    if overall_score >= GOLD_THRESHOLD:
        if not has_xp_event(user_id, "gold", challenge_id=challenge_id):
            _award(events, user_id, attempt_id, "gold", GOLD_BASE * tier_mult, {"challenge_id": challenge_id})

    if overall_score >= PASS_THRESHOLD and attempt_number == 1:
        if not has_xp_event(user_id, "first_try", challenge_id=challenge_id):
            _award(events, user_id, attempt_id, "first_try", FIRST_TRY_POINTS, {"challenge_id": challenge_id})

    if prior_best and overall_score - prior_best >= IMPROVE_DELTA:
        _award(events, user_id, attempt_id, "improve", IMPROVE_POINTS, {"challenge_id": challenge_id, "delta": overall_score - prior_best})

    for dim in dimensions:
        if dim.get("score") == 10:
            dim_id = dim.get("id")
            if dim_id and not has_xp_event(user_id, "perfect_dim", dim_id=dim_id):
                _award(events, user_id, attempt_id, "perfect_dim", PERFECT_DIM_POINTS, {"dim_id": dim_id})

    return events


def _award(events: list[dict], user_id: int, attempt_id: int, reason: str, amount: int, metadata: dict | None) -> None:
    add_xp_event(user_id, attempt_id, reason, amount, metadata)
    events.append({"reason": reason, "amount": amount, "metadata": metadata})
