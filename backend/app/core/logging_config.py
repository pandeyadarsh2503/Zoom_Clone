from __future__ import annotations

import logging
import sys

from app.core.config import settings


def configure_logging() -> None:
    """
    Configure application-wide logging.

    - DEBUG mode: verbose output including SQL queries.
    - Production: INFO level, no SQL noise.
    All output goes to stdout so container/process managers can capture it.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
        force=True,  # Override any existing root-logger configuration.
    )

    # Suppress noisy third-party loggers in production.
    logging.getLogger("uvicorn.access").setLevel(
        logging.DEBUG if settings.DEBUG else logging.WARNING
    )
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if settings.DEBUG else logging.WARNING
    )
    logging.getLogger("alembic").setLevel(logging.INFO)
