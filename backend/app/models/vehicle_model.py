from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class VehicleModel(TimestampMixin, Base):
    __tablename__ = "vehicle_models"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    external_code: Mapped[str | None] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)

    inventories: Mapped[list["Inventory"]] = relationship(back_populates="model")
    sales: Mapped[list["Sale"]] = relationship(back_populates="model")
