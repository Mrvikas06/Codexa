from app.services.graph.builder import CodeGraph
from app.services.graph.neighborhood import extract_ego_graph
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_extract_ego_graph():
    graph = CodeGraph()
    n1 = GraphNode(id="1", label="1", node_type=GraphNodeType.FILE, file_path="1")
    n2 = GraphNode(id="2", label="2", node_type=GraphNodeType.FILE, file_path="2")
    n3 = GraphNode(id="3", label="3", node_type=GraphNodeType.FILE, file_path="3")
    n4 = GraphNode(id="4", label="4", node_type=GraphNodeType.FILE, file_path="4")

    for n in [n1, n2, n3, n4]:
        graph.add_node(n)

    # 1 -> 2 -> 3 -> 4
    graph.add_edge(GraphEdge(source="1", target="2", edge_type=GraphEdgeType.CALLS))
    graph.add_edge(GraphEdge(source="2", target="3", edge_type=GraphEdgeType.CALLS))
    graph.add_edge(GraphEdge(source="3", target="4", edge_type=GraphEdgeType.CALLS))

    # 1-hop around 2 should include 1, 2, 3 but NOT 4
    ego = extract_ego_graph(graph, center_node_id="2", k_hops=1)
    assert "1" in ego.nodes
    assert "2" in ego.nodes
    assert "3" in ego.nodes
    assert "4" not in ego.nodes
