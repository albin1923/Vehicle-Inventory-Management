from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin

if TYPE_CHECKING:
    from app.models.branch import Branch
    from app.models.payment import Payment
    from app.models.user import User
    from app.models.vehicle_model import VehicleModel


class Sale(TimestampMixin, Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), nullable=False)
    model_id: Mapped[int] = mapped_column(ForeignKey("vehicle_models.id"), nullable=False)
    salesperson_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    vin: Mapped[str | None] = mapped_column(String(100), unique=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    sale_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    branch: Mapped[Branch] = relationship(back_populates="sales")
    model: Mapped[VehicleModel] = relationship(back_populates="sales")
    salesperson: Mapped[User | None] = relationship()
    payments: Mapped[list[Payment]] = relationship(back_populates="sale")
