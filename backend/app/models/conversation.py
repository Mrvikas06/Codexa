import enum
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    JSON,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.file import File
    from app.models.repository import Repository
    from app.models.workspace import Workspace


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ClaimConfidence(str, enum.Enum):
    VERIFIED_FACT = "verified_fact"
    SUPPORTED_INFERENCE = "supported_inference"
    HYPOTHESIS = "hypothesis"
    UNKNOWN = "unknown"


class Conversation(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "conversations"

    workspace_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    repository_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), default="New Investigation", nullable=False)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="conversations")
    repository: Mapped["Repository"] = relationship("Repository", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Conversation {self.title}>"


class Message(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    evidence_references: Mapped[List["EvidenceReference"]] = relationship("EvidenceReference", back_populates="message", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Message {self.role.value} id={self.id}>"


class EvidenceReference(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evidence_references"

    message_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("files.id", ondelete="SET NULL"), nullable=True, index=True)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    start_line: Mapped[int] = mapped_column(Integer, nullable=False)
    end_line: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    relevance_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[ClaimConfidence] = mapped_column(Enum(ClaimConfidence), default=ClaimConfidence.VERIFIED_FACT, nullable=False)
    is_verified: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relationships
    message: Mapped["Message"] = relationship("Message", back_populates="evidence_references")
    file: Mapped[Optional["File"]] = relationship("File")

    def __repr__(self) -> str:
        return f"<EvidenceReference {self.file_path}:{self.start_line}-{self.end_line}>"
