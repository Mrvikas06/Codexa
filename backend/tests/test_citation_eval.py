from app.services.generation.eval import evaluate_citation_precision_recall


def test_evaluate_citation_precision_recall():
    metrics = evaluate_citation_precision_recall(
        cited_files=["src/auth.py", "src/models.py"],
        ground_truth_files=["src/auth.py", "src/utils.py"],
    )
    assert metrics["precision"] == 0.5
    assert metrics["recall"] == 0.5
    assert round(metrics["f1"], 2) == 0.50

    perfect = evaluate_citation_precision_recall(
        cited_files=["src/auth.py"],
        ground_truth_files=["src/auth.py"],
    )
    assert perfect["precision"] == 1.0
    assert perfect["recall"] == 1.0
    assert perfect["f1"] == 1.0
