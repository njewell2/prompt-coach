"""Helpers for parsing in-progress JSON streamed from a model.

The evaluator streams a JSON object whose `dimensions` array contains 5
fully-formed sub-objects. We want to surface each sub-object to the client
the moment its closing brace arrives, without waiting for the whole
response.
"""

from __future__ import annotations

import json
import re

_DIMENSIONS_OPEN = re.compile(r'"dimensions"\s*:\s*\[')


def extract_completed_dimensions(buffer: str, already_emitted: int) -> tuple[list[dict], int]:
    """Scan a partial JSON buffer and return any newly completed dimension
    objects inside the top-level `dimensions` array.

    Args:
        buffer: the accumulated JSON text seen so far.
        already_emitted: how many dimension objects the caller has already
            received from prior calls; only objects past this index are
            returned.

    Returns:
        (new_dimensions, total_emitted) — the new dicts plus an updated
        count that should be passed back as `already_emitted` next call.
    """
    match = _DIMENSIONS_OPEN.search(buffer)
    if not match:
        return [], already_emitted

    i = match.end()
    n = len(buffer)
    in_string = False
    escape = False
    depth = 0
    obj_start = -1
    completed: list[str] = []

    while i < n:
        ch = buffer[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                if depth == 0:
                    obj_start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and obj_start >= 0:
                    completed.append(buffer[obj_start : i + 1])
                    obj_start = -1
            elif ch == "]" and depth == 0:
                break

        i += 1

    if len(completed) <= already_emitted:
        return [], already_emitted

    new_dims: list[dict] = []
    for raw in completed[already_emitted:]:
        try:
            new_dims.append(json.loads(raw, strict=False))
        except json.JSONDecodeError:
            continue

    return new_dims, already_emitted + len(new_dims)
