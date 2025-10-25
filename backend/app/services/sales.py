from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sale import Sale
from app.schemas.sale import SaleCreate


class SalesService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_sale(self, payload: SaleCreate) -> Sale:
        sale_kwargs = dict(
            branch_id=payload.branch_id,
            model_id=payload.model_id,
            salesperson_id=payload.salesperson_id,
            vin=payload.vin,
            sale_price=payload.sale_price,
        )
        if payload.sold_at is not None:
            sale_kwargs["sold_at"] = payload.sold_at

        sale = Sale(**sale_kwargs)
        self.session.add(sale)
        await self.session.commit()
        await self.session.refresh(sale)
        return sale

    async def list_recent(self, limit: int = 20) -> list[Sale]:
        stmt = (
            select(Sale)
            .options(selectinload(Sale.model))
            .order_by(Sale.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
