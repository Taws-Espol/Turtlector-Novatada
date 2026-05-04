import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config.settings import settings
from app.schemas.response import ErrorResponse, HealthResponse
from app.routers import chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="API para el proyecto Turtlector que interactúa con IA para orientación vocacional",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

app.include_router(chat.router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.warning(
        "HTTP exception",
        extra={"path": str(request.url.path), "status_code": exc.status_code},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail, detail=f"Error {exc.status_code}"
        ).dict(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.exception("Unhandled server exception", extra={"path": str(request.url.path)})
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Error interno del servidor", detail=str(exc)
        ).dict(),
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Endpoint de verificación de salud de la API.
    """
    return HealthResponse(status="healthy", version=settings.app_version)


frontend_dist_dir = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend_dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist_dir), html=True), name="frontend")
else:
    logger.warning(
        "Frontend dist directory not found. Build frontend before starting production server.",
        extra={"expected_dir": str(frontend_dist_dir)},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app", host=settings.host, port=settings.port, reload=settings.reload
    )
