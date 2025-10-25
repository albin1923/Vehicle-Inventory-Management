from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def authenticate(self, email: str, password: str) -> User | None:
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user if user.is_active else None

    async def create_superuser(self, email: str, password: str, full_name: str) -> User:
        user = User(email=email, hashed_password=get_password_hash(password), full_name=full_name, is_active=True)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
