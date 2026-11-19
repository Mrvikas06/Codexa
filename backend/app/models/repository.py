import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.file import File
    from app.models.indexing import IndexingJob
    from app.models.workspace import Workspace


class RepositoryStatus(str, enum.Enum):
    PENDING = "pending"
    CLONING = "cloning"
    CLONED = "cloned"
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"


class Repository(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "repositories"

    workspace_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    clone_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[RepositoryStatus] = mapped_column(
        Enum(RepositoryStatus),
        default=RepositoryStatus.PENDING,
        nullable=False,
        index=True,
    )
    total_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_functions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_classes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="repositories")
    versions: Mapped[List["RepositoryVersion"]] = relationship("RepositoryVersion", back_populates="repository", cascade="all, delete-orphan")
    files: Mapped[List["File"]] = relationship("File", back_populates="repository", cascade="all, delete-orphan")
    indexing_jobs: Mapped[List["IndexingJob"]] = relationship("IndexingJob", back_populates="repository", cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="repository", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Repository {self.name} [{self.status.value}]>"


class RepositoryVersion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "repository_versions"

    repository_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    commit_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    indexed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="versions")
    files: Mapped[List["File"]] = relationship("File", back_populates="version", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<RepositoryVersion {self.commit_hash[:7]} ({self.branch})>"
