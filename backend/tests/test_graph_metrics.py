from app.services.graph.builder import CodeGraph
from app.services.graph.metrics import compute_connected_components
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_compute_connected_components():
    graph = CodeGraph()
    n1 = GraphNode(id="n1", label="1", node_type=GraphNodeType.FILE, file_path="1")
    n2 = GraphNode(id="n2", label="2", node_type=GraphNodeType.FILE, file_path="2")
    n3 = GraphNode(id="n3", label="3", node_type=GraphNodeType.FILE, file_path="3")

    graph.add_node(n1)
    graph.add_node(n2)
    graph.add_node(n3)

    graph.add_edge(GraphEdge(source="n1", target="n2", edge_type=GraphEdgeType.IMPORTS))

    comps = compute_connected_components(graph)
    assert len(comps) == 2
    lens = sorted(len(c) for c in comps)
    assert lens == [1, 2]
