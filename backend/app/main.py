from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.utils.logging import setup_logging


def create_application() -> FastAPI:
    setup_logging()

    application = FastAPI(
        title="Honda Internal System",
        version="0.1.0",
        docs_url=f"{settings.API_V1_STR}/docs" if settings.EXPOSE_DOCS else None,
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.EXPOSE_DOCS else None,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.API_V1_STR)
    return application


app = create_application()
