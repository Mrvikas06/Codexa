from app.services.graph.builder import CodeGraph
from app.services.graph.cycles import CycleDetector
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType


def test_cycle_detector():
    graph = CodeGraph()
    n1 = GraphNode(id="n1", label="file1.py", node_type=GraphNodeType.FILE, file_path="file1.py")
    n2 = GraphNode(id="n2", label="file2.py", node_type=GraphNodeType.FILE, file_path="file2.py")
    n3 = GraphNode(id="n3", label="file3.py", node_type=GraphNodeType.FILE, file_path="file3.py")

    graph.add_node(n1)
    graph.add_node(n2)
    graph.add_node(n3)

    # Create cycle: n1 -> n2 -> n3 -> n1
    graph.add_edge(GraphEdge(source="n1", target="n2", edge_type=GraphEdgeType.IMPORTS))
    graph.add_edge(GraphEdge(source="n2", target="n3", edge_type=GraphEdgeType.IMPORTS))
    graph.add_edge(GraphEdge(source="n3", target="n1", edge_type=GraphEdgeType.IMPORTS))

    detector = CycleDetector()
    cycles = detector.find_cycles(graph)

    assert len(cycles) == 1
    assert cycles[0].length == 3
    assert "file1.py" in cycles[0].cycle_labels
