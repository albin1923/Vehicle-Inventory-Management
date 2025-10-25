from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api import deps
from app.services.reports import ReportingService

router = APIRouter()


@router.get("/summary")
async def sales_summary(session=Depends(deps.get_session)):
    service = ReportingService(session)
    return await service.sales_summary()
