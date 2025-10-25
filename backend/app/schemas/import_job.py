from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMModel


class ImportJobCreate(BaseModel):
    source_filename: str
    branch_id: int | None = None
    sheet_name: str | None = None


class ImportJobRead(ORMModel):
    id: int
    branch_id: int | None
    uploaded_by_id: int | None
    source_filename: str
    sheet_name: str | None
    status: str
    summary: dict | None
    executed_at: datetime | None
    created_at: datetime
    updated_at: datetime
