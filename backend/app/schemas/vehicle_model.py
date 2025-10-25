from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMModel


class VehicleModelBase(BaseModel):
    name: str
    external_code: str | None = None


class VehicleModelCreate(VehicleModelBase):
    pass


class VehicleModelRead(ORMModel):
    id: int
    name: str
    external_code: str | None
    created_at: datetime
    updated_at: datetime
