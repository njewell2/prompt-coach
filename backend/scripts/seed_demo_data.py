"""Seed synthetic users + attempts + XP events so the facilitator views have something to show.

Usage from the repo root, with the venv activated:
    python3 -m backend.scripts.seed_demo_data            # seed 50 users (default)
    python3 -m backend.scripts.seed_demo_data 30         # seed N users
    python3 -m backend.scripts.seed_demo_data --wipe 50  # delete existing synthetic data first

Synthetic users get usernames prefixed with "demo_" so it's easy to tell them
apart from real users and delete them later.
"""

from __future__ import annotations

import json
import os
import random
import sys
from typing import Sequence

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.common.badges import DIMENSION_IDS
from backend.common.xp import TIER_WEIGHT
from backend.data.challenges import CHALLENGES
from backend.db import get_db, init_db

DEMO_PREFIX = "demo_"

FIRST_NAMES = [
    "avery", "blake", "cameron", "dakota", "ellis", "finley", "grey", "harper",
    "indigo", "jamie", "kennedy", "logan", "morgan", "nico", "oakley", "parker",
    "quinn", "reese", "sage", "taylor", "umi", "vale", "west", "xen",
    "yusuf", "zion", "alex", "bailey", "casey", "devon", "emery", "frankie",
    "gray", "hayden", "ira", "jules", "kit", "lane", "mars", "noel",
    "opal", "pax", "riley", "sawyer", "toby", "umi2", "vic", "wren",
    "yael", "zoey", "aren", "bex", "cory", "dara", "eli",
]

FOCUS_RESPONSES = [
    "Writing first drafts of status updates and weekly reports.",
    "Untangling messy data from our CRM into clean tables.",
    "Prepping for tough client meetings by role-playing the conversation.",
    "Coding assistant — boilerplate, refactors, and pair programming.",
    "Analyzing survey feedback and clustering themes.",
    "Summarizing long meeting transcripts down to action items.",
    "Helping me learn new tools faster by explaining concepts with examples.",
    "Drafting marketing copy that I can edit rather than write from scratch.",
    "Running retrospectives and extracting patterns across projects.",
    "Turning unstructured notes into structured project plans.",
    "Reviewing my writing for clarity and tone before I send it.",
    "Generating test cases and edge cases I hadn't thought of.",
    "Answering quick 'how do I…' questions without a context switch.",
    "Preparing interview questions and scoring rubrics.",
    "Converting raw transcripts of user interviews into insight briefs.",
    "Translating between business-speak and engineering-speak.",
    "Getting unstuck on ambiguous problems by having a back-and-forth.",
    "Building first-pass architecture diagrams and prose explanations.",
    "Creating training materials from scattered expert notes.",
    "Summarizing long technical documents into one-pagers for execs.",
    "Clustering support tickets so product can prioritize themes.",
    "Making my status updates less boring and more useful.",
    "Drafting difficult emails when I don't know how to start.",
    "Turning customer feedback into prioritized roadmap themes.",
    "Simulating stakeholder objections before a big pitch.",
    "Proofreading proposals before they go to the client.",
    "Building quick prototypes of data visualizations I can iterate on.",
    "Translating regulatory requirements into checklists.",
    "Running pre-mortems on planned launches.",
    "Turning sales call notes into CRM-ready summaries.",
    "Drafting initial training data for smaller models.",
    "Breaking down giant Jira epics into actionable stories.",
    "Comparing trade-offs of multiple design options side-by-side.",
    "Getting a second opinion on estimates that feel off.",
    "Drafting incident post-mortems quickly while it's fresh.",
    "Building quick one-off scripts I'd never bother coding myself.",
    "Explaining complex regulatory concepts to non-experts.",
    "Coming up with fresh framings for tired-sounding slides.",
    "Role-playing difficult feedback conversations with a report.",
    "Scanning long RFPs and flagging the hidden requirements.",
    "Generating diverse example queries for search relevance testing.",
    "Finding logic gaps in business requirements documents.",
    "Drafting pull request descriptions that capture the 'why'.",
    "Preparing readouts for board updates from raw program data.",
]


def wipe_demo(conn) -> None:
    rows = conn.execute(
        "SELECT id FROM users WHERE username LIKE ?",
        (f"{DEMO_PREFIX}%",),
    ).fetchall()
    ids = [r["id"] for r in rows]
    if not ids:
        return
    placeholders = ",".join("?" * len(ids))
    conn.execute(f"DELETE FROM xp_events WHERE user_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM attempts  WHERE user_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM users     WHERE id      IN ({placeholders})", ids)
    # Don't touch response_clusters — background worker will regenerate.


