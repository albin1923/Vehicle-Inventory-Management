from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api import deps
from app.schemas.anomaly import AnomalyCreate, AnomalyRead
from app.services.anomalies import AnomalyService

router = APIRouter()


@router.post("/", response_model=AnomalyRead)
async def create_anomaly(payload: AnomalyCreate, session=Depends(deps.get_session)):
    service = AnomalyService(session)
    anomaly = await service.create(payload)
    return anomaly


@router.get("/open", response_model=list[AnomalyRead])
async def list_open_anomalies(session=Depends(deps.get_session)):
    service = AnomalyService(session)
    anomalies = await service.list_open()
    return anomalies
