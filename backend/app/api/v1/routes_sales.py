from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api import deps
from app.schemas.sale import SaleCreate, SaleRead
from app.services.sales import SalesService

router = APIRouter()


@router.post("/", response_model=SaleRead)
async def create_sale(payload: SaleCreate, session=Depends(deps.get_session)):
    service = SalesService(session)
    sale = await service.record_sale(payload)
    return sale


@router.get("/recent", response_model=list[SaleRead])
async def list_recent_sales(limit: int = 20, session=Depends(deps.get_session)):
    service = SalesService(session)
    sales = await service.list_recent(limit)
    return sales
