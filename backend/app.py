from __future__ import annotations

from fastapi import FastAPI, UploadFile, File, Response, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

import hashlib
import shutil
import time

from config import get_admin_settings, get_excel_path
from parser import parse_excel

COOKIE_NAME = "admin_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 дней

app = FastAPI(title="Schools Map API")

_last_upload_ts: int = int(time.time())


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
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


def _load():
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
        payload = _load()
    except FileNotFoundError:
        return JSONResponse(status_code=503, content={"detail": "Service unavailable"})

    return payload["districts"]


@app.get("/api/districts/{district_id}/schools")
def district_detail(district_id: int):
    try:
        payload = _load()
    except FileNotFoundError:
        return JSONResponse(status_code=503, content={"detail": "Service unavailable"})

    district = next(
        (d for d in payload["districts"] if d.get("id") == district_id),
        None,
    )

    if not district:
        return JSONResponse(status_code=404, content={"detail": "District not found"})

    schools = [s for s in payload["schools"] if s.get("district") == district.get("name")]

    return schools


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
