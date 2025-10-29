from __future__ import annotations

from typing import TYPE_CHECKING
import enum
from decimal import Decimal

from sqlalchemy import String, Integer, Date, ForeignKey, Enum as SQLEnum, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.vehicle_stock import VehicleStock
    from app.models.user import User


class PaymentMode(str, enum.Enum):
    CASH = "CASH"
    IP = "IP"  # Installment Plan
    FINANCE = "FINANCE"


class SalesRecord(TimestampMixin, Base):
    """Main sales record - links customer, vehicle, payment, and executive"""
    __tablename__ = "sales_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Foreign keys
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    vehicle_stock_id: Mapped[int] = mapped_column(ForeignKey("vehicle_stock.id", ondelete="RESTRICT"), nullable=False)
    executive_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Vehicle details (denormalized for quick access)
    vehicle_name: Mapped[str] = mapped_column(String, nullable=False)
    variant: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)
    
    # Payment details
    payment_mode: Mapped[PaymentMode] = mapped_column(SQLEnum(PaymentMode), nullable=False)
    bank: Mapped[str | None] = mapped_column(String, nullable=True)
    payment_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    amount_received: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_payment_received: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Location
    location: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    branch_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    branch_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    
    # Relationships
    customer: Mapped[Customer] = relationship("Customer", back_populates="sales")
    vehicle_stock: Mapped[VehicleStock] = relationship("VehicleStock", back_populates="sales")
    executive: Mapped[User | None] = relationship("User", back_populates="sales")
