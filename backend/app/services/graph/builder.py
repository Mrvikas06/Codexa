from typing import Dict, List, Optional, Set, Tuple
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.file import File
from app.models.symbol import Dependency, DependencyType, Symbol, SymbolType
from app.services.graph.node import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType

logger = get_logger("services.graph.builder")


class CodeGraph:
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.adjacency: Dict[str, List[str]] = {}
        self.reverse_adjacency: Dict[str, List[str]] = {}

    def add_node(self, node: GraphNode):
        self.nodes[node.id] = node
        if node.id not in self.adjacency:
            self.adjacency[node.id] = []
        if node.id not in self.reverse_adjacency:
            self.reverse_adjacency[node.id] = []

    def add_edge(self, edge: GraphEdge):
        if edge.source not in self.nodes or edge.target not in self.nodes:
            return
        self.edges.append(edge)
        self.adjacency[edge.source].append(edge.target)
        self.reverse_adjacency[edge.target].append(edge.source)


class CodeGraphBuilder:
    """
    Builds in-memory directed code intelligence graphs from indexed database records.
    """

    async def build_repository_graph(
        self,
        session: AsyncSession,
        repository_id: uuid.UUID,
        include_symbols: bool = True,
    ) -> CodeGraph:
        graph = CodeGraph()

        # 1. Fetch files
        file_stmt = select(File).where(File.repository_id == repository_id)
        file_result = await session.execute(file_stmt)
        files = file_result.scalars().all()
        file_map: Dict[uuid.UUID, File] = {f.id: f for f in files}

        for f in files:
            graph.add_node(
                GraphNode(
                    id=str(f.id),
                    label=f.filename,
                    node_type=GraphNodeType.FILE,
                    file_path=f.path,
                    metadata={"language": f.language, "size_bytes": f.size_bytes},
                )
            )

        if not file_map:
            return graph

        # 2. Fetch symbols
        sym_stmt = select(Symbol).where(Symbol.file_id.in_(list(file_map.keys())))
        sym_result = await session.execute(sym_stmt)
        symbols = sym_result.scalars().all()
        sym_map: Dict[uuid.UUID, Symbol] = {s.id: s for s in symbols}

        if include_symbols:
            for sym in symbols:
                nt = GraphNodeType.FUNCTION
                if sym.symbol_type == SymbolType.CLASS:
                    nt = GraphNodeType.CLASS
                elif sym.symbol_type == SymbolType.METHOD:
                    nt = GraphNodeType.METHOD

                file_obj = file_map.get(sym.file_id)
                f_path = file_obj.path if file_obj else "unknown"

                sym_node = GraphNode(
                    id=str(sym.id),
                    label=sym.name,
                    node_type=nt,
                    file_path=f_path,
                    start_line=sym.start_line,
                    end_line=sym.end_line,
                    metadata={"signature": sym.signature},
                )
                graph.add_node(sym_node)

                # Link file -> symbol (DEFINES)
                graph.add_edge(
                    GraphEdge(
                        source=str(sym.file_id),
                        target=str(sym.id),
                        edge_type=GraphEdgeType.DEFINES,
                    )
                )

        # 3. Fetch dependencies between symbols
        if sym_map:
            dep_stmt = select(Dependency).where(Dependency.source_symbol_id.in_(list(sym_map.keys())))
            dep_result = await session.execute(dep_stmt)
            deps = dep_result.scalars().all()

            for dep in deps:
                src_sym = sym_map.get(dep.source_symbol_id)
                tgt_sym = sym_map.get(dep.target_symbol_id)

                if include_symbols and str(dep.source_symbol_id) in graph.nodes and str(dep.target_symbol_id) in graph.nodes:
                    graph.add_edge(
                        GraphEdge(
                            source=str(dep.source_symbol_id),
                            target=str(dep.target_symbol_id),
                            edge_type=GraphEdgeType.CALLS if dep.dependency_type == DependencyType.CALLS else GraphEdgeType.IMPORTS,
                        )
                    )

                # Also add file-to-file edge if across files
                if src_sym and tgt_sym and src_sym.file_id != tgt_sym.file_id:
                    graph.add_edge(
                        GraphEdge(
                            source=str(src_sym.file_id),
                            target=str(tgt_sym.file_id),
                            edge_type=GraphEdgeType.IMPORTS,
                        )
                    )

        return graph