def _pick_username(index: int, used: set[str]) -> str:
    base = FIRST_NAMES[index % len(FIRST_NAMES)]
    candidate = f"{DEMO_PREFIX}{base}"
    suffix = 2
    while candidate in used:
        candidate = f"{DEMO_PREFIX}{base}{suffix}"
        suffix += 1
    used.add(candidate)
    return candidate


def _synth_dimensions(target_overall: int, focus_ids: Sequence[str]) -> list[dict]:
    """Generate area scores whose rounded average matches target_overall
    (on the 0–100 scale). Focus areas skew higher to match challenge intent."""
    # Scale target from 0–100 to 0–10 per-dimension mean.
    mean = target_overall / 10.0
    dims: list[dict] = []
    # Bias focus dims up by 1–2 points so the challenge's focus shows effort.
    boosts = {d: random.uniform(0.5, 1.5) for d in focus_ids}
    for dim_id in DIMENSION_IDS:
        base = random.gauss(mean, 1.1)
        base += boosts.get(dim_id, 0)
        score = max(0, min(10, round(base)))
        dims.append({
            "id": dim_id,
            "name": dim_id.replace("_", " ").title(),
            "score": score,
            "explanation": "synthetic",
            "suggestion": "synthetic",
            "citation": {"source": "Anthropic", "quote": "", "reference": "seed"},
        })
    # Nudge one dimension to make the rounded average match target exactly.
    current_sum = sum(d["score"] for d in dims)
    target_sum = int(round(target_overall / 100 * len(DIMENSION_IDS) * 10))
    diff = target_sum - current_sum
    idx = 0
    while diff != 0 and idx < 50:
        j = random.randrange(len(dims))
        step = 1 if diff > 0 else -1
        new_val = dims[j]["score"] + step
        if 0 <= new_val <= 10:
            dims[j]["score"] = new_val
            diff -= step
        idx += 1
    return dims


