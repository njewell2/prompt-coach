"""Background clustering worker for facilitator response themes.

A single background thread serializes clustering jobs. Re-cluster requests during an
in-flight job set a 'dirty' flag; the worker notices and re-runs after the current pass.
This coalesces bursts of logins into at most one extra cluster.
"""
import json
import re
import threading
import traceback

from backend.common.llm import get_client, model_id
from backend.db import get_all_focus_responses, save_cluster
from backend.prompts.cluster_themes import THEME_CLUSTERING_SYSTEM, build_user_message

_lock = threading.Lock()
_running = False
_dirty = False
_worker_thread: threading.Thread | None = None


def is_running() -> bool:
    with _lock:
        return _running


def request_cluster() -> None:
    """Called after a new focus_response is saved. Starts the worker if idle,
    or flags the in-flight run to repeat."""
    global _running, _dirty, _worker_thread
    with _lock:
        if _running:
            _dirty = True
            return
        _running = True
        _dirty = False
        _worker_thread = threading.Thread(target=_run_loop, daemon=True)
        _worker_thread.start()


def _run_loop() -> None:
    global _running, _dirty
    try:
        while True:
            try:
                _do_cluster()
            except Exception:
                traceback.print_exc()
            with _lock:
                if not _dirty:
                    _running = False
                    return
                _dirty = False
    finally:
        with _lock:
            _running = False


def _do_cluster() -> None:
    responses = get_all_focus_responses()
    if not responses:
        return
    # Trivial case: skip LLM call when there's nothing to cluster.
    if len(responses) == 1:
        save_cluster(
            [{"name": "Responses", "description": "All responses so far.", "quote_ids": [responses[0]["id"]]}],
            1,
        )
        return

    client = get_client()
    user_msg = build_user_message(responses)
    response = client.messages.create(
        model=model_id(),
        max_tokens=2048,
        system=[{"type": "text", "text": THEME_CLUSTERING_SYSTEM, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = next((b.text for b in response.content if b.type == "text"), "")
    data = _extract_json(raw)
    themes = _normalize_themes(data.get("themes", []), [r["id"] for r in responses])
    save_cluster(themes, len(responses))


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            raise ValueError("Model returned non-JSON response")
        return json.loads(match.group(0))


def _normalize_themes(themes: list, all_ids: list[int]) -> list[dict]:
    """Ensure every response id appears in exactly one theme."""
    seen: set[int] = set()
    out: list[dict] = []
    for t in themes:
        name = str(t.get("name", "")).strip() or "Untitled"
        desc = str(t.get("description", "")).strip()
        ids = []
        for qid in t.get("quote_ids", []):
            try:
                qid_int = int(qid)
            except (TypeError, ValueError):
                continue
            if qid_int in all_ids and qid_int not in seen:
                ids.append(qid_int)
                seen.add(qid_int)
        if ids:
            out.append({"name": name, "description": desc, "quote_ids": ids})

    missing = [qid for qid in all_ids if qid not in seen]
    if missing:
        out.append({"name": "Other", "description": "Responses that didn't fit other themes.", "quote_ids": missing})
    return out
