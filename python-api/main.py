import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from routers import scan_receipt, scan_schedule  # noqa: E402
from services.ocr import warm_up  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load EasyOCR model at startup (used by scan_schedule for image-based schedules)
    warm_up()
    yield


app = FastAPI(title="Coupletastic Scan Service", lifespan=lifespan)

API_KEY = os.getenv("SCAN_SERVICE_API_KEY", "")


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Health check is public
    if request.url.path == "/health":
        return await call_next(request)

    auth_header = request.headers.get("authorization", "")
    if not API_KEY or not auth_header.startswith("Bearer ") or auth_header[7:] != API_KEY:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    return await call_next(request)


app.include_router(scan_receipt.router)
app.include_router(scan_schedule.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
