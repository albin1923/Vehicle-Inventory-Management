from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api import deps
from app.models.vehicle_model import VehicleModel
from app.schemas.vehicle_model import VehicleModelCreate, VehicleModelRead

router = APIRouter()


@router.get("/", response_model=list[VehicleModelRead])
async def list_vehicle_models(session=Depends(deps.get_session)):
    result = await session.execute(select(VehicleModel))
    return list(result.scalars().all())


@router.post("/", response_model=VehicleModelRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle_model(payload: VehicleModelCreate, session=Depends(deps.get_session)):
    exists = await session.execute(select(VehicleModel).where(VehicleModel.name == payload.name))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Model already exists")

    model = VehicleModel(**payload.model_dump())
    session.add(model)
    await session.flush()
    return model
