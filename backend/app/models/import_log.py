from __future__ import annotations

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class ImportJob(TimestampMixin, Base):
    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    branch_id: Mapped[int | None] = mapped_column(ForeignKey("branches.id"))
    uploaded_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    source_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    sheet_name: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    summary: Mapped[dict | None] = mapped_column(JSON, default=None)
    executed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True))

    branch = relationship("Branch")
