from app.services.graph.builder import CodeGraph
from app.services.graph.filters import filter_subgraph
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_filter_subgraph():
    graph = CodeGraph()
    n1 = GraphNode(id="n1", label="f1", node_type=GraphNodeType.FILE, file_path="src/a.py")
    n2 = GraphNode(id="n2", label="f2", node_type=GraphNodeType.FUNCTION, file_path="tests/b.py")
    graph.add_node(n1)
    graph.add_node(n2)
    graph.add_edge(GraphEdge(source="n1", target="n2", edge_type=GraphEdgeType.CALLS))

    sub = filter_subgraph(graph, path_prefix="src/")
    assert "n1" in sub.nodes
    assert "n2" not in sub.nodes
    assert len(sub.edges) == 0
