from __future__ import annotations

from fastapi import FastAPI, UploadFile, File, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

import hashlib
import io
import re
import shutil
import time

from config import get_admin_settings, get_excel_path
from parser import parse_excel
from database.db import get_connection

COOKIE_NAME = "admin_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 дней

app = FastAPI(title="Schools Map API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_last_upload_ts: int = int(time.time())

OPTIONAL_SCHOOL_COLUMNS: tuple[tuple[str, str, str], ...] = (
    ("shift", "integer", "NULL::integer"),
    ("capacity", "integer", "NULL::integer"),
    ("workers", "integer", "NULL::integer"),
    ("teachers", "integer", "NULL::integer"),
    ("site", "text", "NULL::text"),
    ("is_state", "boolean", "FALSE"),
    ("is_religional", "boolean", "FALSE"),
    ("second_shift_students", "integer", "NULL::integer"),
    ("buildings", "integer", "NULL::integer"),
    ("renovated", "boolean", "FALSE"),
    ("needs_repairs", "boolean", "FALSE"),
    ("critical_condition", "boolean", "FALSE"),
    ("form", "boolean", "FALSE"),
    ("shkon", "boolean", "FALSE"),
    ("a_school_with_bias", "boolean", "FALSE"),
)

SCHOOL_EXPORT_COLUMNS: tuple[tuple[str, str], ...] = (
    ("id", "№"),
    ("name", "school_name"),
    ("shift", "shift_count"),
    ("capacity", "power"),
    ("students", "student_count"),
    ("workers", "employee_count"),
    ("teachers", "edu_employee_count"),
    ("site", "page_link"),
    ("latitude", "latitude"),
    ("longitude", "longitude"),
    ("address", "adress"),
    ("district", "district"),
    ("is_state", "is_state"),
    ("is_religional", "is_religional"),
    ("buildings", "buildings"),
    ("renovated", "renovated"),
    ("needs_repairs", "needs_repairs"),
    ("critical_condition", "critical_condition"),
    ("second_shift_students", "second_shift(students)"),
    ("form", "form"),
    ("shkon", "SHKON"),
    ("a_school_with_bias", "A_school_with_bias"),
)

SCHOOL_SORT_COLUMNS = {
    "id": "s.id",
    "name": "s.name",
    "district": "d.name",
    "students": "s.students",
    "capacity": "s.capacity",
    "workers": "s.workers",
    "teachers": "s.teachers",
    "updated": "s.id",
}

SCHOOL_BOOL_FILTER_COLUMNS = (
    "is_state",
    "is_religional",
    "renovated",
    "needs_repairs",
    "critical_condition",
    "form",
    "shkon",
    "a_school_with_bias",
)


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.middleware("http")
async def admin_guard(request: Request, call_next):
    if request.url.path.startswith("/api/admin"):
        if request.url.path in {"/api/admin/login", "/api/admin/logout"}:
            return await call_next(request)

        settings = get_admin_settings()
        token = request.cookies.get(COOKIE_NAME)

        if token != _make_token(settings.admin_login, settings.admin_password):
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)


def _normalize_district_name(name: str) -> str:
    normalized = re.sub(r"\s+", " ", name.lower()).strip()
    normalized = normalized.replace("городской округ", "город")
    normalized = normalized.replace("район", "р-н")
    normalized = normalized.replace("р-н", "р-н")
    normalized = normalized.replace("(город)", "город")
    return normalized


def _prefer_district_name(candidate: str, current: str) -> bool:
    if "(город)" in candidate and "(город)" not in current:
        return True
    if "р-н" in candidate and "р-н" not in current:
        return True
    return False


def _districts_from_db_rows(rows) -> list[dict]:
    districts_by_key: dict[str, dict] = {}

    for row in rows:
        name = str(row[1]) if row[1] is not None else None
        if name is None:
            continue

        district = {"id": int(row[0]), "name": name}
        key = _normalize_district_name(district["name"])
        existing = districts_by_key.get(key)
        if existing is None or _prefer_district_name(district["name"], existing["name"]):
            districts_by_key[key] = district

    return list(districts_by_key.values())


