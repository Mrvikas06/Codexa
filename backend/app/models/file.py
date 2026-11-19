import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.repository import Repository, RepositoryVersion
    from app.models.symbol import CodeChunk, Symbol


class File(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "files"

    repository_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("repository_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    path: Mapped[str] = mapped_column(String(1000), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    extension: Mapped[str] = mapped_column(String(50), default="", nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False, index=True)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    line_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_binary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="files")
    version: Mapped[Optional["RepositoryVersion"]] = relationship("RepositoryVersion", back_populates="files")
    symbols: Mapped[List["Symbol"]] = relationship("Symbol", back_populates="file", cascade="all, delete-orphan")
    chunks: Mapped[List["CodeChunk"]] = relationship("CodeChunk", back_populates="file", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<File {self.path} ({self.language})>"
