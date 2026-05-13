DIMENSION_CITATIONS: dict[str, dict[str, str]] = {
    "clarity": {
        "source": "Anthropic",
        "quote": "Treat the model like a brilliant new employee who lacks context on your norms — the more precisely you explain what you want, the better the result.",
        "reference": "Anthropic Prompt Engineering Guide",
    },
    "context": {
        "source": "Anthropic",
        "quote": "Providing context or motivation behind your instructions can help Claude better understand your goals and deliver more targeted responses.",
        "reference": "Anthropic Prompt Engineering Guide",
    },
    "output": {
        "source": "Anthropic",
        "quote": "Use a list of dos and don'ts to clearly bound the task. Tell Claude exactly what it should and should not include, what tone to use, and what length to target.",
        "reference": "Anthropic Prompt Engineering Guide",
    },
    "examples": {
        "source": "Anthropic",
        "quote": "A few well-crafted examples (known as few-shot or multishot prompting) can dramatically improve accuracy and consistency.",
        "reference": "Anthropic Prompt Engineering Guide",
    },
    "thinking": {
        "source": "arXiv",
        "quote": "Chain-of-thought prompting — adding 'think step by step' or enumerating reasoning steps — substantially improves accuracy on multi-step reasoning tasks.",
        "reference": "Wei et al., Chain-of-Thought Prompting (NeurIPS 2022)",
    },
}


def attach_citations(dimensions: list[dict]) -> list[dict]:
    for d in dimensions:
        cite = DIMENSION_CITATIONS.get(d.get("id"))
        if cite:
            d["citation"] = cite
    return dimensions
