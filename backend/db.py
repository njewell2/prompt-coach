import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "prompt_coach.db")


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT    NOT NULL,
                email      TEXT    NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS attempts (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER NOT NULL REFERENCES users(id),
                challenge_id     TEXT    NOT NULL,
                prompt           TEXT    NOT NULL,
                overall_score    INTEGER,
                dimension_scores TEXT,
                tokens           TEXT,
                analysis_time_ms INTEGER,
                mode             TEXT    DEFAULT 'training',
                session_token    TEXT,
                revealed         INTEGER DEFAULT 0,
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)


def upsert_user(username: str, email: str) -> dict:
    with get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (username, email) VALUES (?, ?)",
            (username, email),
        )
        # Always update username in case they changed it
        conn.execute(
            "UPDATE users SET username = ? WHERE email = ?",
            (username, email),
        )
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row)


def save_attempt(user_id: int, challenge_id: str, prompt: str, result: dict, mode: str, session_token: str | None):
    with get_db() as conn:
        conn.execute(
            """INSERT INTO attempts
               (user_id, challenge_id, prompt, overall_score, dimension_scores,
                tokens, analysis_time_ms, mode, session_token)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                challenge_id,
                prompt,
                result.get("overall_score"),
                json.dumps(result.get("dimensions", [])),
                json.dumps(result.get("tokens", {})),
                result.get("analysis_time_ms"),
                mode,
                session_token,
            ),
        )


def mark_revealed(user_id: int, challenge_id: str):
    with get_db() as conn:
        conn.execute(
            """UPDATE attempts SET revealed = 1
               WHERE user_id = ? AND challenge_id = ?
               AND id = (
                 SELECT id FROM attempts
                 WHERE user_id = ? AND challenge_id = ?
                 ORDER BY created_at DESC LIMIT 1
               )""",
            (user_id, challenge_id, user_id, challenge_id),
        )


def get_user_progress(user_id: int) -> dict:
    """Returns dict keyed by challenge_id matching ChallengeProgress shape."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at ASC""",
            (user_id,),
        ).fetchall()

    challenges: dict = {}
    for row in rows:
        cid = row["challenge_id"]
        dims = json.loads(row["dimension_scores"] or "[]")
        attempt = {
            "timestamp": _to_ts(row["created_at"]),
            "prompt": row["prompt"],
            "score": row["overall_score"] or 0,
            "dimensions": dims,
            "session_token": row["session_token"],
        }
        if cid not in challenges:
            challenges[cid] = {
                "challengeId": cid,
                "attempts": [],
                "best_score": 0,
                "passed": False,
                "gold": False,
                "revealed": False,
            }
        challenges[cid]["attempts"].append(attempt)
        score = row["overall_score"] or 0
        if score > challenges[cid]["best_score"]:
            challenges[cid]["best_score"] = score
        if row["revealed"]:
            challenges[cid]["revealed"] = True

    for cid, p in challenges.items():
        best = p["best_score"]
        p["passed"] = best >= 75
        p["gold"] = best >= 90

    return challenges


def _to_ts(dt_str: str) -> int:
    """Convert SQLite CURRENT_TIMESTAMP string to milliseconds epoch."""
    from datetime import datetime, timezone
    try:
        dt = datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
    except Exception:
        return 0
