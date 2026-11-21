from app.services.graph.architecture import ArchitectureAnalyzer
from app.services.graph.builder import CodeGraph
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_architecture_analyzer():
    graph = CodeGraph()
    hub = GraphNode(id="hub", label="hub_util", node_type=GraphNodeType.FUNCTION, file_path="hub.py")
    orphan = GraphNode(id="orphan", label="orphan_fn", node_type=GraphNodeType.FUNCTION, file_path="orphan.py")
    client = GraphNode(id="client", label="client_fn", node_type=GraphNodeType.FUNCTION, file_path="client.py")

    graph.add_node(hub)
    graph.add_node(orphan)
    graph.add_node(client)

    graph.add_edge(GraphEdge(source="client", target="hub", edge_type=GraphEdgeType.CALLS))

    analyzer = ArchitectureAnalyzer()
    res = analyzer.analyze(graph)

    assert res.total_nodes == 3
    assert res.total_edges == 1
    assert len(res.hotspots_fan_in) == 1
    assert res.hotspots_fan_in[0]["id"] == "hub"
    assert any(d["id"] == "orphan" for d in res.dead_code_candidates)
