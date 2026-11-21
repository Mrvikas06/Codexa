from typing import Dict, List, Tuple
from app.services.graph.builder import CodeGraph


def calculate_hierarchical_layout(
    graph: CodeGraph,
    x_gap: float = 240.0,
    y_gap: float = 120.0,
) -> Dict[str, Tuple[float, float]]:
    """
    Computes deterministic 2D coordinates (x, y) for nodes using topological layering.
    Ideal for React Flow rendering.
    """
    in_degrees = {nid: len(graph.reverse_adjacency.get(nid, [])) for nid in graph.nodes}
    levels: Dict[str, int] = {}

    # Assign roots to level 0
    current_level = [nid for nid, deg in in_degrees.items() if deg == 0]
    if not current_level:
        current_level = list(graph.nodes.keys())[:1]

    lvl = 0
    visited = set(current_level)
    for nid in current_level:
        levels[nid] = lvl

    while current_level:
        next_level = []
        for curr in current_level:
            for neighbor in graph.adjacency.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    levels[neighbor] = lvl + 1
                    next_level.append(neighbor)
        lvl += 1
        current_level = next_level

    # Fallback for disconnected nodes
    for nid in graph.nodes:
        if nid not in levels:
            levels[nid] = lvl

    # Group by level and compute positions
    level_groups: Dict[int, List[str]] = {}
    for nid, level in levels.items():
        level_groups.setdefault(level, []).append(nid)

    positions: Dict[str, Tuple[float, float]] = {}
    for level, nodes in level_groups.items():
        y = level * y_gap
        for idx, nid in enumerate(nodes):
            x = idx * x_gap
            positions[nid] = (x, y)

    return positions
