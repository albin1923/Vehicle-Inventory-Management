from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.schemas.payment import PaymentCreate


class PaymentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_payment(self, payload: PaymentCreate) -> Payment:
        payment = Payment(
            sale_id=payload.sale_id,
            branch_id=payload.branch_id,
            method=payload.method,
            reference=payload.reference,
            amount=payload.amount,
            status=payload.status,
            received_at=payload.received_at,
        )
        self.session.add(payment)
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def list_for_sale(self, sale_id: int) -> list[Payment]:
        result = await self.session.execute(select(Payment).where(Payment.sale_id == sale_id))
        return list(result.scalars().all())

    async def list_pending(self) -> list[Payment]:
        stmt = select(Payment).where(Payment.status == "pending").order_by(Payment.received_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
