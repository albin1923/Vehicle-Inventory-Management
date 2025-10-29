from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.base import ORMModel
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(ORMModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    is_active: bool
    user_role: UserRole
    branch_id: int | None
    created_at: datetime
    updated_at: datetime
