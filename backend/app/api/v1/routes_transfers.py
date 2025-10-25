from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api import deps
from app.schemas.transfer import TransferCreate, TransferRead, TransferUpdateStatus
from app.services.transfers import TransferService

router = APIRouter()


@router.post("/", response_model=TransferRead)
async def create_transfer(payload: TransferCreate, session=Depends(deps.get_session)):
    service = TransferService(session)
    transfer = await service.create(payload)
    return transfer


@router.get("/open", response_model=list[TransferRead])
async def list_open_transfers(session=Depends(deps.get_session)):
    service = TransferService(session)
    transfers = await service.list_open()
    return transfers


@router.patch("/{transfer_id}/status", response_model=TransferRead)
async def update_transfer_status(transfer_id: int, payload: TransferUpdateStatus, session=Depends(deps.get_session)):
    service = TransferService(session)
    try:
        transfer = await service.update_status(transfer_id, payload.status)
    except ValueError as exc:
        if str(exc) == "transfer_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found") from exc
        raise
    return transfer
