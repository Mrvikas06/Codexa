from typing import Any, Dict, List, Set


def evaluate_citation_precision_recall(
    cited_files: List[str],
    ground_truth_files: List[str],
) -> Dict[str, float]:
    cited_set: Set[str] = set(cited_files)
    gt_set: Set[str] = set(ground_truth_files)

    if not cited_set and not gt_set:
        return {"precision": 1.0, "recall": 1.0, "f1": 1.0}
    if not cited_set or not gt_set:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}

    true_positives = len(cited_set.intersection(gt_set))
    precision = true_positives / len(cited_set)
    recall = true_positives / len(gt_set)
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }
