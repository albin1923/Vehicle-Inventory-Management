from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.base import ORMModel
from app.schemas.vehicle_model import VehicleModelRead


class SaleCreate(BaseModel):
    branch_id: int
    model_id: int
    salesperson_id: int | None = None
    vin: str | None = None
    sale_price: Decimal
    sold_at: datetime | None = None


class SaleRead(ORMModel):
    id: int
    branch_id: int
    model_id: int
    salesperson_id: int | None
    vin: str | None
    sale_price: Decimal
    sold_at: datetime
    created_at: datetime
    updated_at: datetime
    model: VehicleModelRead | None = None
