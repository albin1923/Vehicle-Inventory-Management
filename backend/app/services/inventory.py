from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory
from app.models.branch import Branch
from app.models.vehicle_model import VehicleModel
from app.schemas.inventory import InventoryBase


class InventoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_by_branch(self, branch_id: int) -> list[Inventory]:
        stmt = select(Inventory).options(selectinload(Inventory.model)).where(Inventory.branch_id == branch_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def nearest_with_stock(self, source_branch_id: int, model_id: int) -> dict | None:
        source_branch = await self.session.get(Branch, source_branch_id)
        if source_branch is None or source_branch.latitude is None or source_branch.longitude is None:
            return None

        stmt = (
            select(Branch, Inventory, VehicleModel)
            .join(Inventory, Inventory.branch_id == Branch.id)
            .join(VehicleModel, VehicleModel.id == Inventory.model_id)
            .where(
                and_(
                    Inventory.model_id == model_id,
                    Inventory.branch_id != source_branch_id,
                    (Inventory.quantity - Inventory.reserved) > 0,
                    Branch.latitude.isnot(None),
                    Branch.longitude.isnot(None),
                )
            )
        )

        result = await self.session.execute(stmt)

        nearest: dict | None = None
        for branch, inventory, model in result:
            available = inventory.quantity - inventory.reserved
            if available <= 0:
                continue

            # Compute great-circle distance between source and candidate branches.
            distance = self._haversine(
                source_branch.latitude,
                source_branch.longitude,
                branch.latitude,
                branch.longitude,
            )

            if nearest is None or distance < nearest["distance_km"]:
                nearest = {
                    "branch": branch,
                    "model": model,
                    "distance_km": distance,
                    "available_quantity": available,
                }

        return nearest

    async def adjust_stock(self, branch_id: int, model_id: int, delta: int) -> Inventory:
        instance = await self._get_inventory(branch_id, model_id)
        if instance is None:
            instance = Inventory(branch_id=branch_id, model_id=model_id, quantity=0, reserved=0)
            self.session.add(instance)

        new_quantity = max(instance.quantity + delta, 0)
        instance.quantity = new_quantity
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def upsert(self, payload: InventoryBase) -> Inventory:
        instance = await self._get_inventory(payload.branch_id, payload.model_id)
        if instance is None:
            instance = Inventory(
                branch_id=payload.branch_id,
                model_id=payload.model_id,
                quantity=payload.quantity,
                reserved=payload.reserved,
            )
            self.session.add(instance)
        else:
            instance.quantity = payload.quantity
            instance.reserved = payload.reserved

        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def _get_inventory(self, branch_id: int, model_id: int) -> Inventory | None:
        result = await self.session.execute(
            select(Inventory).where(
                Inventory.branch_id == branch_id,
                Inventory.model_id == model_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        radius = 6371.0
        d_lat = radians(lat2 - lat1)
        d_lon = radians(lon2 - lon1)
        a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
        c = 2 * asin(min(1.0, sqrt(a)))
        return radius * c
