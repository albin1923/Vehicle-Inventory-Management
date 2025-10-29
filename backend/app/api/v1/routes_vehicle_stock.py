from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.models import User, UserRole, VehicleStock
from app.services.excel_sync import ExcelSyncService
from app.schemas.vehicle_stock import (
    VehicleStock as VehicleStockSchema,
    VehicleStockCreate,
    VehicleStockUpdate,
    VehicleStockAdjust,
)

router = APIRouter()


def check_admin(current_user: User) -> None:
    """Raise error if user is not admin"""
    if current_user.user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action"
        )


@router.get("/", response_model=List[VehicleStockSchema])
async def list_vehicle_stock(
    model_name: Optional[str] = None,
    branch_code: Optional[str] = None,
    city: Optional[str] = None,
    in_stock_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all vehicle stock with optional filtering"""
    query = select(VehicleStock)
    
    filters = []
    if model_name:
        filters.append(VehicleStock.model_name == model_name)
    if branch_code:
        filters.append(VehicleStock.branch_code == branch_code)
    if city:
        filters.append(VehicleStock.city == city)
    if in_stock_only:
        filters.append(VehicleStock.quantity > 0)
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.order_by(
        VehicleStock.branch_code,
        VehicleStock.model_name,
        VehicleStock.variant,
        VehicleStock.color,
    )
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=VehicleStockSchema, status_code=status.HTTP_201_CREATED)
async def create_vehicle_stock(
    stock_in: VehicleStockCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new vehicle stock entry (admin only)"""
    check_admin(current_user)
    
    stock = VehicleStock(**stock_in.model_dump())
    db.add(stock)
    await db.commit()
    await db.refresh(stock)
    await _sync_stock_to_excel(db, stock)
    return stock


@router.get("/{stock_id}", response_model=VehicleStockSchema)
async def get_vehicle_stock(
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific vehicle stock entry"""
    result = await db.execute(select(VehicleStock).where(VehicleStock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Vehicle stock not found")
    
    return stock


@router.patch("/{stock_id}", response_model=VehicleStockSchema)
async def update_vehicle_stock(
    stock_id: int,
    stock_in: VehicleStockUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update vehicle stock quantity (admin only)"""
    check_admin(current_user)
    
    result = await db.execute(select(VehicleStock).where(VehicleStock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Vehicle stock not found")
    
    update_data = stock_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stock, field, value)
    
    await db.commit()
    await db.refresh(stock)
    await _sync_stock_to_excel(db, stock)
    return stock


@router.post("/{stock_id}/adjust", response_model=VehicleStockSchema)
async def adjust_vehicle_stock(
    stock_id: int,
    adjustment: VehicleStockAdjust,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Adjust stock quantity by a delta (admin only)"""
    check_admin(current_user)
    
    result = await db.execute(select(VehicleStock).where(VehicleStock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Vehicle stock not found")
    
    new_quantity = stock.quantity + adjustment.adjustment
    
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adjustment would result in negative stock ({new_quantity})"
        )
    
    stock.quantity = new_quantity
    await db.commit()
    await db.refresh(stock)
    await _sync_stock_to_excel(db, stock)
    return stock


@router.delete("/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle_stock(
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a vehicle stock entry (admin only)"""
    check_admin(current_user)
    
    result = await db.execute(select(VehicleStock).where(VehicleStock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Vehicle stock not found")
    
    await db.delete(stock)
    await db.commit()


@router.post("/import", status_code=status.HTTP_202_ACCEPTED)
async def import_vehicle_stock(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Trigger a full import from the configured Excel workbook."""
    check_admin(current_user)
    service = ExcelSyncService(db, Path(settings.EXCEL_INVENTORY_PATH))
    summary = await service.import_inventory()
    export_path = Path(settings.EXCEL_INVENTORY_PATH)
    return {
        "processed": summary.processed,
        "created": summary.created,
        "updated": summary.updated,
        "removed": summary.removed,
        "workbook": export_path.name,
    }


@router.get("/export", response_class=FileResponse)
async def export_vehicle_stock(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate and download the latest Excel snapshot."""
    check_admin(current_user)
    export_dir = Path("storage/exports")
    export_dir.mkdir(parents=True, exist_ok=True)
    export_path = export_dir / settings.EXCEL_EXPORT_FILENAME
    service = ExcelSyncService(db, Path(settings.EXCEL_INVENTORY_PATH))
    await service.export_snapshot(export_path)
    return FileResponse(export_path, filename=settings.EXCEL_EXPORT_FILENAME)


async def _sync_stock_to_excel(db: AsyncSession, stock: VehicleStock) -> None:
    service = ExcelSyncService(db, Path(settings.EXCEL_INVENTORY_PATH))
    await service.push_stock_update(stock)
