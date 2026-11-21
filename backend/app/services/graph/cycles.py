from dataclasses import dataclass
from typing import Dict, List, Set
from app.services.graph.builder import CodeGraph


@dataclass
class CyclePath:
    cycle_nodes: List[str]
    cycle_labels: List[str]
    length: int


class CycleDetector:
    """
    Detects circular dependencies in code intelligence graphs using Depth-First Search
    with active recursion tracking.
    """

    def find_cycles(self, graph: CodeGraph, node_type_filter: str = None) -> List[CyclePath]:
        visited: Set[str] = set()
        rec_stack: Set[str] = set()
        path: List[str] = []
        cycles: List[CyclePath] = []
        seen_cycles: Set[str] = set()

        # Filter nodes if node_type_filter provided
        target_nodes = [
            nid for nid, node in graph.nodes.items()
            if node_type_filter is None or node.node_type.value == node_type_filter
        ]

        def dfs(current: str):
            visited.add(current)
            rec_stack.add(current)
            path.append(current)

            for neighbor in graph.adjacency.get(current, []):
                if node_type_filter and graph.nodes[neighbor].node_type.value != node_type_filter:
                    continue

                if neighbor not in visited:
                    dfs(neighbor)
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start_idx = path.index(neighbor)
                    cycle_slice = path[cycle_start_idx:] + [neighbor]
                    canonical = "->".join(sorted(cycle_slice[:-1]))
                    if canonical not in seen_cycles:
                        seen_cycles.add(canonical)
                        labels = [graph.nodes[n].label for n in cycle_slice]
                        cycles.append(
                            CyclePath(
                                cycle_nodes=cycle_slice,
                                cycle_labels=labels,
                                length=len(cycle_slice) - 1,
                            )
                        )

            path.pop()
            rec_stack.remove(current)

        for node_id in target_nodes:
            if node_id not in visited:
                dfs(node_id)

        return cycles
