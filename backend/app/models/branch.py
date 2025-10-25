from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin

if TYPE_CHECKING:
    from app.models.inventory import Inventory
    from app.models.payment import Payment
    from app.models.sale import Sale
    from app.models.transfer import Transfer
    from app.models.user import User


class Branch(TimestampMixin, Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]

    users: Mapped[list[User]] = relationship(back_populates="branch")
    inventories: Mapped[list[Inventory]] = relationship(back_populates="branch")
    sales: Mapped[list[Sale]] = relationship(back_populates="branch")
    payments: Mapped[list[Payment]] = relationship(back_populates="branch")
    transfers_out: Mapped[list[Transfer]] = relationship(
        back_populates="source_branch", foreign_keys="Transfer.source_branch_id"
    )
    transfers_in: Mapped[list[Transfer]] = relationship(
        back_populates="destination_branch", foreign_keys="Transfer.destination_branch_id"
    )


__all__ = ["Branch"]
