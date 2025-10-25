from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMModel


class BranchBase(BaseModel):
    name: str
    city: str
    code: str
    latitude: float | None = None
    longitude: float | None = None


class BranchCreate(BranchBase):
    pass


class BranchRead(ORMModel):
    id: int
    name: str
    city: str
    code: str
    latitude: float | None
    longitude: float | None
    created_at: datetime
    updated_at: datetime
