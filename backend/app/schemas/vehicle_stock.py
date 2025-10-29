from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VehicleStockBase(BaseModel):
    model_code: Optional[str] = Field(default=None, max_length=50)
    model_name: str = Field(..., min_length=1)
    variant: Optional[str] = Field(default=None, max_length=80)
    color: Optional[str] = Field(default=None, max_length=80)
    quantity: int = Field(default=0, ge=0)
    reserved: int = Field(default=0, ge=0)
    branch_code: Optional[str] = Field(default=None, max_length=20)
    branch_name: Optional[str] = Field(default=None, max_length=150)
    city: Optional[str] = Field(default=None, max_length=120)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VehicleStockCreate(VehicleStockBase):
    excel_row_number: Optional[int] = Field(default=None, ge=2)


class VehicleStockUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    reserved: Optional[int] = Field(None, ge=0)
    branch_name: Optional[str] = None
    city: Optional[str] = None


class VehicleStock(BaseModel):
    id: int
    excel_row_number: Optional[int]
    model_code: Optional[str]
    model_name: str
    variant: Optional[str]
    color: Optional[str]
    quantity: int
    reserved: int
    branch_code: Optional[str]
    branch_name: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime
    updated_at: datetime
    last_synced_at: Optional[datetime]

    class Config:
        from_attributes = True


class VehicleStockAdjust(BaseModel):
    """For adjusting stock (+/-)"""
    adjustment: int = Field(..., description="Positive to add, negative to reduce")