def _school_from_db_row(row) -> dict:
    lat = row[4]
    lng = row[5]
    return {
        "id": row[0],
        "name": row[1],
        "district": row[2],
        "address": row[3],
        "coords": [lat, lng] if lat is not None and lng is not None else None,
        "students": row[6],
        "shift": row[7],
        "capacity": row[8],
        "workers": row[9],
        "teachers": row[10],
        "site": row[11],
        "is_state": row[12],
        "is_religional": row[13],
        "second_shift_students": row[14],
        "buildings": row[15],
        "renovated": row[16],
        "needs_repairs": row[17],
        "critical_condition": row[18],
        "form": row[19],
        "shkon": row[20],
        "a_school_with_bias": row[21],
    }


def _table_columns(cur, table_name: str) -> set[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = %s
        """,
        (table_name,),
    )
    return {row[0] for row in cur.fetchall()}


def _school_select_columns(cur) -> str:
    existing_columns = _table_columns(cur, "schools")
    columns = [
        "s.id",
        "s.name",
        "d.name",
        "s.address",
        "s.latitude",
        "s.longitude",
        "s.students",
    ]

    for column_name, _, default_sql in OPTIONAL_SCHOOL_COLUMNS:
        if column_name in existing_columns:
            columns.append(f"s.{column_name}")
        else:
            columns.append(f"{default_sql} AS {column_name}")

    return ",\n        ".join(columns)


def _load_from_database() -> dict:
    conn = get_connection()
    cur = conn.cursor()
    school_columns = _school_select_columns(cur)

    cur.execute(f"""
    SELECT
        {school_columns}
    FROM schools s
    LEFT JOIN districts d
        ON s.district_id = d.id
    """)

    schools = [_school_from_db_row(row) for row in cur.fetchall()]

    cur.execute("""
    SELECT id, name
    FROM districts
    """)

    districts = _districts_from_db_rows(cur.fetchall())

    cur.close()
    conn.close()

    return {
        "districts": districts,
        "schools": schools,
    }


def _load():
    try:
        return _load_from_database()
    except Exception as e:
        print("DB error:", e)

        return parse_excel(get_excel_path())


def _to_db_int(value) -> int | None:
    if value is None:
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _coords_to_lat_lng(coords) -> tuple[float | None, float | None]:
    if not coords or len(coords) < 2:
        return None, None

    return coords[0], coords[1]


def _ensure_database_schema(cur) -> None:
    cur.execute("""
    CREATE TABLE IF NOT EXISTS districts (
        id integer PRIMARY KEY,
        name text NOT NULL
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS schools (
        id integer PRIMARY KEY,
        name text,
        district_id integer,
        address text,
        latitude double precision,
        longitude double precision,
        students integer
    )
    """)

    for column_name, column_type, _ in OPTIONAL_SCHOOL_COLUMNS:
        cur.execute(
            f"ALTER TABLE schools ADD COLUMN IF NOT EXISTS {column_name} {column_type}"
        )


def _payload_database_rows(payload: dict) -> tuple[list[tuple], list[tuple]]:
    district_rows: list[tuple] = []
    district_ids_by_name: dict[str, int] = {}
    used_district_ids = {
        district_id
        for district_id in (
            _to_db_int(district.get("id"))
            for district in payload.get("districts", [])
        )
        if district_id is not None
    }
    next_district_id = max(used_district_ids, default=0) + 1

    def add_district(name: str | None, district_id: int | None = None) -> int | None:
        nonlocal next_district_id
        if not name:
            return None

        existing_id = district_ids_by_name.get(name)
        if existing_id is not None:
            return existing_id

        if district_id is None:
            district_id = next_district_id
            next_district_id += 1

        district_ids_by_name[name] = district_id
        district_rows.append((district_id, name))
        return district_id

    for district in payload.get("districts", []):
        add_district(district.get("name"), _to_db_int(district.get("id")))

    school_rows: list[tuple] = []
    for school_id, school in enumerate(payload.get("schools", []), start=1):
        district_id = add_district(school.get("district"))
        lat, lng = _coords_to_lat_lng(school.get("coords"))
        school_rows.append(
            (
                school_id,
                school.get("name"),
                district_id,
                school.get("address"),
                lat,
                lng,
                _to_db_int(school.get("students")),
                _to_db_int(school.get("shift")),
                _to_db_int(school.get("capacity")),
                _to_db_int(school.get("workers")),
                _to_db_int(school.get("teachers")),
                school.get("site"),
                bool(school.get("is_state")),
                bool(school.get("is_religional")),
                _to_db_int(school.get("second_shift_students")),
                _to_db_int(school.get("buildings")),
                bool(school.get("renovated")),
                bool(school.get("needs_repairs")),
                bool(school.get("critical_condition")),
                bool(school.get("form")),
                bool(school.get("shkon")),
                bool(school.get("a_school_with_bias")),
            )
        )

    return district_rows, school_rows


def _sync_payload_to_database(payload: dict) -> None:
    district_rows, school_rows = _payload_database_rows(payload)
    conn = get_connection()

    try:
        with conn:
            with conn.cursor() as cur:
                _ensure_database_schema(cur)
                cur.execute("DELETE FROM schools")
                cur.execute("DELETE FROM districts")

                if district_rows:
                    cur.executemany(
                        """
                        INSERT INTO districts (id, name)
                        VALUES (%s, %s)
                        """,
                        district_rows,
                    )

                if school_rows:
                    cur.executemany(
                        """
                        INSERT INTO schools (
                            id,
                            name,
                            district_id,
                            address,
                            latitude,
                            longitude,
                            students,
                            shift,
                            capacity,
                            workers,
                            teachers,
                            site,
                            is_state,
                            is_religional,
                            second_shift_students,
                            buildings,
                            renovated,
                            needs_repairs,
                            critical_condition,
                            form,
                            shkon,
                            a_school_with_bias
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        school_rows,
                    )
    finally:
        conn.close()


def _touch_data_version() -> None:
    global _last_upload_ts
    _last_upload_ts = int(time.time())


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None

    stripped = value.strip()
    return stripped or None


def _validate_coords(coords: list[float] | None) -> tuple[float | None, float | None]:
    if coords is None:
        return None, None

    if len(coords) != 2:
        raise ValueError("coords must contain latitude and longitude")

    return coords[0], coords[1]


def _next_table_id(cur, table_name: str) -> int:
    cur.execute(f"SELECT COALESCE(MAX(id), 0) + 1 FROM {table_name}")
    return int(cur.fetchone()[0])


def _resolve_district_id(
    cur,
    district_id: int | None,
    district_name: str | None,
    *,
    create_missing: bool,
) -> int | None:
    if district_id is not None:
        cur.execute("SELECT id FROM districts WHERE id = %s", (district_id,))
        if cur.fetchone() is None:
            raise ValueError("District not found")
        return district_id

    name = _blank_to_none(district_name)
    if name is None:
        return None

    cur.execute("SELECT id FROM districts WHERE name = %s", (name,))
    row = cur.fetchone()
    if row is not None:
        return int(row[0])

    if not create_missing:
        raise ValueError("District not found")

    new_id = _next_table_id(cur, "districts")
    cur.execute(
        "INSERT INTO districts (id, name) VALUES (%s, %s)",
        (new_id, name),
    )
    return new_id


def _school_by_id(cur, school_id: int) -> dict | None:
    school_columns = _school_select_columns(cur)
    cur.execute(
        f"""
        SELECT
            {school_columns}
        FROM schools s
        LEFT JOIN districts d
            ON s.district_id = d.id
        WHERE s.id = %s
        """,
        (school_id,),
    )
    row = cur.fetchone()
    return _school_from_db_row(row) if row else None


def _admin_school_where(
    *,
    search: str | None,
    district_id: int | None,
    district: str | None,
    has_coords: bool | None,
    bool_filters: dict[str, bool | None],
) -> tuple[str, list]:
    clauses: list[str] = []
    params: list = []

    search_term = _blank_to_none(search)
    if search_term:
        pattern = f"%{search_term}%"
        clauses.append(
            "(s.name ILIKE %s OR s.address ILIKE %s OR d.name ILIKE %s OR s.site ILIKE %s)"
        )
        params.extend([pattern, pattern, pattern, pattern])

    if district_id is not None:
        clauses.append("s.district_id = %s")
        params.append(district_id)

    district_name = _blank_to_none(district)
    if district_name:
        clauses.append("d.name = %s")
        params.append(district_name)

    for column_name, value in bool_filters.items():
        if value is None:
            continue
        clauses.append(f"s.{column_name} = %s")
        params.append(value)

    if has_coords is True:
        clauses.append("s.latitude IS NOT NULL AND s.longitude IS NOT NULL")
    elif has_coords is False:
        clauses.append("(s.latitude IS NULL OR s.longitude IS NULL)")

    if not clauses:
        return "", params

    return "WHERE " + " AND ".join(clauses), params


def _school_create_values(payload: SchoolPayload, district_id: int | None) -> tuple:
    lat, lng = _validate_coords(payload.coords)
    if payload.coords is None:
        lat = payload.latitude
        lng = payload.longitude

    return (
        payload.name,
        district_id,
        payload.address,
        lat,
        lng,
        payload.students,
        payload.shift,
        payload.capacity,
        payload.workers,
        payload.teachers,
        payload.site,
        bool(payload.is_state),
        bool(payload.is_religional),
        payload.second_shift_students,
        payload.buildings if payload.buildings is not None else 1,
        bool(payload.renovated),
        bool(payload.needs_repairs),
        bool(payload.critical_condition),
        bool(payload.form),
        bool(payload.shkon),
        bool(payload.a_school_with_bias),
    )


def _school_update_values(payload: SchoolPayload) -> dict[str, object]:
    fields = payload.model_fields_set
    updates: dict[str, object] = {}

    for column_name in (
        "name",
        "address",
        "students",
        "shift",
        "capacity",
        "workers",
        "teachers",
        "site",
        "second_shift_students",
        "buildings",
    ):
        if column_name in fields:
            updates[column_name] = getattr(payload, column_name)

    for column_name in SCHOOL_BOOL_FILTER_COLUMNS:
        if column_name in fields:
            updates[column_name] = bool(getattr(payload, column_name))

    if "coords" in fields:
        lat, lng = _validate_coords(payload.coords)
        updates["latitude"] = lat
        updates["longitude"] = lng
    else:
        if "latitude" in fields:
            updates["latitude"] = payload.latitude
        if "longitude" in fields:
            updates["longitude"] = payload.longitude

    return updates


def _school_export_rows(schools: list[dict]) -> list[dict]:
    rows: list[dict] = []

    for school in schools:
        coords = school.get("coords") or [None, None]
        export_row = {
            "id": school.get("id"),
            "name": school.get("name"),
            "shift": school.get("shift"),
            "capacity": school.get("capacity"),
            "students": school.get("students"),
            "workers": school.get("workers"),
            "teachers": school.get("teachers"),
            "site": school.get("site"),
            "latitude": coords[0],
            "longitude": coords[1],
            "address": school.get("address"),
            "district": school.get("district"),
            "is_state": "Да" if school.get("is_state") else "Нет",
            "is_religional": "Да" if school.get("is_religional") else "Нет",
            "buildings": school.get("buildings"),
            "renovated": "Да" if school.get("renovated") else "Нет",
            "needs_repairs": "Да" if school.get("needs_repairs") else "Нет",
            "critical_condition": "Да" if school.get("critical_condition") else "Нет",
            "second_shift_students": school.get("second_shift_students"),
            "form": "Да" if school.get("form") else "Нет",
            "shkon": "Да" if school.get("shkon") else "Нет",
            "a_school_with_bias": "Да" if school.get("a_school_with_bias") else "Нет",
        }
        rows.append({header: export_row[key] for key, header in SCHOOL_EXPORT_COLUMNS})

    return rows


def _schools_to_excel_bytes(schools: list[dict]) -> bytes:
    import pandas as pd

    buffer = io.BytesIO()
    headers = [header for _, header in SCHOOL_EXPORT_COLUMNS]
    rows = _school_export_rows(schools)
    df = pd.DataFrame(rows, columns=headers)
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, header=True)

    return buffer.getvalue()


def _make_token(login: str, password: str) -> str:
    payload = f"{login}:{password}:{get_admin_settings().admin_token_salt}".encode("utf-8")

    return hashlib.sha256(payload).hexdigest()


class LoginPayload(BaseModel):
    login: str
    password: str


class SchoolPayload(BaseModel):
    name: str | None = None
    district_id: int | None = None
    district: str | None = None
    address: str | None = None
    coords: list[float] | None = None
    latitude: float | None = None
    longitude: float | None = None
    students: int | None = None
    shift: int | None = None
    capacity: int | None = None
    workers: int | None = None
    teachers: int | None = None
    site: str | None = None
    is_state: bool | None = None
    is_religional: bool | None = None
    second_shift_students: int | None = None
    buildings: int | None = None
    renovated: bool | None = None
    needs_repairs: bool | None = None
    critical_condition: bool | None = None
    form: bool | None = None
    shkon: bool | None = None
    a_school_with_bias: bool | None = None


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/districts")
def list_districts():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM districts")
        districts = _districts_from_db_rows(cur.fetchall())
        cur.close()
        conn.close()
        return districts
    except Exception as e:
        print("DB error:", e)
        try:
            return parse_excel(get_excel_path())["districts"]
        except FileNotFoundError:
            return JSONResponse(status_code=503, content={"detail": "Service unavailable"})


@app.get("/api/districts/{district_id}/schools")
def district_detail(district_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        school_columns = _school_select_columns(cur)

        cur.execute("""
        SELECT name
        FROM districts
        WHERE id = %s
        """, (district_id,))

        district_row = cur.fetchone()
        if not district_row:
            cur.close()
            conn.close()
            return JSONResponse(status_code=404, content={"detail": "District not found"})

        cur.execute(f"""
        SELECT
            {school_columns}
        FROM schools s
        JOIN districts d
            ON s.district_id = d.id
        WHERE s.district_id = %s
        """, (district_id,))

        schools = [_school_from_db_row(row) for row in cur.fetchall()]

        cur.close()
        conn.close()

        return schools
    except Exception as e:
        print("DB error:", e)
        try:
            payload = parse_excel(get_excel_path())
        except FileNotFoundError:
            return JSONResponse(status_code=503, content={"detail": "Service unavailable"})

        district = next(
            (item for item in payload["districts"] if item.get("id") == district_id),
            None,
        )
        if district is None:
            return JSONResponse(status_code=404, content={"detail": "District not found"})

        return [
            school
            for school in payload["schools"]
            if school.get("district") == district["name"]
        ]


@app.post("/api/admin/login")
def login(payload: LoginPayload, response: Response):
    settings = get_admin_settings()

    if payload.login != settings.admin_login or payload.password != settings.admin_password:
        return JSONResponse(status_code=401, content={"detail": "Invalid credentials"})

    response.set_cookie(
        key=COOKIE_NAME,
        value=_make_token(payload.login, payload.password),
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
    )

    return {"status": "ok"}


@app.post("/api/admin/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)

    return {"status": "ok"}


@app.get("/api/admin/districts")
def list_admin_districts():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            _ensure_database_schema(cur)
            cur.execute("""
            SELECT
                d.id,
                d.name,
                COUNT(s.id) AS school_count,
                COALESCE(SUM(s.students), 0) AS students,
                COALESCE(SUM(s.workers), 0) AS workers,
                COALESCE(SUM(s.teachers), 0) AS teachers
            FROM districts d
            LEFT JOIN schools s
                ON s.district_id = d.id
            GROUP BY d.id, d.name
            ORDER BY d.id
            """)
            return [
                {
                    "id": row[0],
                    "name": row[1],
                    "school_count": row[2],
                    "students": row[3],
                    "workers": row[4],
                    "teachers": row[5],
                }
                for row in cur.fetchall()
            ]
    finally:
        conn.close()


@app.get("/api/admin/schools")
def list_admin_schools(
    q: str | None = None,
    search: str | None = None,
    district_id: int | None = None,
    district: str | None = None,
    is_state: bool | None = None,
    is_religional: bool | None = None,
    renovated: bool | None = None,
    needs_repairs: bool | None = None,
    critical_condition: bool | None = None,
    form: bool | None = None,
    shkon: bool | None = None,
    a_school_with_bias: bool | None = None,
    has_coords: bool | None = None,
    limit: int = 50,
    offset: int = 0,
    sort: str = "id",
    order: str = "asc",
):
    sort_column = SCHOOL_SORT_COLUMNS.get(sort)
    if sort_column is None:
        return JSONResponse(status_code=400, content={"detail": "Invalid sort field"})

    direction = order.lower()
    if direction not in {"asc", "desc"}:
        return JSONResponse(status_code=400, content={"detail": "Invalid sort order"})

    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    bool_filters = {
        "is_state": is_state,
        "is_religional": is_religional,
        "renovated": renovated,
        "needs_repairs": needs_repairs,
        "critical_condition": critical_condition,
        "form": form,
        "shkon": shkon,
        "a_school_with_bias": a_school_with_bias,
    }
    where_sql, params = _admin_school_where(
        search=search or q,
        district_id=district_id,
        district=district,
        has_coords=has_coords,
        bool_filters=bool_filters,
    )

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            _ensure_database_schema(cur)
            school_columns = _school_select_columns(cur)

            cur.execute(
                f"""
                SELECT COUNT(*)
                FROM schools s
                LEFT JOIN districts d
                    ON s.district_id = d.id
                {where_sql}
                """,
                params,
            )
            total = cur.fetchone()[0]

            cur.execute(
                f"""
                SELECT
                    {school_columns}
                FROM schools s
                LEFT JOIN districts d
                    ON s.district_id = d.id
                {where_sql}
                ORDER BY {sort_column} {direction}, s.id ASC
                LIMIT %s OFFSET %s
                """,
                [*params, limit, offset],
            )
            items = [_school_from_db_row(row) for row in cur.fetchall()]

            return {
                "items": items,
                "total": total,
                "limit": limit,
                "offset": offset,
            }
    finally:
        conn.close()


@app.get("/api/admin/schools/{school_id}")
def get_admin_school(school_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            _ensure_database_schema(cur)
            school = _school_by_id(cur, school_id)
            if school is None:
                return JSONResponse(status_code=404, content={"detail": "School not found"})
            return school
    finally:
        conn.close()


@app.post("/api/admin/schools")
def create_admin_school(payload: SchoolPayload):
    conn = get_connection()
    try:
        try:
            with conn:
                with conn.cursor() as cur:
                    _ensure_database_schema(cur)
                    school_id = _next_table_id(cur, "schools")
                    district_id = _resolve_district_id(
                        cur,
                        payload.district_id,
                        payload.district,
                        create_missing=True,
                    )
                    values = _school_create_values(payload, district_id)
                    cur.execute(
                        """
                        INSERT INTO schools (
                            id,
                            name,
                            district_id,
                            address,
                            latitude,
                            longitude,
                            students,
                            shift,
                            capacity,
                            workers,
                            teachers,
                            site,
                            is_state,
                            is_religional,
                            second_shift_students,
                            buildings,
                            renovated,
                            needs_repairs,
                            critical_condition,
                            form,
                            shkon,
                            a_school_with_bias
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        (school_id, *values),
                    )
                    school = _school_by_id(cur, school_id)
        except ValueError as e:
            return JSONResponse(status_code=400, content={"detail": str(e)})

        _touch_data_version()
        return school
    finally:
        conn.close()


@app.patch("/api/admin/schools/{school_id}")
def update_admin_school(school_id: int, payload: SchoolPayload):
    conn = get_connection()
    try:
        try:
            with conn:
                with conn.cursor() as cur:
                    _ensure_database_schema(cur)
                    if _school_by_id(cur, school_id) is None:
                        return JSONResponse(status_code=404, content={"detail": "School not found"})

                    updates = _school_update_values(payload)
                    fields = payload.model_fields_set
                    if "district_id" in fields or "district" in fields:
                        district_id = _resolve_district_id(
                            cur,
                            payload.district_id if "district_id" in fields else None,
                            payload.district if "district" in fields else None,
                            create_missing=True,
                        )
                        updates["district_id"] = district_id

                    if updates:
                        set_sql = ", ".join(f"{column_name} = %s" for column_name in updates)
                        cur.execute(
                            f"UPDATE schools SET {set_sql} WHERE id = %s",
                            [*updates.values(), school_id],
                        )

                    school = _school_by_id(cur, school_id)
        except ValueError as e:
            return JSONResponse(status_code=400, content={"detail": str(e)})

        _touch_data_version()
        return school
    finally:
        conn.close()


@app.delete("/api/admin/schools/{school_id}")
def delete_admin_school(school_id: int):
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                _ensure_database_schema(cur)
                cur.execute("DELETE FROM schools WHERE id = %s RETURNING id", (school_id,))
                row = cur.fetchone()
                if row is None:
                    return JSONResponse(status_code=404, content={"detail": "School not found"})

        _touch_data_version()
        return {"status": "deleted", "id": school_id}
    finally:
        conn.close()


@app.get("/api/admin/stats")
def admin_stats():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            _ensure_database_schema(cur)
            cur.execute("""
            SELECT
                COUNT(*) AS schools,
                COALESCE(SUM(students), 0) AS students,
                COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS without_coords,
                COUNT(*) FILTER (WHERE needs_repairs = TRUE) AS needs_repairs,
                COUNT(*) FILTER (WHERE critical_condition = TRUE) AS critical_condition,
                COUNT(*) FILTER (WHERE renovated = TRUE) AS renovated,
                COUNT(*) FILTER (WHERE second_shift_students IS NOT NULL AND second_shift_students > 0) AS second_shift,
                COUNT(*) FILTER (WHERE a_school_with_bias = TRUE) AS biased
            FROM schools
            """)
            school_stats = cur.fetchone()
            cur.execute("SELECT COUNT(*) FROM districts")
            district_count = cur.fetchone()[0]

            return {
                "districts": district_count,
                "schools": school_stats[0],
                "students": school_stats[1],
                "without_coords": school_stats[2],
                "needs_repairs": school_stats[3],
                "critical_condition": school_stats[4],
                "renovated": school_stats[5],
                "second_shift": school_stats[6],
                "a_school_with_bias": school_stats[7],
            }
    finally:
        conn.close()


@app.get("/api/admin/data/export")
def export_admin_excel():
    try:
        payload = _load_from_database()
    except Exception as e:
        print("DB export error:", e)
        return JSONResponse(status_code=500, content={"detail": "Could not export database"})

    content = _schools_to_excel_bytes(payload["schools"])
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="schools-export.xlsx"'},
    )


@app.post("/api/admin/data/upload")
def upload_excel(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".xlsx"):
        return JSONResponse(
            status_code=400,
            content={"detail": "Only .xlsx files are supported"},
        )

    excel_path = get_excel_path()
    excel_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = excel_path.with_name(f"{excel_path.name}.tmp")
    with open(tmp_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    try:
        payload = parse_excel(tmp_path)
    except Exception as e:
        print("Excel parse error:", e)
        tmp_path.unlink(missing_ok=True)
        return JSONResponse(
            status_code=400,
            content={"detail": "Invalid Excel file"},
        )

    try:
        _sync_payload_to_database(payload)
    except Exception as e:
        print("DB sync error:", e)
        tmp_path.unlink(missing_ok=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Could not sync Excel data to database"},
        )

    tmp_path.replace(excel_path)

    _touch_data_version()

    return {
        "status": "ok",
        "districts": len(payload["districts"]),
        "schools": len(payload["schools"]),
    }


@app.get("/api/admin/data/download")
def download_excel():
    excel_path = get_excel_path()
    if not excel_path.exists():
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    return FileResponse(
        excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=excel_path.name,
    )


@app.get("/api/admin/data/exists")
def excel_exists():
    return {"exists": get_excel_path().exists()}


@app.get("/api/data/version")
def data_version():
    if not get_excel_path().exists():
        return JSONResponse(status_code=404, content={"detail": "No data"})

    return {"version": _last_upload_ts}


@app.get("/api/data/all")
def data_all():
    try:
        payload = _load()
    except FileNotFoundError:
        return JSONResponse(status_code=503, content={"detail": "Service unavailable"})

    return {
        "version": _last_upload_ts,
        "districts": payload["districts"],
        "schools": payload["schools"],
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
