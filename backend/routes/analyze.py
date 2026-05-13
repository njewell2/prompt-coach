import json
import queue
import re
import threading
import time
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field

from flask import Blueprint, Response, jsonify, request, session

from backend.common.badges import compute_badges, earned_badge_ids
from backend.common.llm import get_client, model_id
from backend.common.streaming import extract_completed_dimensions
from backend.common.xp import score_attempt
from backend.data.challenges import CHALLENGES
from backend.data.citations import attach_citations
from backend.db import get_db, get_user_xp, save_attempt
from backend.prompts.evaluator_system import (
    EVALUATOR_IMPROVE_PROMPT,
    EVALUATOR_SCORING_PROMPT,
)

analyze_bp = Blueprint("analyze", __name__)


@dataclass
class _SessionSlot:
    """Reveal handoff between the analyze worker and the /api/reveal poller.

    The slot is created when /api/analyze emits scoring_complete; the sonnet
    worker fills it later via _stash_improved and sets `ready` so any waiting
    /api/reveal call wakes immediately instead of polling.
    """
    ready: threading.Event = field(default_factory=threading.Event)
    data: dict | None = None
    error: str | None = None


_session_store: dict[str, _SessionSlot] = {}

# Hard ceiling for /api/reveal to wait on the sonnet worker. Bedrock Sonnet 4.5
# with a 2k-token completion is typically 6-15s but can spike to 25s on cold
# routes; allow headroom past the longest realistic completion before giving up.
REVEAL_WAIT_SECONDS = 30.0

_CHALLENGES_BY_ID = {c["id"]: c for c in CHALLENGES}


def _build_user_content(user_prompt: str, context: str | None) -> str:
    parts = []
    if context:
        parts.append(f"<context>\n{context}\n</context>\n")
    parts.append(f"<prompt_to_evaluate>\n{user_prompt}\n</prompt_to_evaluate>")
    return "\n".join(parts)


def _parse_json(raw: str) -> dict:
    try:
        return json.loads(raw, strict=False)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            raise ValueError("Model returned non-JSON response")
        return json.loads(match.group(0), strict=False)


def _usage_dict(u) -> dict:
    return {
        "input": getattr(u, "input_tokens", 0),
        "output": getattr(u, "output_tokens", 0),
        "cache_read": getattr(u, "cache_read_input_tokens", 0),
        "cache_creation": getattr(u, "cache_creation_input_tokens", 0),
    }


def _sum_tokens(a: dict, b: dict) -> dict:
    return {
        k: a.get(k, 0) + b.get(k, 0)
        for k in ("input", "output", "cache_read", "cache_creation")
    }


def _sse(event: str, payload) -> bytes:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n".encode()


def _prior_attempt_stats(user_id: int, challenge_id: str) -> tuple[int, int]:
    with get_db() as conn:
        row = conn.execute(
            """SELECT COUNT(*) AS n, COALESCE(MAX(overall_score), 0) AS best
               FROM attempts
               WHERE user_id = ? AND challenge_id = ? AND mode = 'training'""",
            (user_id, challenge_id),
        ).fetchone()
    return int(row["n"]), int(row["best"])


