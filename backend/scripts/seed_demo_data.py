from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Final, TypedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import AsyncSessionLocal
from app.models.anomaly import Anomaly
from app.models.branch import Branch
from app.models.import_log import ImportJob
from app.models.inventory import Inventory
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.transfer import Transfer
from app.models.vehicle_model import VehicleModel


class VehicleModelSeed(TypedDict):
    name: str
    external_code: str


class InventorySeed(TypedDict):
    branch_code: str
    model_code: str
    quantity: int
    reserved: int


class PaymentSeed(TypedDict):
    amount: Decimal
    status: str
    method: str
    reference: str
    received_at: datetime


class SaleSeed(TypedDict):
    branch_code: str
    model_code: str
    sale_price: Decimal
    vin: str
    sold_at: datetime
    payments: list[PaymentSeed]


class TransferSeed(TypedDict):
    source_branch_code: str
    destination_branch_code: str
    model_code: str
    quantity: int
    status: str


class AnomalySeed(TypedDict):
    branch_code: str | None
    category: str
    description: str
    severity: str


class ImportJobSeed(TypedDict):
    source_filename: str
    branch_code: str | None
    status: str
    summary: dict
    executed_at: datetime | None


VEHICLE_MODELS: Final[list[VehicleModelSeed]] = [
    {"name": "Activa 6G", "external_code": "ACT6G"},
    {"name": "Dio 125", "external_code": "DIO125"},
    {"name": "CB Shine 125", "external_code": "CBSH125"},
    {"name": "CB350 H'ness", "external_code": "CB350HN"},
    {"name": "Elevate CVT", "external_code": "ELVTCVT"},
]

INVENTORY_LEVELS: Final[list[InventorySeed]] = [
    {"branch_code": "TVM-CBC-BHASI", "model_code": "ACT6G", "quantity": 24, "reserved": 4},
    {"branch_code": "TVM-CBC-BHASI", "model_code": "CBSH125", "quantity": 12, "reserved": 2},
    {"branch_code": "EKM-EVM-VYT", "model_code": "ACT6G", "quantity": 18, "reserved": 5},
    {"branch_code": "EKM-EVM-VYT", "model_code": "DIO125", "quantity": 15, "reserved": 3},
    {"branch_code": "CLT-KTC-YMCA", "model_code": "CB350HN", "quantity": 6, "reserved": 1},
    {"branch_code": "KLM-VAHINI-MAIN", "model_code": "ELVTCVT", "quantity": 5, "reserved": 1},
]

SALES: Final[list[SaleSeed]] = [
    {
        "branch_code": "TVM-CBC-BHASI",
        "model_code": "ACT6G",
        "sale_price": Decimal("89000"),
        "vin": "ME4JF5040R8001010",
        "sold_at": datetime(2025, 10, 20, 10, 45, tzinfo=timezone.utc),
        "payments": [
            {
                "amount": Decimal("89000"),
                "status": "posted",
                "method": "UPI",
                "reference": "TVM-ACT-1010",
                "received_at": datetime(2025, 10, 20, 11, 5, tzinfo=timezone.utc),
            }
        ],
    },
    {
        "branch_code": "EKM-EVM-VYT",
        "model_code": "DIO125",
        "sale_price": Decimal("92000"),
        "vin": "ME4JF6080R9002020",
        "sold_at": datetime(2025, 10, 21, 14, 30, tzinfo=timezone.utc),
        "payments": [
            {
                "amount": Decimal("50000"),
                "status": "pending",
                "method": "Bank Transfer",
                "reference": "EKM-DIO-2020",
                "received_at": datetime(2025, 10, 21, 15, 0, tzinfo=timezone.utc),
            }
        ],
    },
    {
        "branch_code": "CLT-KTC-YMCA",
        "model_code": "CB350HN",
        "sale_price": Decimal("225000"),
        "vin": "ME4NC5540R1003030",
        "sold_at": datetime(2025, 10, 22, 9, 15, tzinfo=timezone.utc),
        "payments": [
            {
                "amount": Decimal("125000"),
                "status": "pending",
                "method": "Finance",
                "reference": "CLT-CB350-3030",
                "received_at": datetime(2025, 10, 22, 9, 45, tzinfo=timezone.utc),
            }
        ],
    },
]

