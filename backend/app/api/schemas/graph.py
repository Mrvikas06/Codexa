from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict


class GraphNodeSchema(BaseModel):
    id: str
    label: str
    type: str
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    metadata: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    type: str
    metadata: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class GraphResponse(BaseModel):
    repository_id: uuid.UUID
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]
    total_nodes: int
    total_edges: int


class CycleItemSchema(BaseModel):
    cycle_nodes: List[str]
    cycle_labels: List[str]
    length: int


class CyclesResponse(BaseModel):
    repository_id: uuid.UUID
    cycles_found: List[CycleItemSchema]
    count: int


class ImpactItemSchema(BaseModel):
    id: str
    label: str
    type: str
    file: str


class ImpactResponse(BaseModel):
    target_id: str
    target_label: str
    target_type: str
    upstream_dependents: List[ImpactItemSchema]
    downstream_dependencies: List[ImpactItemSchema]
    total_affected_count: int
    blast_radius_score: float
    risk_level: str


class HotspotItemSchema(BaseModel):
    id: str
    label: str
    type: str
    file: str
    fan_in: Optional[int] = None
    fan_out: Optional[int] = None


class DeadCodeItemSchema(BaseModel):
    id: str
    label: str
    type: str
    file: str


class ArchitectureResponse(BaseModel):
    repository_id: uuid.UUID
    total_nodes: int
    total_edges: int
    density: float
    hotspots_fan_in: List[HotspotItemSchema]
    hotspots_fan_out: List[HotspotItemSchema]
    dead_code_candidates: List[DeadCodeItemSchema]
