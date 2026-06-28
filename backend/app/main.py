from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import configure_logging
from app.db.init_db import seed_default_user
from app.db.seed import seed_sample_data
from app.db.session import SessionLocal, engine

# Import all models so that Base.metadata is populated before create_all().
import app.models  # noqa: F401  (side-effect import)
from app.db.base import Base

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    FastAPI application lifespan handler.

    Startup:
        1. Configure logging so every subsequent log call is formatted correctly.
        2. Create all DB tables (idempotent — safe to call on every startup).
        3. Seed the default user if the users table is empty.
        4. Seed sample meetings and participants if no meetings exist.

    Shutdown:
        Log a clean shutdown message.
    """
    # ── Startup ──────────────────────────────────────────────
    configure_logging()
    logger.info(
        "Starting %s v%s [env=%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )

    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified / created.")

    db = SessionLocal()
    try:
        seed_default_user(db)
        seed_sample_data(db)
    finally:
        db.close()

    yield

    # ── Shutdown ─────────────────────────────────────────────
    logger.info("Shutting down %s.", settings.APP_NAME)


def create_app() -> FastAPI:
    """
    Application factory.

    Using a factory (rather than a module-level app = FastAPI()) makes the app
    trivially testable: each test can call create_app() to get a fresh instance
    with no shared state.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────
    # In addition to the explicit allow-list, accept any local-development
    # origin (localhost / 127.0.0.1 / private LAN IPs on any port). This stops
    # the frontend from silently failing CORS when the dev server runs on a
    # different port (e.g. 3001) or is opened via 127.0.0.1 or a LAN address.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_origin_regex=(
            r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0"
            r"|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?"
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────
    app.include_router(api_router, prefix="/api/v1")

    # ── Health check ──────────────────────────────────────────
    @app.get("/health", tags=["health"], summary="Health check")
    def health_check() -> dict[str, str]:
        """
        Lightweight liveness probe.

        Returns 200 if the application process is running.
        Used by load balancers and container orchestrators.
        """
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    return app


app: FastAPI = create_app()
