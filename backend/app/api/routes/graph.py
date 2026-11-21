from typing import Optional
import uuid
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession
from app.api.schemas.graph import (
    ArchitectureResponse,
    CyclesResponse,
    GraphEdgeSchema,
    GraphNodeSchema,
    GraphResponse,
    ImpactResponse,
)
from app.models.repository import Repository
from app.services.graph.architecture import ArchitectureAnalyzer
from app.services.graph.builder import CodeGraphBuilder
from app.services.graph.cycles import CycleDetector
from app.services.graph.impact import ImpactAnalyzer

router = APIRouter(prefix="/graph", tags=["Codebase Graph Intelligence"])

_builder = CodeGraphBuilder()
_cycle_detector = CycleDetector()
_impact_analyzer = ImpactAnalyzer()
_arch_analyzer = ArchitectureAnalyzer()


@router.get("/{repository_id}", response_model=GraphResponse)
async def get_repository_graph(
    repository_id: uuid.UUID,
    db: DBSession,
    include_symbols: bool = Query(True, description="Include function and class symbols"),
) -> GraphResponse:
    repo = await db.get(Repository, repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    graph = await _builder.build_repository_graph(db, repository_id, include_symbols=include_symbols)

    node_schemas = [
        GraphNodeSchema(
            id=n.id,
            label=n.label,
            type=n.node_type.value,
            file_path=n.file_path,
            start_line=n.start_line,
            end_line=n.end_line,
            metadata=n.metadata,
        )
        for n in graph.nodes.values()
    ]

    edge_schemas = [
        GraphEdgeSchema(
            source=e.source,
            target=e.target,
            type=e.edge_type.value,
            metadata=e.metadata,
        )
        for e in graph.edges
    ]

    return GraphResponse(
        repository_id=repository_id,
        nodes=node_schemas,
        edges=edge_schemas,
        total_nodes=len(node_schemas),
        total_edges=len(edge_schemas),
    )


@router.get("/{repository_id}/cycles", response_model=CyclesResponse)
async def get_graph_cycles(
    repository_id: uuid.UUID,
    db: DBSession,
    node_type: Optional[str] = Query(None, description="Optional node type filter: 'file' or 'function'"),
) -> CyclesResponse:
    repo = await db.get(Repository, repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    graph = await _builder.build_repository_graph(db, repository_id, include_symbols=True)
    cycles = _cycle_detector.find_cycles(graph, node_type_filter=node_type)

    cycle_schemas = [
        {
            "cycle_nodes": c.cycle_nodes,
            "cycle_labels": c.cycle_labels,
            "length": c.length,
        }
        for c in cycles
    ]

    return CyclesResponse(
        repository_id=repository_id,
        cycles_found=cycle_schemas,
        count=len(cycle_schemas),
    )


@router.get("/{repository_id}/impact/{target_id}", response_model=ImpactResponse)
async def get_node_impact(
    repository_id: uuid.UUID,
    target_id: str,
    db: DBSession,
    max_depth: int = Query(5, ge=1, le=20),
) -> ImpactResponse:
    repo = await db.get(Repository, repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    graph = await _builder.build_repository_graph(db, repository_id, include_symbols=True)
    if target_id not in graph.nodes:
        raise HTTPException(status_code=404, detail=f"Target node '{target_id}' not found in repository graph")

    impact = _impact_analyzer.analyze_impact(graph, target_id=target_id, max_depth=max_depth)

    return ImpactResponse(
        target_id=impact.target_node_id,
        target_label=impact.target_label,
        target_type=impact.target_type,
        upstream_dependents=impact.upstream_dependents,
        downstream_dependencies=impact.downstream_dependencies,
        total_affected_count=impact.total_affected_count,
        blast_radius_score=impact.blast_radius_score,
        risk_level=impact.risk_level,
    )


@router.get("/{repository_id}/architecture", response_model=ArchitectureResponse)
async def get_architecture_analysis(
    repository_id: uuid.UUID,
    db: DBSession,
    top_n: int = Query(5, ge=1, le=50),
) -> ArchitectureResponse:
    repo = await db.get(Repository, repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    graph = await _builder.build_repository_graph(db, repository_id, include_symbols=True)
    arch = _arch_analyzer.analyze(graph, top_n=top_n)

    return ArchitectureResponse(
        repository_id=repository_id,
        total_nodes=arch.total_nodes,
        total_edges=arch.total_edges,
        density=arch.density,
        hotspots_fan_in=arch.hotspots_fan_in,
        hotspots_fan_out=arch.hotspots_fan_out,
        dead_code_candidates=arch.dead_code_candidates,
    )
