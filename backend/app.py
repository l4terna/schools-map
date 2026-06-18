from __future__ import annotations

from fastapi import FastAPI, UploadFile, File, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel

from io import BytesIO
import hashlib
import re
import shutil
import time

from .config import get_admin_settings, get_excel_path
from .parser import parse_excel
from .database.db import get_connection, get_connection_params
from .services.db_service import DatabaseService, DBValidationError
from .services.sync_service import SyncService
from .services.excel_service import ExcelValidationError

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

connection_params = get_connection_params()
db_service = DatabaseService(connection_params)
sync_service = SyncService(db_service)


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


# def _load():
#     return parse_excel(get_excel_path())
def _load():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
        SELECT
            s.id,
            s.name,
            d.name,
            s.address,
            s.latitude,
            s.longitude,
            s.students
        FROM schools s
        JOIN districts d
            ON s.district_id = d.id
        """)

        rows = cur.fetchall()

        schools = []

        for row in rows:
            lat = row[4]
            lng = row[5]
            schools.append({
                "id": row[0],
                "name": row[1],
                "district": row[2],
                "address": row[3],
                "coords": [lat, lng] if lat is not None and lng is not None else None,
                "students": row[6],
                "shift": None,
                "capacity": None,
                "workers": None,
                "teachers": None,
                "site": None,
                "is_state": False,
                "is_religional": False,
                "second_shift_students": None,
                "buildings": None,
                "renovated": False,
                "needs_repairs": False,
                "critical_condition": False,
                "form": False,
                "shkon": False,
                "a_school_with_bias": False,
            })

        cur.execute("""
        SELECT id, name
        FROM districts
        """)

        districts = []
        districts_by_key: dict[str, dict] = {}

        def normalize_district_name(name: str) -> str:
            normalized = re.sub(r"\s+", " ", name.lower()).strip()
            normalized = normalized.replace("городской округ", "город")
            normalized = normalized.replace("район", "р-н")
            normalized = normalized.replace("р-н", "р-н")
            normalized = normalized.replace("(город)", "город")
            return normalized

        def prefer_district_name(candidate: str, current: str) -> bool:
            if "(город)" in candidate and "(город)" not in current:
                return True
            if "р-н" in candidate and "р-н" not in current:
                return True
            return False

        for row in cur.fetchall():
            district = {"id": row[0], "name": row[1]}
            key = normalize_district_name(district["name"])
            existing = districts_by_key.get(key)
            if existing is None or prefer_district_name(district["name"], existing["name"]):
                districts_by_key[key] = district

        districts = list(districts_by_key.values())

        cur.close()
        conn.close()

        return {
            "districts": districts,
            "schools": schools
        }

    except Exception as e:
        print("DB error:", e)

        return parse_excel(get_excel_path())


def _make_token(login: str, password: str) -> str:
    payload = f"{login}:{password}:{get_admin_settings().admin_token_salt}".encode("utf-8")

    return hashlib.sha256(payload).hexdigest()


class LoginPayload(BaseModel):
    login: str
    password: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/districts")
def list_districts():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM districts")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        districts_by_key: dict[str, dict] = {}

        def normalize(name: str) -> str:
            n = re.sub(r"\s+", " ", name.lower()).strip()
            n = n.replace("городской округ", "город")
            n = n.replace("район", "р-н")
            n = n.replace("(город)", "город")
            return n

        def prefer(candidate: str, current: str) -> bool:
            if "(город)" in candidate and "(город)" not in current:
                return True
            if "р-н" in candidate and "р-н" not in current:
                return True
            return False

        for r in rows:
            district = {"id": int(r[0]), "name": str(r[1]) if r[1] is not None else None}
            if district["name"] is None:
                continue
            key = normalize(district["name"])
            existing = districts_by_key.get(key)
            if existing is None or prefer(district["name"], existing["name"]):
                districts_by_key[key] = district

        districts = list(districts_by_key.values())
        return districts
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/districts/{district_id}/schools")
def district_detail(district_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()

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

        cur.execute("""
        SELECT
            s.id,
            s.name,
            d.name,
            s.address,
            s.latitude,
            s.longitude,
            s.students
        FROM schools s
        JOIN districts d
            ON s.district_id = d.id
        WHERE s.district_id = %s
        """, (district_id,))

        schools = []
        for row in cur.fetchall():
            lat = row[4]
            lng = row[5]
            schools.append({
                "id": row[0],
                "name": row[1],
                "district": row[2],
                "address": row[3],
                "coords": [lat, lng] if lat is not None and lng is not None else None,
                "students": row[6],
                "shift": None,
                "capacity": None,
                "workers": None,
                "teachers": None,
                "site": None,
                "is_state": False,
                "is_religional": False,
                "second_shift_students": None,
                "buildings": None,
                "renovated": False,
                "needs_repairs": False,
                "critical_condition": False,
                "form": False,
                "shkon": False,
                "a_school_with_bias": False,
            })

        cur.close()
        conn.close()

        return schools
    except Exception as e:
        print("DB error:", e)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


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


@app.post("/api/admin/data/upload")
def upload_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".xlsx"):
        return JSONResponse(
            status_code=400,
            content={"detail": "Only .xlsx files are supported"},
        )

    excel_path = get_excel_path()
    tmp_path = excel_path.with_name(f"{excel_path.name}.tmp")
    with open(tmp_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    tmp_path.replace(excel_path)

    global _last_upload_ts
    _last_upload_ts = int(time.time())

    return {"status": "ok"}


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


@app.get("/api/admin/db/status")
def db_status():
    return sync_service.get_db_status()


@app.post("/api/admin/db/clear")
def clear_db():
    try:
        sync_service.clear_database()
        return {"status": "ok"}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.post("/api/admin/import/excel")
def import_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".xlsx"):
        return JSONResponse(
            status_code=400,
            content={"detail": "Only .xlsx files are supported"},
        )

    excel_path = get_excel_path()
    tmp_path = excel_path.with_name(f"{excel_path.name}.import.tmp")
    with open(tmp_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    try:
        sync_service.import_excel_to_db(str(tmp_path))
    except ExcelValidationError as exc:
        return JSONResponse(status_code=400, content={"detail": str(exc)})
    except DBValidationError as exc:
        return JSONResponse(status_code=400, content={"detail": str(exc)})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass

    return {"status": "ok"}


@app.get("/api/admin/export/excel")
def export_excel():
    try:
        excel_bytes = sync_service.export_db_to_excel()
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})

    return StreamingResponse(
        content=BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=schools_db_export.xlsx"},
    )


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