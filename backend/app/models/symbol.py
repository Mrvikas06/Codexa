import enum
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    JSON,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.file import File
    from app.models.ml import ModelVersion


class SymbolType(str, enum.Enum):
    FUNCTION = "function"
    CLASS = "class"
    METHOD = "method"
    VARIABLE = "variable"
    IMPORT = "import"
    EXPORT = "export"
    INTERFACE = "interface"
    TYPE_ALIAS = "type_alias"
    DECORATOR = "decorator"
    CONSTANT = "constant"


class DependencyType(str, enum.Enum):
    IMPORTS = "imports"
    CALLS = "calls"
    INHERITS = "inherits"
    USES = "uses"
    DECORATES = "decorates"
    TYPE_REFERENCES = "type_references"


class ChunkType(str, enum.Enum):
    FUNCTION = "function"
    CLASS = "class"
    METHOD = "method"
    MODULE = "module"
    DOCSTRING = "docstring"
    CONFIG = "config"
    UNKNOWN = "unknown"


class Symbol(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "symbols"

    file_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    symbol_type: Mapped[SymbolType] = mapped_column(Enum(SymbolType), nullable=False, index=True)
    start_line: Mapped[int] = mapped_column(Integer, nullable=False)
    end_line: Mapped[int] = mapped_column(Integer, nullable=False)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    docstring: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parent_symbol_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("symbols.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    file: Mapped["File"] = relationship("File", back_populates="symbols")
    parent_symbol: Mapped[Optional["Symbol"]] = relationship("Symbol", remote_side="Symbol.id", back_populates="child_symbols")
    child_symbols: Mapped[List["Symbol"]] = relationship("Symbol", back_populates="parent_symbol")
    chunks: Mapped[List["CodeChunk"]] = relationship("CodeChunk", back_populates="symbol")
    
    outgoing_dependencies: Mapped[List["Dependency"]] = relationship(
        "Dependency",
        foreign_keys="Dependency.source_symbol_id",
        back_populates="source_symbol",
        cascade="all, delete-orphan",
    )
    incoming_dependencies: Mapped[List["Dependency"]] = relationship(
        "Dependency",
        foreign_keys="Dependency.target_symbol_id",
        back_populates="target_symbol",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Symbol {self.name} ({self.symbol_type.value}) L{self.start_line}-{self.end_line}>"


class Dependency(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "dependencies"

    source_symbol_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("symbols.id", ondelete="CASCADE"), nullable=False, index=True)
    target_symbol_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("symbols.id", ondelete="CASCADE"), nullable=False, index=True)
    dependency_type: Mapped[DependencyType] = mapped_column(Enum(DependencyType), nullable=False, index=True)

    # Relationships
    source_symbol: Mapped["Symbol"] = relationship("Symbol", foreign_keys=[source_symbol_id], back_populates="outgoing_dependencies")
    target_symbol: Mapped["Symbol"] = relationship("Symbol", foreign_keys=[target_symbol_id], back_populates="incoming_dependencies")

    def __repr__(self) -> str:
        return f"<Dependency {self.source_symbol_id} -[{self.dependency_type.value}]-> {self.target_symbol_id}>"


class CodeChunk(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "code_chunks"

    file_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("symbols.id", ondelete="SET NULL"), nullable=True, index=True)
    chunk_type: Mapped[ChunkType] = mapped_column(Enum(ChunkType), default=ChunkType.UNKNOWN, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    start_line: Mapped[int] = mapped_column(Integer, nullable=False)
    end_line: Mapped[int] = mapped_column(Integer, nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    file: Mapped["File"] = relationship("File", back_populates="chunks")
    symbol: Mapped[Optional["Symbol"]] = relationship("Symbol", back_populates="chunks")
    embeddings: Mapped[List["Embedding"]] = relationship("Embedding", back_populates="chunk", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CodeChunk {self.chunk_type.value} L{self.start_line}-{self.end_line}>"


class Embedding(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "embeddings"

    chunk_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("code_chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    vector: Mapped[List[float]] = mapped_column(JSON, nullable=False)

    # Relationships
    chunk: Mapped["CodeChunk"] = relationship("CodeChunk", back_populates="embeddings")
    model_version: Mapped["ModelVersion"] = relationship("ModelVersion", back_populates="embeddings")

    def __repr__(self) -> str:
        return f"<Embedding chunk={self.chunk_id} model={self.model_version_id}>"