TRANSFERS: Final[list[TransferSeed]] = [
    {
        "source_branch_code": "TVM-CBC-BHASI",
        "destination_branch_code": "EKM-EVM-VYT",
        "model_code": "ACT6G",
        "quantity": 5,
        "status": "in_transit",
    },
    {
        "source_branch_code": "EKM-EVM-VYT",
        "destination_branch_code": "CLT-KTC-YMCA",
        "model_code": "DIO125",
        "quantity": 3,
        "status": "approved",
    },
]

ANOMALIES: Final[list[AnomalySeed]] = [
    {
        "branch_code": "TVM-CBC-BHASI",
        "category": "Payment mismatch",
        "description": "Deposit received but sale not posted to ERP",
        "severity": "warning",
    },
    {
        "branch_code": "CLT-KTC-YMCA",
        "category": "Inventory variance",
        "description": "Physical stock count differs by +2 units",
        "severity": "critical",
    },
]

IMPORT_JOBS: Final[list[ImportJobSeed]] = [
    {
        "source_filename": "october_retail_upload.xlsx",
        "branch_code": "TVM-CBC-BHASI",
        "status": "completed",
        "summary": {"processed_rows": 120, "total_rows": 120, "notes": "Seeded demo job"},
        "executed_at": datetime(2025, 10, 23, 6, 30, tzinfo=timezone.utc),
    },
    {
        "source_filename": "finance_pending.csv",
        "branch_code": "EKM-EVM-VYT",
        "status": "processing",
        "summary": {"processed_rows": 45, "total_rows": 120, "notes": "Awaiting completion"},
        "executed_at": None,
    },
]


async def seed_vehicle_models(session: AsyncSession) -> None:
    for payload in VEHICLE_MODELS:
        result = await session.execute(select(VehicleModel).where(VehicleModel.external_code == payload["external_code"]))
        instance = result.scalar_one_or_none()
        if instance:
            instance.name = payload["name"]
        else:
            session.add(VehicleModel(**payload))
    await session.commit()


async def seed_inventory(session: AsyncSession, branches: dict[str, Branch], models: dict[str, VehicleModel]) -> None:
    for payload in INVENTORY_LEVELS:
        branch = branches.get(payload["branch_code"])
        model = models.get(payload["model_code"])
        if branch is None or model is None:
            continue

        result = await session.execute(
            select(Inventory).where(
                Inventory.branch_id == branch.id,
                Inventory.model_id == model.id,
            )
        )
        instance = result.scalar_one_or_none()
        if instance:
            instance.quantity = payload["quantity"]
            instance.reserved = payload["reserved"]
        else:
            session.add(
                Inventory(
                    branch_id=branch.id,
                    model_id=model.id,
                    quantity=payload["quantity"],
                    reserved=payload["reserved"],
                )
            )
    await session.commit()


async def seed_sales_and_payments(session: AsyncSession, branches: dict[str, Branch], models: dict[str, VehicleModel]) -> None:
    for payload in SALES:
        branch = branches.get(payload["branch_code"])
        model = models.get(payload["model_code"])
        if branch is None or model is None:
            continue

        result = await session.execute(select(Sale).where(Sale.vin == payload["vin"]))
        sale = result.scalar_one_or_none()
        if sale is None:
            sale = Sale(
                branch_id=branch.id,
                model_id=model.id,
                sale_price=payload["sale_price"],
                vin=payload["vin"],
                sold_at=payload["sold_at"],
            )
            session.add(sale)
            await session.flush()
        else:
            sale.sale_price = payload["sale_price"]
            sale.sold_at = payload["sold_at"]

        for payment_payload in payload["payments"]:
            payment_result = await session.execute(select(Payment).where(Payment.reference == payment_payload["reference"]))
            payment = payment_result.scalar_one_or_none()
            if payment is None:
                payment = Payment(
                    sale_id=sale.id,
                    branch_id=branch.id,
                    amount=payment_payload["amount"],
                    status=payment_payload["status"],
                    method=payment_payload["method"],
                    reference=payment_payload["reference"],
                    received_at=payment_payload["received_at"],
                )
                session.add(payment)
            else:
                payment.amount = payment_payload["amount"]
                payment.status = payment_payload["status"]
                payment.method = payment_payload["method"]
                payment.received_at = payment_payload["received_at"]
    await session.commit()


