from collections import deque
from typing import Set
from app.services.graph.builder import CodeGraph


def extract_ego_graph(graph: CodeGraph, center_node_id: str, k_hops: int = 2) -> CodeGraph:
    """
    Extracts the k-hop ego subgraph centered around a specific node.
    """
    sub = CodeGraph()
    if center_node_id not in graph.nodes:
        return sub

    visited: Set[str] = {center_node_id}
    queue = deque([(center_node_id, 0)])

    while queue:
        curr, depth = queue.popleft()
        if depth >= k_hops:
            continue

        neighbors = set(graph.adjacency.get(curr, [])).union(set(graph.reverse_adjacency.get(curr, [])))
        for neighbor in neighbors:
            if neighbor not in visited and neighbor in graph.nodes:
                visited.add(neighbor)
                queue.append((neighbor, depth + 1))

    for nid in visited:
        sub.add_node(graph.nodes[nid])

    for edge in graph.edges:
        if edge.source in visited and edge.target in visited:
            sub.add_edge(edge)

    return sub