def _persist_scoring(
    result: dict,
    prompt: str,
    challenge_id: str,
    mode: str,
    user_id: int | None,
    expect_improved: bool,
) -> dict:
    """Save the attempt and compute XP from scoring data alone (no
    improved-prompt dependency). When ``expect_improved`` is true, pre-
    allocate a session_token so the client can request the expert reveal
    once the improve worker finishes; the entry is filled in by
    :func:`_stash_improved`. Returns the fields for the
    ``scoring_complete`` SSE event.
    """
    extras: dict = {}

    if mode == "practice":
        if user_id:
            save_attempt(user_id, challenge_id, prompt, result, mode, None)
        return extras

    token: str | None = None
    if expect_improved:
        token = str(uuid.uuid4())
        # Reserve the slot now; the improve worker will fill it in and
        # signal `ready` so any pending /api/reveal call wakes instantly.
        _session_store[token] = _SessionSlot()
        extras["session_token"] = token

    if user_id:
        challenge = _CHALLENGES_BY_ID.get(challenge_id)
        prior_count, prior_best = _prior_attempt_stats(user_id, challenge_id)
        attempt_id = save_attempt(user_id, challenge_id, prompt, result, mode, token)

        if challenge:
            badges_before = earned_badge_ids(compute_badges(user_id))
            xp_events = score_attempt(
                user_id=user_id,
                attempt_id=attempt_id,
                challenge=challenge,
                prior_best=prior_best,
                overall_score=int(result.get("overall_score") or 0),
                dimensions=result.get("dimensions", []),
                attempt_number=prior_count + 1,
            )
            badges_after = earned_badge_ids(compute_badges(user_id))
            extras["xp_earned"] = xp_events
            extras["xp_total"] = get_user_xp(user_id)
            extras["new_badges"] = sorted(badges_after - badges_before)

    return extras


def _stash_improved(token: str | None, improve_data: dict) -> None:
    if not token:
        return
    slot = _session_store.get(token)
    if slot is None:
        return
    slot.data = {
        "improved_prompt": improve_data.get("improved_prompt", ""),
        "improved_dimensions": improve_data.get("improved_dimensions", []),
        "improved_overall_score": improve_data.get("improved_overall_score"),
    }
    slot.ready.set()


def _stash_improve_failure(token: str | None, error: str) -> None:
    """Wake any /api/reveal poller with a failure so it can return early
    instead of timing out at the wait ceiling."""
    if not token:
        return
    slot = _session_store.get(token)
    if slot is None:
        return
    slot.error = error
    slot.ready.set()


