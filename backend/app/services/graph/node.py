from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class GraphNodeType(str, Enum):
    FILE = "file"
    MODULE = "module"
    CLASS = "class"
    FUNCTION = "function"
    METHOD = "method"


class GraphEdgeType(str, Enum):
    IMPORTS = "imports"
    CALLS = "calls"
    DEFINES = "defines"
    INHERITS = "inherits"


@dataclass
class GraphNode:
    id: str
    label: str
    node_type: GraphNodeType
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    source: str
    target: str
    edge_type: GraphEdgeType
    metadata: Dict[str, Any] = field(default_factory=dict)
