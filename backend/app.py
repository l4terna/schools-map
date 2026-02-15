from __future__ import annotations

from fastapi import FastAPI, UploadFile, File, Response, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

import hashlib
import os
import shutil

from parser import parse_excel


EXCEL_PATH = "database/data.xlsx"

COOKIE_NAME = "admin_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30 # 30 дней
ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "admin"
TOKEN_SALT = "hype"

app = FastAPI(title="Schools Map API")


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.middleware("http")
async def admin_guard(request: Request, call_next):
    if request.url.path.startswith("/api/admin"):
        if request.url.path in {"/api/admin/login", "/api/admin/logout"}:
            return await call_next(request)

        token = request.cookies.get(COOKIE_NAME)
        
        if token != _make_token(ADMIN_LOGIN, ADMIN_PASSWORD):
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)


def _load():
    return parse_excel(EXCEL_PATH)


def _make_token(login: str, password: str) -> str:
    payload = f"{login}:{password}:{TOKEN_SALT}".encode("utf-8")
    
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
    if payload.login != ADMIN_LOGIN or payload.password != ADMIN_PASSWORD:
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

    tmp_path = f"{EXCEL_PATH}.tmp"
    with open(tmp_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    os.replace(tmp_path, EXCEL_PATH)

    return {"status": "ok"}


@app.get("/api/admin/data/download")
def download_excel():
    if not os.path.exists(EXCEL_PATH):
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    return FileResponse(
        EXCEL_PATH,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(EXCEL_PATH),
    )


@app.get("/api/admin/data/exists")
def excel_exists():
    return {"exists": os.path.exists(EXCEL_PATH)}
