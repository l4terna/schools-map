from __future__ import annotations

import asyncio
import importlib
import os
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd
from fastapi import Response
from fastapi.responses import JSONResponse
from starlette.requests import Request

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_KEYS = (
    "SCHOOLS_ADMIN_LOGIN",
    "SCHOOLS_ADMIN_PASSWORD",
    "SCHOOLS_ADMIN_TOKEN_SALT",
    "SCHOOLS_EXCEL_PATH",
)

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _clear_backend_modules() -> None:
    for module_name in ("app", "config", "parser"):
        sys.modules.pop(module_name, None)


def _build_request(path: str, cookie_value: str | None = None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if cookie_value is not None:
        headers.append((b"cookie", f"admin_session={cookie_value}".encode("utf-8")))

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    }

    return Request(scope)


class BackendConfigTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._original_env = {key: os.environ.get(key) for key in ENV_KEYS}
        self._original_python_multipart = sys.modules.get("python_multipart")
        sys.modules["python_multipart"] = types.SimpleNamespace(__version__="0.0.20")
        _clear_backend_modules()

    def tearDown(self) -> None:
        for key, value in self._original_env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

        if self._original_python_multipart is None:
            sys.modules.pop("python_multipart", None)
        else:
            sys.modules["python_multipart"] = self._original_python_multipart

        _clear_backend_modules()

    def test_admin_credentials_are_read_from_env(self) -> None:
        os.environ["SCHOOLS_ADMIN_LOGIN"] = "superadmin"
        os.environ["SCHOOLS_ADMIN_PASSWORD"] = "strong-password"
        os.environ["SCHOOLS_ADMIN_TOKEN_SALT"] = "salt-for-tests"

        app_module = importlib.import_module("app")

        invalid_login = app_module.login(
            app_module.LoginPayload(login="admin", password="admin"),
            Response(),
        )
        self.assertEqual(invalid_login.status_code, 401)

        login_response = Response()
        valid_login = app_module.login(
            app_module.LoginPayload(login="superadmin", password="strong-password"),
            login_response,
        )
        self.assertEqual(valid_login, {"status": "ok"})
        self.assertIn("admin_session=", login_response.headers["set-cookie"])

        async def call_next(_: Request):
            return JSONResponse({"status": "ok"})

        unauthorized = asyncio.run(
            app_module.admin_guard(_build_request("/api/admin/data/exists"), call_next)
        )
        self.assertEqual(unauthorized.status_code, 401)

        authorized = asyncio.run(
            app_module.admin_guard(
                _build_request(
                    "/api/admin/data/exists",
                    app_module._make_token("superadmin", "strong-password"),
                ),
                call_next,
            )
        )
        self.assertEqual(authorized.status_code, 200)
        self.assertEqual(authorized.body, b'{"status":"ok"}')

    def test_admin_login_uses_local_defaults_when_env_is_absent(self) -> None:
        os.environ.pop("SCHOOLS_ADMIN_LOGIN", None)
        os.environ.pop("SCHOOLS_ADMIN_PASSWORD", None)
        os.environ.pop("SCHOOLS_ADMIN_TOKEN_SALT", None)

        app_module = importlib.import_module("app")

        login_response = Response()
        valid_login = app_module.login(
            app_module.LoginPayload(login="admin", password="change-me"),
            login_response,
        )
        self.assertEqual(valid_login, {"status": "ok"})
        self.assertIn("admin_session=", login_response.headers["set-cookie"])

        invalid_login = app_module.login(
            app_module.LoginPayload(login="admin", password="wrong"),
            Response(),
        )
        self.assertEqual(invalid_login.status_code, 401)

    def test_public_district_loading_does_not_require_admin_env(self) -> None:
        os.environ.pop("SCHOOLS_ADMIN_LOGIN", None)
        os.environ.pop("SCHOOLS_ADMIN_PASSWORD", None)
        os.environ.pop("SCHOOLS_ADMIN_TOKEN_SALT", None)

        app_module = importlib.import_module("app")

        with patch.object(app_module, "parse_excel", return_value={"districts": [], "schools": []}):
            self.assertEqual(app_module.list_districts(), [])

    def test_district_ids_are_loaded_from_external_json(self) -> None:
        parser_module = importlib.import_module("parser")

        rows = pd.DataFrame(
            [
                list(range(11)),
                [
                    None,
                    "Надтеречный р-н",
                    None,
                    None,
                    1200,
                    90,
                    70,
                    None,
                    None,
                    None,
                    None,
                ],
                [
                    1,
                    "МБОУ СОШ №1",
                    1,
                    500,
                    450,
                    35,
                    25,
                    "https://school.test",
                    "Да",
                    "ул. Школьная, 1",
                    "43.1, 45.6",
                ],
            ]
        )

        with patch.object(parser_module.pd, "read_excel", return_value=rows):
            payload = parser_module.parse_excel(str(Path("unused.xlsx")))

        self.assertEqual(payload["meta"]["schools_count"], 1)
        district = next(
            item for item in payload["districts"] if item["name"] == "Надтеречный р-н"
        )
        self.assertEqual(district["id"], 5)
        self.assertEqual(payload["schools"][0]["district"], "Надтеречный р-н")

    def test_new_flat_format_parses_extended_school_fields(self) -> None:
        parser_module = importlib.import_module("parser")

        rows = pd.DataFrame(
            [
                [
                    None,
                    "school_name",
                    "shift_count",
                    "power",
                    "student_count",
                    "employee_count",
                    "edu_employee_count",
                    "page_link",
                    "latitude",
                    "longitude",
                    "adress",
                    "district",
                    "is_state",
                    "is_religional",
                    "buildings",
                    "renovated",
                    "needs_repairs",
                    "critical_condition",
                    "second_shift(students)",
                    "form",
                    "SHKON",
                    "A_school_with_bias",
                ],
                [
                    1,
                    "СОШ №1",
                    2,
                    None,
                    500,
                    80,
                    45,
                    "school.test",
                    43.1,
                    45.6,
                    "ул. Школьная, 1",
                    "Грозный (город)",
                    "true",
                    "false",
                    3,
                    "Да",
                    "Нет",
                    "Да",
                    244,
                    "Да",
                    "Да",
                    "Нет",
                ],
                [
                    None,
                    "Служебный заголовок",
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    1,
                    "Да",
                    "Нет",
                    "Нет",
                    None,
                    "Нет",
                    "Нет",
                    "Нет",
                ],
            ]
        )

        with patch.object(parser_module.pd, "read_excel", return_value=rows):
            payload = parser_module.parse_excel(str(Path("unused.xlsx")))

        self.assertEqual(payload["meta"]["schools_count"], 1)
        district = next(
            item for item in payload["districts"] if item["name"] == "Грозный (город)"
        )
        self.assertEqual(district["id"], 1)
        school = payload["schools"][0]
        self.assertIsNone(school["capacity"])
        self.assertEqual(school["buildings"], 3)
        self.assertTrue(school["renovated"])
        self.assertFalse(school["needs_repairs"])
        self.assertTrue(school["critical_condition"])
        self.assertEqual(school["second_shift_students"], 244)
        self.assertTrue(school["form"])
        self.assertTrue(school["shkon"])
        self.assertFalse(school["a_school_with_bias"])
