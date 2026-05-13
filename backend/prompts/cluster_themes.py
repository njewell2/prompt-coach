THEME_CLUSTERING_SYSTEM = """You are analyzing responses to the question:
"Where do you see AI being most valuable in your work?"

Group them into 3-6 themes that capture meaningfully distinct perspectives.
Every response ID must appear in exactly one theme. If a response doesn't fit any common
theme, create or use a small "Other" theme for it rather than forcing a bad fit.

Return ONLY JSON in this exact shape — no prose, no markdown, no code fences:
{"themes": [{"name": "2-5 word label", "description": "one-sentence explanation", "quote_ids": [1, 4, 7]}]}"""


def build_user_message(responses: list[dict]) -> str:
    """responses: list of {id, text}"""
    import json
    compact = [{"id": r["id"], "text": r["text"]} for r in responses]
    return f"<responses>\n{json.dumps(compact, ensure_ascii=False)}\n</responses>"
