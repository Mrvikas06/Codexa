SYSTEM_PROMPT = """You are CodeAtlas AI, a codebase intelligence engine.
Your purpose is to explain architecture, execution paths, dependencies, and implementations strictly grounded in the indexed repository evidence.

Rules:
1. Every factual assertion must cite an exact evidence card using [file:<path>#L<start>-L<end>].
2. Distinguish: verified facts, evidence-supported inferences, hypotheses, and unknown information.
3. If no evidence supports a claim, explicitly state: "I couldn't verify this from the indexed repository."
4. Never hallucinate functions, file paths, or line numbers.
"""

SECTIONS_TEMPLATE = """### Summary
{summary}

### Findings
{findings}

### Code Path
{code_path}

### Evidence
{evidence}

### Risks & Considerations
{risks}

### Recommendations
{recommendations}
"""


def format_prompt(query: str, evidence_context: str) -> str:
    return f"{SYSTEM_PROMPT}\n\nEvidence Context:\n{evidence_context}\n\nUser Question:\n{query}\n\nStructured Grounded Answer:"
