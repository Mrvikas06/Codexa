from app.services.graph.builder import CodeGraph
from app.services.graph.layout import calculate_hierarchical_layout
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_calculate_hierarchical_layout():
    graph = CodeGraph()
    n1 = GraphNode(id="n1", label="root", node_type=GraphNodeType.FILE, file_path="root.py")
    n2 = GraphNode(id="n2", label="child", node_type=GraphNodeType.FILE, file_path="child.py")
    graph.add_node(n1)
    graph.add_node(n2)
    graph.add_edge(GraphEdge(source="n1", target="n2", edge_type=GraphEdgeType.IMPORTS))

    positions = calculate_hierarchical_layout(graph)
    assert "n1" in positions
    assert "n2" in positions
    # n2 should have a higher y coordinate than n1
    assert positions["n2"][1] > positions["n1"][1]
