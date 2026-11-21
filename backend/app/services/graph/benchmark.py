import json
from pathlib import Path
from typing import Any, Dict, List
from app.services.graph.builder import CodeGraph
from app.services.graph.cycles import CycleDetector
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def evaluate_cycle_benchmarks(bench_path: str) -> Dict[str, Any]:
    with open(bench_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    detector = CycleDetector()
    results = []

    for case in cases:
        graph = CodeGraph()
        nodes = set()
        for src, tgt in case["edges"]:
            nodes.add(src)
            nodes.add(tgt)

        for n in nodes:
            graph.add_node(GraphNode(id=n, label=n, node_type=GraphNodeType.MODULE, file_path=f"{n}.py"))

        for src, tgt in case["edges"]:
            graph.add_edge(GraphEdge(source=src, target=tgt, edge_type=GraphEdgeType.IMPORTS))

        detected = detector.find_cycles(graph)
        is_pass = len(detected) == case["expected_cycles_count"]
        results.append({
            "id": case["id"],
            "expected": case["expected_cycles_count"],
            "actual": len(detected),
            "passed": is_pass,
        })

    all_passed = all(r["passed"] for r in results)
    return {"total": len(cases), "passed_count": sum(1 for r in results if r["passed"]), "all_passed": all_passed, "details": results}
