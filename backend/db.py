import sqlite3
import json
import os

# Persistent storage survives Showcase redeployments; fall back to backend/ for local dev.
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PERSISTENT_DIR = os.environ.get("PERSISTENT_DIR", os.path.join(_PROJECT_ROOT, "persistent"))
os.makedirs(_PERSISTENT_DIR, exist_ok=True)
DB_PATH = os.path.join(_PERSISTENT_DIR, "prompt_coach.db")

BEGINNER_COUNT = 5
TOTAL_CHALLENGES = 10


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(r["name"] == column for r in rows)


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

            CREATE TABLE IF NOT EXISTS response_clusters (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                themes      TEXT    NOT NULL,
                quote_count INTEGER NOT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS xp_events (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                attempt_id INTEGER REFERENCES attempts(id),
                reason     TEXT    NOT NULL,
                amount     INTEGER NOT NULL,
                metadata   TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_xp_user     ON xp_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
        """)

        if not _column_exists(conn, "users", "focus_response"):
            conn.execute("ALTER TABLE users ADD COLUMN focus_response TEXT")
        if not _column_exists(conn, "attempts", "strengths_json"):
            conn.execute("ALTER TABLE attempts ADD COLUMN strengths_json TEXT")
        if not _column_exists(conn, "attempts", "improvements_json"):
            conn.execute("ALTER TABLE attempts ADD COLUMN improvements_json TEXT")


def upsert_user(username: str, email: str) -> dict:
    with get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (username, email) VALUES (?, ?)",
            (username, email),
        )
        conn.execute(
            "UPDATE users SET username = ? WHERE email = ?",
            (username, email),
        )
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row)


def update_focus_response(user_id: int, text: str) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET focus_response = ? WHERE id = ?",
            (text, user_id),
        )


def save_attempt(user_id: int, challenge_id: str, prompt: str, result: dict, mode: str, session_token: str | None) -> int:
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO attempts
               (user_id, challenge_id, prompt, overall_score, dimension_scores,
                tokens, analysis_time_ms, mode, session_token,
                strengths_json, improvements_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
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
                json.dumps(result.get("strengths", [])),
                json.dumps(result.get("improvements", [])),
            ),
        )
        return cur.lastrowid


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
        try:
            strengths = json.loads(row["strengths_json"] or "[]")
        except (KeyError, IndexError, TypeError, ValueError):
            strengths = []
        try:
            improvements = json.loads(row["improvements_json"] or "[]")
        except (KeyError, IndexError, TypeError, ValueError):
            improvements = []
        attempt = {
            "timestamp": _to_ts(row["created_at"]),
            "prompt": row["prompt"],
            "score": row["overall_score"] or 0,
            "dimensions": dims,
            "strengths": strengths,
            "improvements": improvements,
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
        p["gold"] = best >= 85

    return challenges


def get_user_xp(user_id: int) -> int:
    with get_db() as conn:
        row = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM xp_events WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return int(row["total"]) if row else 0


def get_xp_events(user_id: int) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """SELECT reason, amount, metadata, created_at FROM xp_events
               WHERE user_id = ? ORDER BY created_at ASC""",
            (user_id,),
        ).fetchall()
    return [
        {
            "reason": r["reason"],
            "amount": r["amount"],
            "metadata": json.loads(r["metadata"]) if r["metadata"] else None,
            "timestamp": _to_ts(r["created_at"]),
        }
        for r in rows
    ]


def add_xp_event(user_id: int, attempt_id: int | None, reason: str, amount: int, metadata: dict | None = None) -> None:
    with get_db() as conn:
        conn.execute(
            """INSERT INTO xp_events (user_id, attempt_id, reason, amount, metadata)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, attempt_id, reason, amount, json.dumps(metadata) if metadata else None),
        )


def has_xp_event(user_id: int, reason: str, challenge_id: str | None = None, dim_id: str | None = None) -> bool:
    """Check if the user has already earned a specific XP event (for dedup)."""
    with get_db() as conn:
        if challenge_id is not None:
            rows = conn.execute(
                """SELECT metadata FROM xp_events
                   WHERE user_id = ? AND reason = ?""",
                (user_id, reason),
            ).fetchall()
            for r in rows:
                if not r["metadata"]:
                    continue
                try:
                    m = json.loads(r["metadata"])
                except (ValueError, TypeError):
                    continue
                if m.get("challenge_id") == challenge_id:
                    return True
            return False
        if dim_id is not None:
            rows = conn.execute(
                """SELECT metadata FROM xp_events
                   WHERE user_id = ? AND reason = ?""",
                (user_id, reason),
            ).fetchall()
            for r in rows:
                if not r["metadata"]:
                    continue
                try:
                    m = json.loads(r["metadata"])
                except (ValueError, TypeError):
                    continue
                if m.get("dim_id") == dim_id:
                    return True
            return False
        row = conn.execute(
            "SELECT 1 FROM xp_events WHERE user_id = ? AND reason = ? LIMIT 1",
            (user_id, reason),
        ).fetchone()
        return row is not None


def get_all_focus_responses() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, username, focus_response, created_at
               FROM users
               WHERE focus_response IS NOT NULL AND TRIM(focus_response) <> ''
               ORDER BY created_at ASC"""
        ).fetchall()
    return [
        {
            "id": r["id"],
            "username": r["username"],
            "text": r["focus_response"],
            "created_at": _to_ts(r["created_at"]),
        }
        for r in rows
    ]


def get_latest_cluster() -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM response_clusters ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
    if not row:
        return None
    return {
        "themes": json.loads(row["themes"]),
        "quote_count": row["quote_count"],
        "created_at": _to_ts(row["created_at"]),
    }


def save_cluster(themes: list[dict], quote_count: int) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO response_clusters (themes, quote_count) VALUES (?, ?)",
            (json.dumps(themes), quote_count),
        )


def leaderboard_rows() -> list[dict]:
    """All users with their XP and challenge-pass counts, ranked."""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                u.id AS user_id,
                u.username,
                COALESCE((SELECT SUM(amount) FROM xp_events WHERE user_id = u.id), 0) AS xp,
                COALESCE((
                    SELECT COUNT(*) FROM (
                        SELECT challenge_id, MAX(overall_score) AS best
                        FROM attempts
                        WHERE user_id = u.id AND mode = 'training'
                        GROUP BY challenge_id
                    ) WHERE best >= 75
                ), 0) AS challenges_passed,
                (SELECT MAX(created_at) FROM attempts WHERE user_id = u.id) AS last_activity
            FROM users u
        """).fetchall()
    result = [
        {
            "user_id": r["user_id"],
            "username": r["username"],
            "xp": int(r["xp"]),
            "challenges_passed": int(r["challenges_passed"]),
            "last_activity": _to_ts(r["last_activity"]) if r["last_activity"] else 0,
        }
        for r in rows
    ]
    # sort: XP desc, then last_activity desc, then user_id asc as a stable tiebreaker
    # so equal-XP/idle users don't swap order between polls (which would cause UI pulses).
    result.sort(key=lambda r: (-r["xp"], -r["last_activity"], r["user_id"]))
    return result


def _to_ts(dt_str: str | None) -> int:
    """Convert SQLite CURRENT_TIMESTAMP string to milliseconds epoch."""
    if not dt_str:
        return 0
    from datetime import datetime, timezone
    try:
        dt = datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
    except Exception:
        return 0
