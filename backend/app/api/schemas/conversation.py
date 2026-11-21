from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.conversation import ClaimConfidence, MessageRole


class CreateConversationRequest(BaseModel):
    repository_id: uuid.UUID
    title: Optional[str] = "New Investigation"


class CreateMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Question or query about the codebase")


class EvidenceReferenceResponse(BaseModel):
    id: uuid.UUID
    file_id: Optional[uuid.UUID]
    file_path: str
    start_line: int
    end_line: int
    content: str
    relevance_score: float
    relevance_explanation: str
    confidence: str
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    evidence_count: int
    extra_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    evidence_references: List[EvidenceReferenceResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    repository_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    repository_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
