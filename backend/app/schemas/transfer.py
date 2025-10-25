from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import ORMModel


class TransferCreate(BaseModel):
    source_branch_id: int
    destination_branch_id: int
    model_id: int
    quantity: int


class TransferRead(ORMModel):
    id: int
    from_branch_id: int = Field(alias="source_branch_id")
    to_branch_id: int = Field(alias="destination_branch_id")
    model_id: int
    quantity: int
    status: str
    requested_at: datetime
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TransferUpdateStatus(BaseModel):
    status: str = Field(pattern="^(requested|approved|in_transit|completed|rejected)$")
