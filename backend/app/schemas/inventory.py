from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMModel
from app.schemas.vehicle_model import VehicleModelRead
from app.schemas.branch import BranchRead


class InventoryBase(BaseModel):
    branch_id: int
    model_id: int
    quantity: int
    reserved: int = 0


class InventoryRead(ORMModel):
    id: int
    branch_id: int
    model_id: int
    quantity: int
    reserved: int
    created_at: datetime
    updated_at: datetime
    model: VehicleModelRead | None = None


class NearestInventoryRead(ORMModel):
    branch: BranchRead
    model: VehicleModelRead
    available_quantity: int
    distance_km: float
