from typing import Dict, List, Set
from app.services.graph.builder import CodeGraph


def compute_connected_components(graph: CodeGraph) -> List[Set[str]]:
    visited: Set[str] = set()
    components: List[Set[str]] = []

    # Undirected adjacency for connectivity
    undirected: Dict[str, Set[str]] = {nid: set() for nid in graph.nodes}
    for e in graph.edges:
        undirected[e.source].add(e.target)
        undirected[e.target].add(e.source)

    for nid in graph.nodes:
        if nid not in visited:
            comp: Set[str] = set()
            stack = [nid]
            while stack:
                curr = stack.pop()
                if curr not in visited:
                    visited.add(curr)
                    comp.add(curr)
                    stack.extend(undirected[curr] - visited)
            components.append(comp)

    return components