def _stream(
    prompt: str,
    context: str | None,
    mode: str,
    challenge_id: str,
    user_id: int | None,
    skip_improved: bool = False,
):
    client = get_client()
    user_content = _build_user_content(prompt, context)
    q: queue.Queue = queue.Queue()

    def haiku_worker():
        try:
            buffer = ""
            emitted = 0
            t0 = time.time()
            with client.messages.stream(
                model=model_id("fast"),
                max_tokens=2048,
                system=[
                    {
                        "type": "text",
                        "text": EVALUATOR_SCORING_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": user_content}],
            ) as stream:
                for delta in stream.text_stream:
                    buffer += delta
                    new_dims, emitted = extract_completed_dimensions(buffer, emitted)
                    for d in new_dims:
                        attach_citations([d])
                        q.put(("dimension", d))
                final_msg = stream.get_final_message()

            data = _parse_json(buffer)
            q.put(
                (
                    "scoring_meta",
                    {
                        "overall_score": data.get("overall_score"),
                        "strengths": data.get("strengths", []),
                        "improvements": data.get("improvements", []),
                    },
                )
            )
            q.put(
                (
                    "__scoring_done__",
                    {
                        "data": data,
                        "elapsed_ms": int((time.time() - t0) * 1000),
                        "tokens": _usage_dict(final_msg.usage),
                    },
                )
            )
        except Exception as e:
            traceback.print_exc()
            q.put(("__scoring_failed__", str(e)))

    def sonnet_worker():
        try:
            t0 = time.time()
            content = user_content
            content += (
                "\n\nAlso score the improved_prompt you generate and include "
                "improved_dimensions and improved_overall_score in the JSON response."
            )
            resp = client.messages.create(
                model=model_id(),
                max_tokens=2048,
                system=[
                    {
                        "type": "text",
                        "text": EVALUATOR_IMPROVE_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": content}],
            )
            raw = next((b.text for b in resp.content if b.type == "text"), "")
            data = _parse_json(raw)
            q.put(
                (
                    "improve",
                    {
                        "improved_prompt": data.get("improved_prompt", ""),
                        "improved_dimensions": data.get("improved_dimensions"),
                        "improved_overall_score": data.get("improved_overall_score"),
                    },
                )
            )
            q.put(
                (
                    "__improve_done__",
                    {
                        "data": data,
                        "elapsed_ms": int((time.time() - t0) * 1000),
                        "tokens": _usage_dict(resp.usage),
                    },
                )
            )
        except Exception as e:
            traceback.print_exc()
            q.put(("__improve_failed__", str(e)))

    pool = ThreadPoolExecutor(max_workers=2)
    pool.submit(haiku_worker)
    if not skip_improved:
        pool.submit(sonnet_worker)

    scoring = None
    improve: dict | None = (
        {
            "data": {},
            "tokens": {"input": 0, "output": 0, "cache_read": 0, "cache_creation": 0},
            "elapsed_ms": 0,
        }
        if skip_improved
        else None
    )
    scoring_extras: dict = {}
    failed: str | None = None

    try:
        while scoring is None or improve is None:
            kind, payload = q.get()
            if kind == "__scoring_done__":
                scoring = payload
                # Persist + score immediately on scoring completion so XP and
                # badges can flow to the client while improve is still working.
                scoring_data = scoring["data"]
                scoring_data["dimensions"] = attach_citations(scoring_data.get("dimensions", []))
                try:
                    scoring_extras = _persist_scoring(
                        scoring_data,
                        prompt,
                        challenge_id,
                        mode,
                        user_id,
                        expect_improved=not skip_improved,
                    )
                except Exception as e:
                    traceback.print_exc()
                    failed = str(e)
                    break
                yield _sse("scoring_complete", scoring_extras)
                continue
            if kind == "__improve_done__":
                improve = payload
                _stash_improved(scoring_extras.get("session_token"), improve["data"])
                continue
            if kind == "__improve_failed__":
                _stash_improve_failure(scoring_extras.get("session_token"), payload)
                failed = payload
                break
            if kind.endswith("_failed__"):
                failed = payload
                break
            yield _sse(kind, payload)
    finally:
        pool.shutdown(wait=False)
        # If we exit while a slot is still un-fulfilled (scoring failed before
        # sonnet could finish, request abort, etc.), wake any waiting reveal.
        token = scoring_extras.get("session_token")
        if token:
            slot = _session_store.get(token)
            if slot is not None and not slot.ready.is_set():
                slot.error = failed or "Analysis interrupted"
                slot.ready.set()

    if failed:
        yield _sse("error", {"error": "Analysis failed", "detail": failed})
        return

    tokens = _sum_tokens(scoring["tokens"], improve["tokens"])
    yield _sse(
        "finalize",
        {
            "tokens": tokens,
            "analysis_time_ms": max(scoring["elapsed_ms"], improve["elapsed_ms"]),
        },
    )
    yield _sse("done", {})


@analyze_bp.route("/api/analyze", methods=["POST"])
def analyze():
    body = request.get_json(force=True)
    prompt = (body.get("prompt") or "").strip()
    context = (body.get("context") or "").strip() or None
    mode = body.get("mode", "training")
    challenge_id = (body.get("challenge_id") or "practice").strip()
    skip_improved = bool(body.get("skip_improved")) and mode == "training"
    user_id = session.get("user_id")

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400
    if len(prompt) > 8000:
        return jsonify({"error": "prompt exceeds 8000 character limit"}), 400

    return Response(
        _stream(prompt, context, mode, challenge_id, user_id, skip_improved),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@analyze_bp.route("/api/reveal", methods=["POST"])
def reveal():
    body = request.get_json(force=True)
    token = body.get("session_token", "")
    slot = _session_store.get(token)
    if slot is None:
        return jsonify({"error": "Invalid or expired session token"}), 404
    # Block until the sonnet worker either fills the slot or signals failure.
    # Event.wait() releases the GIL while waiting, unlike a sleep loop, and
    # wakes the instant the worker calls slot.ready.set().
    if not slot.ready.wait(timeout=REVEAL_WAIT_SECONDS):
        return jsonify({"error": "Improved prompt not ready"}), 504
    if slot.error or slot.data is None:
        return jsonify({"error": slot.error or "Improved prompt failed"}), 502
    return jsonify(slot.data)
