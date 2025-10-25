from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.anomaly import Anomaly
from app.schemas.anomaly import AnomalyCreate


class AnomalyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payload: AnomalyCreate) -> Anomaly:
        anomaly = Anomaly(
            branch_id=payload.branch_id,
            category=payload.category,
            description=payload.description,
            payload=payload.payload,
        )
        self.session.add(anomaly)
        await self.session.commit()
        await self.session.refresh(anomaly)
        return anomaly

    async def list_open(self) -> list[Anomaly]:
        result = await self.session.execute(select(Anomaly).where(Anomaly.status == "open"))
        return list(result.scalars().all())
