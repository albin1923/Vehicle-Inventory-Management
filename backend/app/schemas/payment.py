from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.base import ORMModel


class PaymentCreate(BaseModel):
    sale_id: int
    branch_id: int
    method: str
    reference: str | None = None
    amount: Decimal
    received_at: datetime | None = None
    status: str = "pending"


class PaymentRead(ORMModel):
    id: int
    sale_id: int
    branch_id: int
    method: str
    reference: str | None
    amount: Decimal
    status: str
    received_on: datetime = Field(alias="received_at")
    created_at: datetime
    updated_at: datetime
