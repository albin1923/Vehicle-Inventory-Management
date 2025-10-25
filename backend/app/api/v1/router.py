from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
	routes_anomalies,
	routes_auth,
	routes_branches,
	routes_imports,
	routes_inventory,
	routes_payments,
	routes_reports,
	routes_sales,
	routes_transfers,
	routes_vehicle_models,
)

api_router = APIRouter()
api_router.include_router(routes_auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(routes_branches.router, prefix="/branches", tags=["branches"])
api_router.include_router(routes_vehicle_models.router, prefix="/models", tags=["models"])
api_router.include_router(routes_inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(routes_sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(routes_payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(routes_transfers.router, prefix="/transfers", tags=["transfers"])
api_router.include_router(routes_anomalies.router, prefix="/anomalies", tags=["anomalies"])
api_router.include_router(routes_reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(routes_imports.router, prefix="/imports", tags=["imports"])
