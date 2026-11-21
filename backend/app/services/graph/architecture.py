from dataclasses import dataclass
from typing import Any, Dict, List
from app.services.graph.builder import CodeGraph
from app.services.graph.node import GraphNodeType


@dataclass
class NodeMetrics:
    id: str
    label: str
    node_type: str
    file_path: str
    fan_in: int
    fan_out: int


@dataclass
class ArchitectureAnalysisResult:
    total_nodes: int
    total_edges: int
    density: float
    hotspots_fan_in: List[Dict[str, Any]]
    hotspots_fan_out: List[Dict[str, Any]]
    dead_code_candidates: List[Dict[str, Any]]


class ArchitectureAnalyzer:
    """
    Analyzes codebase architecture topology:
    - Coupling hotspots (high fan-in or fan-out)
    - Dead / unreferenced symbol candidates
    - Graph connectivity and density
    """

    def analyze(self, graph: CodeGraph, top_n: int = 5) -> ArchitectureAnalysisResult:
        total_nodes = len(graph.nodes)
        total_edges = len(graph.edges)

        max_possible_edges = total_nodes * (total_nodes - 1) if total_nodes > 1 else 1
        density = round(total_edges / max_possible_edges, 4)

        metrics_list: List[NodeMetrics] = []
        for nid, node in graph.nodes.items():
            fin = len(graph.reverse_adjacency.get(nid, []))
            fout = len(graph.adjacency.get(nid, []))
            metrics_list.append(
                NodeMetrics(
                    id=nid,
                    label=node.label,
                    node_type=node.node_type.value,
                    file_path=node.file_path,
                    fan_in=fin,
                    fan_out=fout,
                )
            )

        # Hotspots by fan-in (most depended-on / critical)
        by_fan_in = sorted(metrics_list, key=lambda m: m.fan_in, reverse=True)[:top_n]
        hotspots_fan_in = [
            {"id": m.id, "label": m.label, "type": m.node_type, "file": m.file_path, "fan_in": m.fan_in}
            for m in by_fan_in if m.fan_in > 0
        ]

        # Hotspots by fan-out (most dependencies / coordinators)
        by_fan_out = sorted(metrics_list, key=lambda m: m.fan_out, reverse=True)[:top_n]
        hotspots_fan_out = [
            {"id": m.id, "label": m.label, "type": m.node_type, "file": m.file_path, "fan_out": m.fan_out}
            for m in by_fan_out if m.fan_out > 0
        ]

        # Dead code candidates: symbols with fan-in == 0 (excluding files)
        dead_candidates = [
            {"id": m.id, "label": m.label, "type": m.node_type, "file": m.file_path}
            for m in metrics_list
            if m.node_type in (GraphNodeType.FUNCTION.value, GraphNodeType.CLASS.value) and m.fan_in == 0
        ][:10]

        return ArchitectureAnalysisResult(
            total_nodes=total_nodes,
            total_edges=total_edges,
            density=density,
            hotspots_fan_in=hotspots_fan_in,
            hotspots_fan_out=hotspots_fan_out,
            dead_code_candidates=dead_candidates,
        )
