from __future__ import annotations

from datetime import datetime

from app.schemas.base import ORMModel


class AuditEventRead(ORMModel):
    id: int
    actor_id: int | None
    action: str
    entity: str | None
    entity_id: str | None
    details: dict | None
    created_at: datetime
