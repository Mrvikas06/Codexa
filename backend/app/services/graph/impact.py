from collections import deque
from dataclasses import dataclass
from typing import Dict, List, Set
from app.services.graph.builder import CodeGraph


@dataclass
class ImpactAnalysisResult:
    target_node_id: str
    target_label: str
    target_type: str
    upstream_dependents: List[Dict[str, str]]
    downstream_dependencies: List[Dict[str, str]]
    total_affected_count: int
    blast_radius_score: float
    risk_level: str


class ImpactAnalyzer:
    """
    Computes change impact and blast radius: answers "What breaks if I change this function or file?"
    """

    def analyze_impact(
        self,
        graph: CodeGraph,
        target_id: str,
        max_depth: int = 5,
    ) -> ImpactAnalysisResult:
        if target_id not in graph.nodes:
            raise KeyError(f"Node '{target_id}' not found in code graph")

        target_node = graph.nodes[target_id]

        # 1. Upstream dependents: who calls or imports this target? (traversing reverse_adjacency)
        upstream_ids = self._traverse_bfs(graph.reverse_adjacency, target_id, max_depth)
        # 2. Downstream dependencies: what does target call or import? (traversing adjacency)
        downstream_ids = self._traverse_bfs(graph.adjacency, target_id, max_depth)

        upstream_list = [
            {"id": uid, "label": graph.nodes[uid].label, "type": graph.nodes[uid].node_type.value, "file": graph.nodes[uid].file_path}
            for uid in upstream_ids if uid in graph.nodes
        ]
        downstream_list = [
            {"id": did, "label": graph.nodes[did].label, "type": graph.nodes[did].node_type.value, "file": graph.nodes[did].file_path}
            for did in downstream_ids if did in graph.nodes
        ]

        all_affected = set(upstream_ids).union(set(downstream_ids))
        total_nodes = len(graph.nodes)
        blast_score = len(all_affected) / total_nodes if total_nodes > 0 else 0.0

        if blast_score >= 0.3:
            risk = "CRITICAL"
        elif blast_score >= 0.15:
            risk = "HIGH"
        elif blast_score >= 0.05:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return ImpactAnalysisResult(
            target_node_id=target_id,
            target_label=target_node.label,
            target_type=target_node.node_type.value,
            upstream_dependents=upstream_list,
            downstream_dependencies=downstream_list,
            total_affected_count=len(all_affected),
            blast_radius_score=round(blast_score, 4),
            risk_level=risk,
        )

    def _traverse_bfs(
        self,
        adj: Dict[str, List[str]],
        start_id: str,
        max_depth: int,
    ) -> List[str]:
        visited: Set[str] = set()
        queue = deque([(start_id, 0)])

        while queue:
            curr, depth = queue.popleft()
            if depth >= max_depth:
                continue

            for neighbor in adj.get(curr, []):
                if neighbor not in visited and neighbor != start_id:
                    visited.add(neighbor)
                    queue.append((neighbor, depth + 1))

        return list(visited)
