import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.repository import Repository
    from app.models.user import User


class Workspace(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="workspaces")
    repositories: Mapped[List["Repository"]] = relationship("Repository", back_populates="workspace", cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="workspace", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Workspace {self.name}>"
