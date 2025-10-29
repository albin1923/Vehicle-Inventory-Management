from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.models import Customer, SalesRecord, User, UserRole, VehicleStock
from app.schemas.sales_record import (
    SalesRecord as SalesRecordSchema,
    SalesRecordCreate,
    SalesRecordUpdate,
)
from app.services.excel_sync import ExcelSyncService


router = APIRouter()


def check_admin(current_user: User) -> None:
    if current_user.user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action",
        )


@router.get("/", response_model=List[SalesRecordSchema])
async def list_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    location: Optional[str] = None,
    payment_mode: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    executive_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _purge_overdue_unpaid_sales(db)

    query = select(SalesRecord)

    if current_user.user_role == UserRole.SALESMAN:
        query = query.where(SalesRecord.executive_id == current_user.id)
    elif executive_id:
        query = query.where(SalesRecord.executive_id == executive_id)

    if location:
        query = query.where(SalesRecord.location == location)
    if payment_mode:
        query = query.where(SalesRecord.payment_mode == payment_mode)
    if from_date:
        query = query.where(SalesRecord.payment_date >= from_date)
    if to_date:
        query = query.where(SalesRecord.payment_date <= to_date)

    query = query.offset(skip).limit(limit).order_by(SalesRecord.created_at.desc())

    result = await db.execute(query)
    sales = result.scalars().all()

    for sale in sales:
        await db.refresh(sale, ["customer", "executive"])

    return [SalesRecordSchema.model_validate(sale) for sale in sales]


@router.post("/", response_model=SalesRecordSchema, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_in: SalesRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    customer_id = sale_in.customer_id
    if not customer_id and sale_in.customer_name:
        customer = Customer(
            name=sale_in.customer_name,
            phone=sale_in.customer_phone,
            location=sale_in.customer_location,
        )
        db.add(customer)
        await db.flush()
        customer_id = customer.id
    elif not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either customer_id or customer_name must be provided",
        )

    result = await db.execute(select(VehicleStock).where(VehicleStock.id == sale_in.vehicle_stock_id))
    vehicle_stock = result.scalar_one_or_none()

    if not vehicle_stock:
        raise HTTPException(status_code=404, detail="Vehicle stock not found")

    if vehicle_stock.quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Vehicle out of stock ({vehicle_stock.model_name} "
                f"{vehicle_stock.variant or '-'} {vehicle_stock.color or '-'})"
            ),
        )

    is_payment_received = bool(sale_in.is_payment_received)
    vehicle_stock.quantity -= 1
    if not is_payment_received:
        vehicle_stock.reserved = max(vehicle_stock.reserved + 1, 0)

    sale = SalesRecord(
        customer_id=customer_id,
        vehicle_stock_id=vehicle_stock.id,
        executive_id=current_user.id,
        vehicle_name=vehicle_stock.model_name,
        variant=vehicle_stock.variant or "STANDARD",
        color=vehicle_stock.color or "DEFAULT",
        payment_mode=sale_in.payment_mode,
        bank=sale_in.bank,
        payment_date=sale_in.payment_date,
        amount_received=sale_in.amount_received,
        location=sale_in.customer_location or vehicle_stock.city,
        branch_code=vehicle_stock.branch_code,
        branch_name=vehicle_stock.branch_name,
        is_payment_received=is_payment_received,
    )

    db.add(sale)
    await db.commit()
    await db.refresh(sale, ["customer", "executive"])
    await db.refresh(vehicle_stock)
    await _sync_stock(vehicle_stock, db)

    return SalesRecordSchema.model_validate(sale)


@router.get("/{sale_id}", response_model=SalesRecordSchema)
async def get_sale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(SalesRecord).where(SalesRecord.id == sale_id))
    sale = result.scalar_one_or_none()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if current_user.user_role == UserRole.SALESMAN and sale.executive_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.refresh(sale, ["customer", "executive"])
    return SalesRecordSchema.model_validate(sale)


@router.patch("/{sale_id}", response_model=SalesRecordSchema)
async def update_sale(
    sale_id: int,
    sale_in: SalesRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(SalesRecord).where(SalesRecord.id == sale_id))
    sale = result.scalar_one_or_none()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if current_user.user_role == UserRole.SALESMAN and sale.executive_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = sale_in.model_dump(exclude_unset=True)
    if "is_payment_received" in update_data:
        await _update_payment_state(sale, bool(update_data.pop("is_payment_received")), db)

    for field, value in update_data.items():
        setattr(sale, field, value)

    await db.commit()
    await db.refresh(sale, ["customer", "executive"])

    if sale.vehicle_stock_id:
        stock = await db.get(VehicleStock, sale.vehicle_stock_id)
        if stock:
            await _sync_stock(stock, db)

    return SalesRecordSchema.model_validate(sale)


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    check_admin(current_user)

    result = await db.execute(select(SalesRecord).where(SalesRecord.id == sale_id))
    sale = result.scalar_one_or_none()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    result = await db.execute(select(VehicleStock).where(VehicleStock.id == sale.vehicle_stock_id))
    vehicle_stock = result.scalar_one_or_none()
    if vehicle_stock:
        vehicle_stock.quantity += 1
        if not sale.is_payment_received and vehicle_stock.reserved > 0:
            vehicle_stock.reserved -= 1

    await db.delete(sale)
    await db.commit()

    if vehicle_stock:
        await _sync_stock(vehicle_stock, db)


async def _update_payment_state(sale: SalesRecord, is_received: bool, db: AsyncSession) -> None:
    if sale.is_payment_received == is_received:
        return

    stock = await db.get(VehicleStock, sale.vehicle_stock_id) if sale.vehicle_stock_id else None

    if is_received:
        sale.is_payment_received = True
        if stock and stock.reserved > 0:
            stock.reserved -= 1
    else:
        sale.is_payment_received = False
        if stock:
            stock.reserved += 1

    if stock:
        await db.flush()
        await _sync_stock(stock, db)


async def _purge_overdue_unpaid_sales(db: AsyncSession) -> int:
    threshold = datetime.utcnow() - timedelta(days=60)
    result = await db.execute(
        select(SalesRecord).where(
            SalesRecord.is_payment_received.is_(False),
            SalesRecord.created_at < threshold,
        )
    )
    overdue = result.scalars().all()

    if not overdue:
        return 0

    affected: Set[int] = set()
    for sale in overdue:
        stock = await db.get(VehicleStock, sale.vehicle_stock_id) if sale.vehicle_stock_id else None
        if stock:
            stock.quantity += 1
            if stock.reserved > 0:
                stock.reserved -= 1
            affected.add(stock.id)
        await db.delete(sale)

    await db.commit()

    service = ExcelSyncService(db, Path(settings.EXCEL_INVENTORY_PATH))
    for stock_id in affected:
        stock = await db.get(VehicleStock, stock_id)
        if stock:
            await _sync_stock(stock, db, service)

    return len(overdue)


async def _sync_stock(stock: VehicleStock, db: AsyncSession, service: ExcelSyncService | None = None) -> None:
    if service is None:
        service = ExcelSyncService(db, Path(settings.EXCEL_INVENTORY_PATH))
    stock.last_synced_at = datetime.utcnow()
    await db.flush()
    await service.push_stock_update(stock)
