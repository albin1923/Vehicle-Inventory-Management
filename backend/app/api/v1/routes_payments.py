from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api import deps
from app.schemas.payment import PaymentCreate, PaymentRead
from app.services.payments import PaymentService

router = APIRouter()


@router.post("/", response_model=PaymentRead)
async def create_payment(payload: PaymentCreate, session=Depends(deps.get_session)):
    service = PaymentService(session)
    payment = await service.record_payment(payload)
    return payment


@router.get("/pending", response_model=list[PaymentRead])
async def list_pending_payments(session=Depends(deps.get_session)):
    service = PaymentService(session)
    payments = await service.list_pending()
    return payments


@router.get("/sale/{sale_id}", response_model=list[PaymentRead])
async def list_sale_payments(sale_id: int, session=Depends(deps.get_session)):
    service = PaymentService(session)
    payments = await service.list_for_sale(sale_id)
    return payments
