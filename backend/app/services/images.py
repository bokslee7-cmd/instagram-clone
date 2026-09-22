import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def validate_image(file: UploadFile) -> None:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="지원하지 않는 이미지 형식입니다 (jpg, jpeg, png, webp만 허용)",
        )


def save_upload(file: UploadFile, subdir: str = "") -> str:
    validate_image(file)

    upload_dir = Path(settings.UPLOAD_DIR) / subdir
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{Path(file.filename or '').suffix.lower()}"
    destination = upload_dir / filename

    content = file.file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="파일 크기는 10MB를 초과할 수 없습니다",
        )

    with destination.open("wb") as buffer:
        buffer.write(content)

    try:
        with Image.open(destination) as image:
            image.verify()
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="유효한 이미지 파일이 아닙니다",
        ) from exc

    return f"/static/uploads/{subdir}/{filename}".replace("//", "/")
