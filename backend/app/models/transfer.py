from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.branch import Branch
    from app.models.user import User
    from app.models.vehicle_model import VehicleModel

from app.db.base import Base
from app.models.common import TimestampMixin


class Transfer(TimestampMixin, Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), nullable=False)
    destination_branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), nullable=False)
    model_id: Mapped[int] = mapped_column(ForeignKey("vehicle_models.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(30), default="requested", nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    source_branch: Mapped["Branch"] = relationship(
        foreign_keys=[source_branch_id], back_populates="transfers_out"
    )
    destination_branch: Mapped["Branch"] = relationship(
        foreign_keys=[destination_branch_id], back_populates="transfers_in"
    )
    model: Mapped["VehicleModel"] = relationship()
    requested_by: Mapped[User | None] = relationship(foreign_keys=[requested_by_id])
    approved_by: Mapped[User | None] = relationship(foreign_keys=[approved_by_id])
