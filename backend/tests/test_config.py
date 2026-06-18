from __future__ import annotations

import asyncio
import io
import importlib
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd
from fastapi import Response, UploadFile
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
    for module_name in ("app", "config", "parser", "database.db"):
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


class _FakeCursor:
    def __init__(self) -> None:
        self.execute_calls: list[tuple[str, tuple | None]] = []
        self.executemany_calls: list[tuple[str, list[tuple]]] = []

    def execute(self, sql: str, params: tuple | None = None) -> None:
        self.execute_calls.append((sql, params))

    def executemany(self, sql: str, rows: list[tuple]) -> None:
        self.executemany_calls.append((sql, rows))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        return None


class _FakeConnection:
    def __init__(self) -> None:
        self.cursor_obj = _FakeCursor()
        self.closed = False
        self.committed = False
        self.rolled_back = False

    def cursor(self) -> _FakeCursor:
        return self.cursor_obj

    def close(self) -> None:
        self.closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        self.committed = exc_type is None
        self.rolled_back = exc_type is not None


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

        payload = {
            "districts": [{"id": 1, "name": "Грозный (город)", "students": 10}],
            "schools": [],
        }
        with (
            patch.object(app_module, "get_connection", side_effect=RuntimeError("db down")),
            patch.object(app_module, "parse_excel", return_value=payload),
        ):
            self.assertEqual(app_module.list_districts(), payload["districts"])

    def test_district_detail_falls_back_to_excel_when_database_is_unavailable(self) -> None:
        app_module = importlib.import_module("app")

        payload = {
            "districts": [
                {"id": 1, "name": "Грозный (город)"},
                {"id": 2, "name": "Аргун (город)"},
            ],
            "schools": [
                {"name": "School A", "district": "Грозный (город)"},
                {"name": "School B", "district": "Аргун (город)"},
            ],
        }
        with (
            patch.object(app_module, "get_connection", side_effect=RuntimeError("db down")),
            patch.object(app_module, "parse_excel", return_value=payload),
        ):
            self.assertEqual(
                app_module.district_detail(2),
                [{"name": "School B", "district": "Аргун (город)"}],
            )

    def test_upload_excel_syncs_parsed_payload_to_database(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            excel_path = Path(tmp_dir) / "data.xlsx"
            os.environ["SCHOOLS_EXCEL_PATH"] = str(excel_path)
            app_module = importlib.import_module("app")
            fake_connection = _FakeConnection()
            payload = {
                "districts": [
                    {"id": 1, "name": "Грозный (город)"},
                    {"id": None, "name": "Новый р-н"},
                ],
                "schools": [
                    {
                        "name": "School A",
                        "district": "Грозный (город)",
                        "address": "ул. Школьная, 1",
                        "coords": (43.1, 45.6),
                        "students": 300,
                        "shift": 2,
                        "capacity": 500,
                        "workers": 50,
                        "teachers": 30,
                        "site": "school.test",
                        "is_state": True,
                        "is_religional": False,
                        "second_shift_students": 120,
                        "buildings": 3,
                        "renovated": True,
                        "needs_repairs": False,
                        "critical_condition": True,
                        "form": True,
                        "shkon": False,
                        "a_school_with_bias": True,
                    },
                    {
                        "name": "School B",
                        "district": "Новый р-н",
                        "address": None,
                        "coords": None,
                    },
                ],
            }

            with (
                patch.object(app_module, "parse_excel", return_value=payload),
                patch.object(app_module, "get_connection", return_value=fake_connection),
            ):
                result = app_module.upload_excel(
                    UploadFile(filename="data.xlsx", file=io.BytesIO(b"uploaded"))
                )
            saved_excel = excel_path.read_bytes()

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["districts"], 2)
        self.assertEqual(result["schools"], 2)
        self.assertEqual(saved_excel, b"uploaded")
        self.assertTrue(fake_connection.committed)
        self.assertTrue(fake_connection.closed)

        district_rows = next(
            rows
            for sql, rows in fake_connection.cursor_obj.executemany_calls
            if "INSERT INTO districts" in sql
        )
        school_rows = next(
            rows
            for sql, rows in fake_connection.cursor_obj.executemany_calls
            if "INSERT INTO schools" in sql
        )

        self.assertEqual(district_rows, [(1, "Грозный (город)"), (2, "Новый р-н")])
        self.assertEqual(school_rows[0][2], 1)
        self.assertEqual(school_rows[0][4:6], (43.1, 45.6))
        self.assertEqual(school_rows[0][7:22], (
            2,
            500,
            50,
            30,
            "school.test",
            True,
            False,
            120,
            3,
            True,
            False,
            True,
            True,
            False,
            True,
        ))
        self.assertEqual(school_rows[1][2], 2)

    def test_upload_excel_does_not_replace_file_when_database_sync_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            excel_path = Path(tmp_dir) / "data.xlsx"
            excel_path.write_bytes(b"old")
            os.environ["SCHOOLS_EXCEL_PATH"] = str(excel_path)
            app_module = importlib.import_module("app")

            with (
                patch.object(app_module, "parse_excel", return_value={"districts": [], "schools": []}),
                patch.object(app_module, "get_connection", side_effect=RuntimeError("db down")),
            ):
                result = app_module.upload_excel(
                    UploadFile(filename="data.xlsx", file=io.BytesIO(b"new"))
                )

            self.assertEqual(result.status_code, 500)
            self.assertEqual(excel_path.read_bytes(), b"old")
            self.assertFalse(excel_path.with_name("data.xlsx.tmp").exists())

    def test_admin_school_where_combines_search_and_filters(self) -> None:
        app_module = importlib.import_module("app")

        where_sql, params = app_module._admin_school_where(
            search="квант",
            district_id=1,
            district=None,
            has_coords=False,
            bool_filters={
                "needs_repairs": True,
                "critical_condition": None,
            },
        )

        self.assertIn("ILIKE", where_sql)
        self.assertIn("s.district_id = %s", where_sql)
        self.assertIn("s.needs_repairs = %s", where_sql)
        self.assertIn("s.latitude IS NULL OR s.longitude IS NULL", where_sql)
        self.assertEqual(
            params,
            ["%квант%", "%квант%", "%квант%", "%квант%", 1, True],
        )

    def test_school_update_values_supports_null_coords_and_bool_reset(self) -> None:
        app_module = importlib.import_module("app")
        payload = app_module.SchoolPayload(
            coords=None,
            latitude=43.0,
            needs_repairs=None,
            renovated=True,
        )

        updates = app_module._school_update_values(payload)

        self.assertEqual(updates["latitude"], None)
        self.assertEqual(updates["longitude"], None)
        self.assertEqual(updates["needs_repairs"], False)
        self.assertEqual(updates["renovated"], True)

    def test_schools_to_excel_bytes_exports_flat_importable_headers(self) -> None:
        app_module = importlib.import_module("app")

        content = app_module._schools_to_excel_bytes([
            {
                "id": 7,
                "name": "School A",
                "shift": 2,
                "capacity": 500,
                "students": 300,
                "workers": 50,
                "teachers": 30,
                "site": "school.test",
                "coords": [43.1, 45.6],
                "address": "ул. Школьная, 1",
                "district": "Грозный (город)",
                "is_state": True,
                "is_religional": False,
                "buildings": 3,
                "renovated": True,
                "needs_repairs": False,
                "critical_condition": True,
                "second_shift_students": 120,
                "form": True,
                "shkon": False,
                "a_school_with_bias": True,
            }
        ])
        exported = pd.read_excel(io.BytesIO(content))

        self.assertEqual(exported.loc[0, "school_name"], "School A")
        self.assertEqual(exported.loc[0, "district"], "Грозный (город)")
        self.assertEqual(exported.loc[0, "latitude"], 43.1)
        self.assertEqual(exported.loc[0, "is_state"], "Да")
        self.assertEqual(exported.loc[0, "needs_repairs"], "Нет")
        self.assertIn("A_school_with_bias", exported.columns)

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