def _award_xp(conn, user_id: int, attempt_id: int, challenge: dict,
              prior_best: int, overall_score: int, dimensions: list[dict],
              attempt_number: int,
              perfect_dims_awarded: set[str]) -> None:
    """Mirror the logic in backend/common/xp.score_attempt, but using the
    provided SQLite connection so seeding is a single transaction."""
    tier_mult = TIER_WEIGHT.get(challenge.get("tier", "beginner"), 1)
    cid = challenge["id"]

    def insert(reason: str, amount: int, metadata: dict | None) -> None:
        conn.execute(
            """INSERT INTO xp_events (user_id, attempt_id, reason, amount, metadata)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, attempt_id, reason, amount, json.dumps(metadata) if metadata else None),
        )

    # Attempt always gets +5
    insert("attempt", 5, {"challenge_id": cid})

    already = conn.execute(
        """SELECT reason, metadata FROM xp_events
           WHERE user_id = ? AND reason IN ('pass','gold','first_try')""",
        (user_id,),
    ).fetchall()
    already_by_reason: dict[str, set[str]] = {"pass": set(), "gold": set(), "first_try": set()}
    for r in already:
        try:
            m = json.loads(r["metadata"] or "{}")
        except ValueError:
            continue
        c = m.get("challenge_id")
        if c:
            already_by_reason.setdefault(r["reason"], set()).add(c)

    if overall_score >= 75 and cid not in already_by_reason["pass"]:
        insert("pass", 20 * tier_mult, {"challenge_id": cid})
    if overall_score >= 85 and cid not in already_by_reason["gold"]:
        insert("gold", 10 * tier_mult, {"challenge_id": cid})
    if overall_score >= 75 and attempt_number == 1 and cid not in already_by_reason["first_try"]:
        insert("first_try", 15, {"challenge_id": cid})
    if prior_best and overall_score - prior_best >= 15:
        insert("improve", 10, {"challenge_id": cid, "delta": overall_score - prior_best})
    for dim in dimensions:
        if dim["score"] == 10 and dim["id"] not in perfect_dims_awarded:
            insert("perfect_dim", 5, {"dim_id": dim["id"]})
            perfect_dims_awarded.add(dim["id"])


def seed_users(n: int) -> None:
    init_db()
    existing_usernames = set()
    with get_db() as conn:
        rows = conn.execute("SELECT username FROM users").fetchall()
        existing_usernames = {r["username"] for r in rows}

    # Fairly distributed skill curve so the leaderboard has a nice spread.
    skill_buckets = [0.2, 0.35, 0.50, 0.65, 0.80, 0.95]

    with get_db() as conn:
        for i in range(n):
            username = _pick_username(i, existing_usernames)
            email = f"{username}@demo.local"
            focus = random.choice(FOCUS_RESPONSES)
            conn.execute(
                """INSERT INTO users (username, email, focus_response)
                   VALUES (?, ?, ?)""",
                (username, email, focus),
            )
            user_id = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()["id"]

            # Pick a skill level and a # of challenges this person engaged with.
            skill = random.choice(skill_buckets) + random.uniform(-0.10, 0.10)
            skill = max(0.05, min(1.0, skill))
            n_challenges = random.randint(1, min(10, len(CHALLENGES)))
            chosen_challenges = random.sample(CHALLENGES[:min(12, len(CHALLENGES))], n_challenges)

            perfect_dims_awarded: set[str] = set()
            for challenge in chosen_challenges:
                prior_best = 0
                attempts_on_this = random.choice([1, 1, 1, 2, 2, 3])
                for attempt_idx in range(attempts_on_this):
                    # Later attempts generally improve a bit.
                    attempt_skill = skill + 0.08 * attempt_idx + random.uniform(-0.12, 0.12)
                    attempt_skill = max(0.05, min(1.05, attempt_skill))
                    overall = int(round(attempt_skill * 100))
                    overall = max(10, min(100, overall))
                    dims = _synth_dimensions(overall, challenge.get("focus_dimensions", []))
                    cur = conn.execute(
                        """INSERT INTO attempts
                           (user_id, challenge_id, prompt, overall_score, dimension_scores,
                            tokens, analysis_time_ms, mode, session_token)
                           VALUES (?, ?, ?, ?, ?, ?, ?, 'training', NULL)""",
                        (
                            user_id,
                            challenge["id"],
                            f"[seed prompt for {challenge['id']} attempt {attempt_idx + 1}]",
                            overall,
                            json.dumps(dims),
                            json.dumps({"input": 0, "output": 0, "cache_read": 0, "cache_creation": 0}),
                            random.randint(900, 2400),
                        ),
                    )
                    attempt_id = cur.lastrowid
                    _award_xp(
                        conn,
                        user_id=user_id,
                        attempt_id=attempt_id,
                        challenge=challenge,
                        prior_best=prior_best,
                        overall_score=overall,
                        dimensions=dims,
                        attempt_number=attempt_idx + 1,
                        perfect_dims_awarded=perfect_dims_awarded,
                    )
                    if overall > prior_best:
                        prior_best = overall


def main() -> None:
    argv = sys.argv[1:]
    wipe = False
    if "--wipe" in argv:
        wipe = True
        argv.remove("--wipe")
    n = int(argv[0]) if argv else 50

    if wipe:
        init_db()
        with get_db() as conn:
            wipe_demo(conn)
        print("Wiped existing demo_* users.")

    print(f"Seeding {n} synthetic users…")
    seed_users(n)

    with get_db() as conn:
        ucount = conn.execute("SELECT COUNT(*) AS c FROM users WHERE username LIKE ?", (f"{DEMO_PREFIX}%",)).fetchone()["c"]
        acount = conn.execute(
            """SELECT COUNT(*) AS c FROM attempts
               WHERE user_id IN (SELECT id FROM users WHERE username LIKE ?)""",
            (f"{DEMO_PREFIX}%",),
        ).fetchone()["c"]
        xcount = conn.execute(
            """SELECT COUNT(*) AS c FROM xp_events
               WHERE user_id IN (SELECT id FROM users WHERE username LIKE ?)""",
            (f"{DEMO_PREFIX}%",),
        ).fetchone()["c"]
    print(f"Done. demo users: {ucount}  attempts: {acount}  xp_events: {xcount}")

    # Kick clustering so the facilitator view has themes.
    try:
        from backend.common.clustering import request_cluster
        request_cluster()
        print("Triggered theme re-cluster in background (may take a few seconds).")
    except Exception as exc:
        print(f"Could not trigger cluster (run will still work): {exc}")


if __name__ == "__main__":
    main()
