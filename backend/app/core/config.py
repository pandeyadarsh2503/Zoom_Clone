from __future__ import annotations

import json
from functools import lru_cache
from typing import Annotated, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables / .env file.

    All fields have sensible defaults so the app starts without any .env file
    present. Override values in .env for local development or via real env vars
    in production.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "Zoom Clone API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── Server ───────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./zoom_clone.db"

    # ── Frontend ─────────────────────────────────────────────
    # Base URL used to build shareable meeting invite links.
    FRONTEND_URL: str = "http://localhost:3000"

    # ── Auth ─────────────────────────────────────────────────
    # Override SECRET_KEY in production via the environment.
    SECRET_KEY: str = "dev-secret-change-me-in-production-0xZoomClone"
    JWT_EXPIRES_SECONDS: int = 7 * 24 * 3600  # 7 days

    # Seeded demo account so the sample data is reachable after login.
    DEMO_EMAIL: str = "demo@zoom.clone"
    DEMO_PASSWORD: str = "demo1234"

    # ── CORS ─────────────────────────────────────────────────
    # NoDecode stops pydantic-settings from JSON-decoding the env var before our
    # validator runs, so a JSON array, a comma list, OR a single bare URL all work.
    ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ── Default User ─────────────────────────────────────────
    # A single user is seeded on startup; no auth is required.
    DEFAULT_USER_DISPLAY_NAME: str = "Default User"
    DEFAULT_USER_AVATAR_URL: Optional[str] = None

    # ─────────────────────────────────────────────────────────

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, value: object) -> list[str]:
        """Parse ALLOWED_ORIGINS from a JSON string or comma-separated list."""
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value  # type: ignore[return-value]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns a cached singleton Settings instance."""
    return Settings()


# Module-level singleton used throughout the application.
settings: Settings = get_settings()
