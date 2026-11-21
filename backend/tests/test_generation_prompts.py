from app.services.generation.prompts import SYSTEM_PROMPT, format_prompt


def test_generation_prompts():
    assert "CodeAtlas AI" in SYSTEM_PROMPT
    prompt = format_prompt("Where is auth?", "src/auth.py evidence")
    assert "Where is auth?" in prompt
    assert "src/auth.py evidence" in prompt
    assert "Structured Grounded Answer:" in prompt
