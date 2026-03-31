from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value

    raise RuntimeError(f"Missing required environment variable: {name}")


def _resolve_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path

    return BASE_DIR / path


@dataclass(frozen=True)
class AdminSettings:
    admin_login: str
    admin_password: str
    admin_token_salt: str


@lru_cache
def get_admin_settings() -> AdminSettings:
    return AdminSettings(
        admin_login=_require_env("SCHOOLS_ADMIN_LOGIN"),
        admin_password=_require_env("SCHOOLS_ADMIN_PASSWORD"),
        admin_token_salt=_require_env("SCHOOLS_ADMIN_TOKEN_SALT"),
    )


@lru_cache
def get_excel_path() -> Path:
    return _resolve_path(os.getenv("SCHOOLS_EXCEL_PATH", "database/data.xlsx"))
