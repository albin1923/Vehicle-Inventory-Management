from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api import deps
from app.schemas.inventory import InventoryBase, InventoryRead, NearestInventoryRead
from app.services.inventory import InventoryService

router = APIRouter()


@router.get("/branches/{branch_id}", response_model=list[InventoryRead])
async def list_branch_inventory(branch_id: int, session=Depends(deps.get_session)):
    service = InventoryService(session)
    records = await service.list_by_branch(branch_id)
    return records


@router.post("/", response_model=InventoryRead)
async def upsert_inventory(payload: InventoryBase, session=Depends(deps.get_session)):
    service = InventoryService(session)
    record = await service.upsert(payload)
    return record


@router.get("/nearest", response_model=NearestInventoryRead)
async def get_nearest_available_inventory(
    source_branch_id: int = Query(..., gt=0),
    model_id: int = Query(..., gt=0),
    session=Depends(deps.get_session),
):
    service = InventoryService(session)
    nearest = await service.nearest_with_stock(source_branch_id, model_id)
    if nearest is None:
        raise HTTPException(status_code=404, detail="No nearby branches with inventory found")

    return {
        "branch": nearest["branch"],
        "model": nearest["model"],
        "available_quantity": nearest["available_quantity"],
        "distance_km": nearest["distance_km"],
    }
