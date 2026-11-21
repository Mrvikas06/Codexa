from app.services.graph.builder import CodeGraph
from app.services.graph.impact import ImpactAnalyzer
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_impact_analyzer():
    graph = CodeGraph()
    n_core = GraphNode(id="core", label="core_service", node_type=GraphNodeType.FUNCTION, file_path="core.py")
    n_caller1 = GraphNode(id="c1", label="api_endpoint", node_type=GraphNodeType.FUNCTION, file_path="api.py")
    n_caller2 = GraphNode(id="c2", label="worker_task", node_type=GraphNodeType.FUNCTION, file_path="worker.py")
    n_dep = GraphNode(id="dep", label="db_query", node_type=GraphNodeType.FUNCTION, file_path="db.py")

    for n in [n_core, n_caller1, n_caller2, n_dep]:
        graph.add_node(n)

    # c1 calls core, c2 calls core, core calls dep
    graph.add_edge(GraphEdge(source="c1", target="core", edge_type=GraphEdgeType.CALLS))
    graph.add_edge(GraphEdge(source="c2", target="core", edge_type=GraphEdgeType.CALLS))
    graph.add_edge(GraphEdge(source="core", target="dep", edge_type=GraphEdgeType.CALLS))

    analyzer = ImpactAnalyzer()
    res = analyzer.analyze_impact(graph, target_id="core")

    assert res.target_label == "core_service"
    assert len(res.upstream_dependents) == 2  # c1 and c2 depend on core
    assert len(res.downstream_dependencies) == 1  # core depends on dep
    assert res.total_affected_count == 3
    assert res.blast_radius_score == 0.75
    assert res.risk_level == "CRITICAL"
