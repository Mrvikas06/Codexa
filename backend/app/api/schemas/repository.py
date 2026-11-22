import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ImportRepoRequest(BaseModel):
    workspace_id: uuid.UUID
    url: str = Field(..., description="Git clone URL (HTTPS or SSH)")
    name: Optional[str] = Field(None, description="Optional custom name; defaults to repo name")
    branch: Optional[str] = Field("main", description="Target branch to clone")
    description: Optional[str] = None


class RepositoryResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    url: Optional[str]
    description: Optional[str]
    default_branch: str
    status: str
    total_files: int
    total_functions: int
    total_classes: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IndexingJobResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    job_type: str
    status: str
    total_files: int
    processed_files: int
    failed_files: int
    current_file: Optional[str]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class SymbolResponse(BaseModel):
    id: uuid.UUID
    file_id: uuid.UUID
    name: str
    symbol_type: str
    start_line: int
    end_line: int
    signature: Optional[str]
    docstring: Optional[str]
    parent_symbol_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}


class FileResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    path: str
    filename: str
    extension: str
    language: str
    size_bytes: int
    line_count: int
    is_binary: bool

    model_config = {"from_attributes": True}


class FileDetailResponse(FileResponse):
    symbols: List[SymbolResponse] = Field(default_factory=list)
    chunk_count: int = 0
    content: Optional[str] = None


class DependencyItemResponse(BaseModel):
    id: str
    package: str
    version: str
    type: str
    usage: str
    status: str


class IssueItemResponse(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    file: str
    line: int
    description: str
    suggestedFix: str
    confidence: str
    reviewed: bool = False

