from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base
from app.models.common import TimestampMixin

if TYPE_CHECKING:
    from app.models.branch import Branch
    from app.models.role import Role
    from app.models.sales_record import SalesRecord


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SALESMAN = "SALESMAN"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    user_role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.SALESMAN, nullable=False)
    branch_id: Mapped[int | None] = mapped_column(ForeignKey("branches.id"), nullable=True)

    branch: Mapped[Branch | None] = relationship(back_populates="users")
    roles: Mapped[list[Role]] = relationship(
        secondary="user_roles",
        back_populates="users",
        lazy="joined",
    )
    sales: Mapped[list[SalesRecord]] = relationship("SalesRecord", back_populates="executive")
