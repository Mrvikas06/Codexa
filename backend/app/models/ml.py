import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.symbol import Embedding


class ModelType(str, enum.Enum):
    ENCODER = "encoder"
    RERANKER = "reranker"
    DECODER = "decoder"


class ModelStatus(str, enum.Enum):
    TRAINING = "training"
    READY = "ready"
    FAILED = "failed"
    ARCHIVED = "archived"


class RunStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ModelVersion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "model_versions"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_type: Mapped[ModelType] = mapped_column(Enum(ModelType), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    architecture: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    param_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    vocab_size: Mapped[int] = mapped_column(Integer, default=16000, nullable=False)
    checkpoint_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[ModelStatus] = mapped_column(Enum(ModelStatus), default=ModelStatus.READY, nullable=False, index=True)
    metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    training_runs: Mapped[List["TrainingRun"]] = relationship("TrainingRun", back_populates="model_version", cascade="all, delete-orphan")
    evaluation_runs: Mapped[List["EvaluationRun"]] = relationship("EvaluationRun", back_populates="model_version", cascade="all, delete-orphan")
    embeddings: Mapped[List["Embedding"]] = relationship("Embedding", back_populates="model_version", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ModelVersion {self.name} v{self.version} ({self.model_type.value})>"


class TrainingRun(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "training_runs"

    model_version_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_name: Mapped[str] = mapped_column(String(200), nullable=False)
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[RunStatus] = mapped_column(Enum(RunStatus), default=RunStatus.PENDING, nullable=False, index=True)
    current_epoch: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_epochs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_steps: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    train_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    val_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    learning_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gpu_memory_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    model_version: Mapped["ModelVersion"] = relationship("ModelVersion", back_populates="training_runs")

    def __repr__(self) -> str:
        return f"<TrainingRun {self.id} [{self.status.value}] step={self.current_step}>"


class EvaluationRun(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evaluation_runs"

    model_version_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[RunStatus] = mapped_column(Enum(RunStatus), default=RunStatus.PENDING, nullable=False, index=True)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    model_version: Mapped["ModelVersion"] = relationship("ModelVersion", back_populates="evaluation_runs")

    def __repr__(self) -> str:
        return f"<EvaluationRun {self.id} [{self.status.value}]>"
