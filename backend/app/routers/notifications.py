from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import AppError
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import PaginatedNotifications, UnreadCountResponse
from app.services.pagination import decode_id_cursor, encode_id_cursor

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=PaginatedNotifications)
def list_notifications(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Notification).filter(Notification.receiver_id == current_user.id)
    last_id = decode_id_cursor(cursor)
    if last_id is not None:
        query = query.filter(Notification.id < last_id)
    query = query.order_by(Notification.id.desc())

    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    return {
        "items": rows,
        "next_cursor": encode_id_cursor(rows[-1].id) if has_more and rows else None,
        "has_more": has_more,
    }


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    count = (
        db.query(Notification)
        .filter(Notification.receiver_id == current_user.id, Notification.is_read.is_(False))
        .count()
    )
    return {"count": count}


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    notification = db.get(Notification, notification_id)
    if notification is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "알림을 찾을 수 없습니다", "NOTIFICATION_NOT_FOUND")
    if notification.receiver_id != current_user.id:
        raise AppError(status.HTTP_403_FORBIDDEN, "권한이 없습니다", "FORBIDDEN")
    notification.is_read = True
    db.commit()


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    db.query(Notification).filter(
        Notification.receiver_id == current_user.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
