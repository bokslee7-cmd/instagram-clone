from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.errors import default_error_code
from app.routers import (
    admin,
    auth,
    comments,
    direct_messages,
    follows,
    notifications,
    posts,
    search,
    users,
)

app = FastAPI(title="Instagram Clone API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=upload_dir.parent), name="static")


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """backend.md 7절 에러 응답 표준({"detail", "error_code"})을 모든 HTTPException에 적용한다."""
    error_code = getattr(exc, "error_code", None) or default_error_code(exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": error_code},
        headers=getattr(exc, "headers", None),
    )


app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(follows.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(comments.comment_router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(direct_messages.router)


@app.get("/api/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
