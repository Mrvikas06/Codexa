from app.services.graph.builder import CodeGraph
from app.services.graph.export import export_to_dot
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_export_to_dot():
    graph = CodeGraph()
    n1 = GraphNode(id="a", label="A", node_type=GraphNodeType.FILE, file_path="a.py")
    n2 = GraphNode(id="b", label="B", node_type=GraphNodeType.FILE, file_path="b.py")
    graph.add_node(n1)
    graph.add_node(n2)
    graph.add_edge(GraphEdge(source="a", target="b", edge_type=GraphEdgeType.IMPORTS))

    dot = export_to_dot(graph)
    assert "digraph CodeAtlas" in dot
    assert '"a" -> "b"' in dot
