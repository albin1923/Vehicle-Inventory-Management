from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer import Transfer
from app.schemas.transfer import TransferCreate

OPEN_STATUSES = {"requested", "approved", "in_transit"}


class TransferService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payload: TransferCreate) -> Transfer:
        transfer = Transfer(
            source_branch_id=payload.source_branch_id,
            destination_branch_id=payload.destination_branch_id,
            model_id=payload.model_id,
            quantity=payload.quantity,
            status="requested",
        )
        self.session.add(transfer)
        await self.session.commit()
        await self.session.refresh(transfer)
        return transfer

    async def list_open(self) -> list[Transfer]:
        stmt = select(Transfer).where(Transfer.status.in_(OPEN_STATUSES)).order_by(Transfer.requested_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_status(self, transfer_id: int, status: str) -> Transfer:
        transfer = await self.session.get(Transfer, transfer_id)
        if transfer is None:
            raise ValueError("transfer_not_found")

        transfer.status = status
        if status == "completed":
            transfer.completed_at = datetime.now(timezone.utc)
        elif status in OPEN_STATUSES:
            transfer.completed_at = None
        await self.session.commit()
        await self.session.refresh(transfer)
        return transfer
