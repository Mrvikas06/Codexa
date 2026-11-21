from app.services.graph.builder import CodeGraph


def export_to_dot(graph: CodeGraph, graph_name: str = "CodeAtlas") -> str:
    """
    Exports a CodeGraph to standard Graphviz DOT format.
    """
    lines = [f"digraph {graph_name} {{", '  rankdir="TB";', '  node [shape="box"];']
    for nid, node in graph.nodes.items():
        lines.append(f'  "{nid}" [label="{node.label} ({node.node_type.value})"];')

    for edge in graph.edges:
        lines.append(f'  "{edge.source}" -> "{edge.target}" [label="{edge.edge_type.value}"];')

    lines.append("}")
    return "\n".join(lines)
