import pytest
from app.services.generation.citation_validator import CitationValidator


def test_extract_citations():
    validator = CitationValidator()
    text = "Here is [file:src/auth.py#L10-L20] and also [file:src/config.py#L5] and [file:README.md]."
    extracted = validator.extract_citations(text)
    assert len(extracted) == 3
    assert extracted[0] == ("[file:src/auth.py#L10-L20]", "src/auth.py", 10, 20)
    assert extracted[1] == ("[file:src/config.py#L5]", "src/config.py", 5, 5)
    assert extracted[2] == ("[file:README.md]", "README.md", None, None)


@pytest.mark.asyncio
async def test_citation_validator_rules():
    validator = CitationValidator()
    valid_paths = {"src/auth.py", "src/models.py"}

    # Valid citation
    text_valid = "Look at [file:src/auth.py#L1-L10]."
    cleaned, citations = await validator.validate_citations(
        session=None, repository_id=None, text=text_valid, valid_file_paths=valid_paths
    )
    assert len(citations) == 1
    assert citations[0].is_valid is True
    assert "[file:src/auth.py#L1-L10]" in cleaned

    # Hallucinated file
    text_hallucinated = "Look at [file:nonexistent/fake.py#L1-L10]."
    cleaned, citations = await validator.validate_citations(
        session=None, repository_id=None, text=text_hallucinated, valid_file_paths=valid_paths
    )
    assert len(citations) == 1
    assert citations[0].is_valid is False
    assert "unverified citation: nonexistent/fake.py" in cleaned

    # Invalid line bounds
    text_bad_lines = "Look at [file:src/auth.py#L20-L10]."
    cleaned, citations = await validator.validate_citations(
        session=None, repository_id=None, text=text_bad_lines, valid_file_paths=valid_paths
    )
    assert len(citations) == 1
    assert citations[0].is_valid is False
    assert "invalid range citation: src/auth.py" in cleaned
