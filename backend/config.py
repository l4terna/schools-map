from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent

DEFAULT_ADMIN_LOGIN = "admin"
DEFAULT_ADMIN_PASSWORD = "change-me"
DEFAULT_ADMIN_TOKEN_SALT = "local-dev-admin-token-salt"


def _env_or_default(name: str, default: str) -> str:
    return os.getenv(name) or default


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
        admin_login=_env_or_default("SCHOOLS_ADMIN_LOGIN", DEFAULT_ADMIN_LOGIN),
        admin_password=_env_or_default("SCHOOLS_ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD),
        admin_token_salt=_env_or_default("SCHOOLS_ADMIN_TOKEN_SALT", DEFAULT_ADMIN_TOKEN_SALT),
    )


@lru_cache
def get_excel_path() -> Path:
    return _resolve_path(os.getenv("SCHOOLS_EXCEL_PATH", "database/data.xlsx"))
