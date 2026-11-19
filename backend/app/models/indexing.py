import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.repository import Repository, RepositoryVersion


class JobType(str, enum.Enum):
    FULL = "full"
    INCREMENTAL = "incremental"
    REINDEX = "reindex"


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class IndexingJob(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "indexing_jobs"

    repository_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("repository_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    job_type: Mapped[JobType] = mapped_column(Enum(JobType), default=JobType.FULL, nullable=False)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False, index=True)
    total_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_file: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="indexing_jobs")
    version: Mapped[Optional["RepositoryVersion"]] = relationship("RepositoryVersion")

    def __repr__(self) -> str:
        return f"<IndexingJob {self.id} [{self.status.value}] {self.processed_files}/{self.total_files}>"
