from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.models.sale import Sale


class ReportingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def sales_summary(self) -> dict:
        total_sales_query = select(func.count(Sale.id))
        total_revenue_query = select(func.coalesce(func.sum(Payment.amount), 0))

        total_sales = (await self.session.execute(total_sales_query)).scalar_one()
        total_revenue = (await self.session.execute(total_revenue_query)).scalar_one()

        return {
            "total_sales": total_sales,
            "total_revenue": float(total_revenue),
        }