async def seed_transfers(session: AsyncSession, branches: dict[str, Branch], models: dict[str, VehicleModel]) -> None:
    for payload in TRANSFERS:
        source = branches.get(payload["source_branch_code"])
        destination = branches.get(payload["destination_branch_code"])
        model = models.get(payload["model_code"])
        if source is None or destination is None or model is None:
            continue

        result = await session.execute(
            select(Transfer).where(
                Transfer.source_branch_id == source.id,
                Transfer.destination_branch_id == destination.id,
                Transfer.model_id == model.id,
            )
        )
        transfer = result.scalar_one_or_none()
        if transfer is None:
            transfer = Transfer(
                source_branch_id=source.id,
                destination_branch_id=destination.id,
                model_id=model.id,
                quantity=payload["quantity"],
                status=payload["status"],
            )
            session.add(transfer)
        else:
            transfer.quantity = payload["quantity"]
            transfer.status = payload["status"]
    await session.commit()


async def seed_anomalies(session: AsyncSession, branches: dict[str, Branch]) -> None:
    for payload in ANOMALIES:
        branch = branches.get(payload["branch_code"] or "") if payload["branch_code"] else None
        branch_id = branch.id if branch else None
        result = await session.execute(
            select(Anomaly).where(
                Anomaly.category == payload["category"],
                Anomaly.description == payload["description"],
            )
        )
        anomaly = result.scalar_one_or_none()
        if anomaly is None:
            anomaly = Anomaly(
                branch_id=branch_id,
                category=payload["category"],
                description=payload["description"],
                status="open",
                payload={"severity": payload["severity"]},
            )
            session.add(anomaly)
        else:
            anomaly.branch_id = branch_id
            anomaly.payload = {"severity": payload["severity"]}
            anomaly.status = "open"
    await session.commit()


async def seed_import_jobs(session: AsyncSession, branches: dict[str, Branch]) -> None:
    for payload in IMPORT_JOBS:
        branch = branches.get(payload["branch_code"] or "") if payload["branch_code"] else None
        branch_id = branch.id if branch else None
        result = await session.execute(select(ImportJob).where(ImportJob.source_filename == payload["source_filename"]))
        job = result.scalar_one_or_none()
        if job is None:
            job = ImportJob(
                branch_id=branch_id,
                source_filename=payload["source_filename"],
                status=payload["status"],
                summary=payload["summary"],
                executed_at=payload["executed_at"],
            )
            session.add(job)
        else:
            job.branch_id = branch_id
            job.status = payload["status"]
            job.summary = payload["summary"]
            job.executed_at = payload["executed_at"]
    await session.commit()


async def refresh_reference_maps(session: AsyncSession) -> tuple[dict[str, Branch], dict[str, VehicleModel]]:
    branch_result = await session.execute(select(Branch))
    branches = {branch.code: branch for branch in branch_result.scalars().all()}

    model_result = await session.execute(select(VehicleModel))
    models = {model.external_code: model for model in model_result.scalars().all() if model.external_code}
    return branches, models


async def seed_demo_data() -> None:
    async with AsyncSessionLocal() as session:
        await seed_vehicle_models(session)
        branches, models = await refresh_reference_maps(session)
        await seed_inventory(session, branches, models)
        await seed_sales_and_payments(session, branches, models)
        await seed_transfers(session, branches, models)
        await seed_anomalies(session, branches)
        await seed_import_jobs(session, branches)


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
