from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum
from decimal import Decimal


class PaymentModeEnum(str, Enum):
    CASH = "CASH"
    IP = "IP"
    FINANCE = "FINANCE"


class SalesRecordBase(BaseModel):
    customer_id: int
    vehicle_stock_id: int
    vehicle_name: str
    variant: str
    color: str
    payment_mode: PaymentModeEnum
    bank: Optional[str] = None
    payment_date: Optional[date] = None
    amount_received: Decimal = Field(..., decimal_places=2)
    location: Optional[str] = None
    branch_code: Optional[str] = None
    branch_name: Optional[str] = None
    is_payment_received: bool = True


class SalesRecordCreate(BaseModel):
    """Simplified creation - can create customer inline"""
    # Customer info
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_location: Optional[str] = None
    
    # Vehicle selection
    vehicle_stock_id: int
    
    # Payment details
    payment_mode: PaymentModeEnum
    bank: Optional[str] = None
    payment_date: Optional[date] = None
    amount_received: Decimal = Field(..., decimal_places=2)
    is_payment_received: Optional[bool] = True


class SalesRecordUpdate(BaseModel):
    payment_mode: Optional[PaymentModeEnum] = None
    bank: Optional[str] = None
    payment_date: Optional[date] = None
    amount_received: Optional[Decimal] = None
    is_payment_received: Optional[bool] = None


class SalesRecord(SalesRecordBase):
    id: int
    executive_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested objects
    customer: Optional[dict] = None
    executive: Optional[dict] = None

    class Config:
        from_attributes = True
