from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMModel


class AnomalyCreate(BaseModel):
    branch_id: int | None = None
    category: str
    description: str | None = None
    payload: dict | None = None


class AnomalyRead(ORMModel):
    id: int
    branch_id: int | None
    category: str
    description: str | None
    payload: dict | None
    status: str
    created_at: datetime
    updated_at: datetime
