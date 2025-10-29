from __future__ import annotations

from typing import TYPE_CHECKING
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin

if TYPE_CHECKING:
    from app.models.sales_record import SalesRecord


class VehicleStock(TimestampMixin, Base):
    """Tracks inventory by model, variant, and color"""
    __tablename__ = "vehicle_stock"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    excel_row_number: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    model_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    model_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    variant: Mapped[str | None] = mapped_column(String, nullable=True)
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    branch_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    branch_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    sales: Mapped[list[SalesRecord]] = relationship("SalesRecord", back_populates="vehicle_stock")
