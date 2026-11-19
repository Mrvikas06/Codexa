from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self) -> None:
        super().__init__(User)

    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        result = await session.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalars().first()

    async def get_by_username(self, session: AsyncSession, username: str) -> Optional[User]:
        result = await session.execute(
            select(User).where(User.username == username.strip())
        )
        return result.scalars().first()
