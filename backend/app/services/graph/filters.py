from typing import List, Optional, Set
from app.services.graph.builder import CodeGraph
from app.services.graph.node import GraphEdge, GraphNode


def filter_subgraph(
    graph: CodeGraph,
    allowed_types: Optional[Set[str]] = None,
    path_prefix: Optional[str] = None,
) -> CodeGraph:
    sub = CodeGraph()
    for nid, node in graph.nodes.items():
        if allowed_types and node.node_type.value not in allowed_types:
            continue
        if path_prefix and not node.file_path.startswith(path_prefix):
            continue
        sub.add_node(node)

    for edge in graph.edges:
        if edge.source in sub.nodes and edge.target in sub.nodes:
            sub.add_edge(edge)

    return sub
