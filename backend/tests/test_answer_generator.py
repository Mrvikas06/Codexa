import pytest
import uuid
from app.services.generation.evidence import EvidenceCandidate
from app.services.generation.generator import AnswerGenerator


@pytest.mark.asyncio
async def test_answer_generator_empty_candidates():
    generator = AnswerGenerator()
    answer = await generator.generate_answer(
        session=None,
        repository_id=uuid.uuid4(),
        query="unknown function",
        candidates=[],
    )
    assert answer.is_verified is False
    assert "couldn't verify" in answer.summary.lower()


@pytest.mark.asyncio
async def test_answer_generator_with_grounded_candidates():
    generator = AnswerGenerator()
    cand = EvidenceCandidate(
        chunk_id="chunk-123",
        file_path="src/auth.py",
        symbol_name="login",
        chunk_type="function",
        start_line=1,
        end_line=15,
        language="python",
        content="def login(username, password):\n    return True",
        score=0.98,
        retrieval_sources=["symbol", "dense"],
    )

    class MockValidator:
        async def validate_citations(self, session, repository_id, text, valid_file_paths=None):
            from app.services.generation.citation_validator import ValidatedCitation
            return text, [
                ValidatedCitation(
                    raw_citation="[file:src/auth.py#L1-L15]",
                    file_path="src/auth.py",
                    start_line=1,
                    end_line=15,
                    is_valid=True,
                    file_id=str(uuid.uuid4()),
                )
            ]

    generator.validator = MockValidator()
    answer = await generator.generate_answer(
        session=None,
        repository_id=uuid.uuid4(),
        query="where is login implemented",
        candidates=[cand],
    )

    assert answer.is_verified is True
    assert "src/auth.py" in answer.summary
    assert len(answer.findings) >= 1
    assert len(answer.evidence_cards) == 1
    assert answer.evidence_cards[0]["symbol_name"] == "login"
    assert len(answer.citations) == 1
    assert answer.citations[0]["is_valid"] is True
