from app.services.generation.evidence import EvidenceCandidate, EvidenceContextAssembler


def test_evidence_context_assembler():
    assembler = EvidenceContextAssembler()

    # Empty candidates
    empty_res = assembler.assemble("query", [])
    assert "No relevant repository evidence found" in empty_res

    # Formatted candidates
    cand = EvidenceCandidate(
        chunk_id="c1",
        file_path="src/main.py",
        symbol_name="start_app",
        chunk_type="function",
        start_line=10,
        end_line=20,
        language="python",
        content="def start_app():\n    pass",
        score=0.95,
        retrieval_sources=["symbol", "dense"],
    )
    res = assembler.assemble("how to start app", [cand])
    assert "src/main.py" in res
    assert "Lines 10-20" in res
    assert "def start_app():" in res
    assert "Symbol: start_app" in res
