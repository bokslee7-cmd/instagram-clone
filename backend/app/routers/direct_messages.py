from fastapi import APIRouter, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import AppError
from app.database import get_db
from app.models.direct_message import DirectMessage, DirectThread
from app.models.user import User
from app.schemas.direct_message import (
    DirectMessageResponse,
    DirectThreadDetailResponse,
    DirectThreadResponse,
    SendMessageRequest,
    StartThreadRequest,
    UnreadThreadCountResponse,
)

router = APIRouter(prefix="/api/direct", tags=["direct-messages"])


def _get_thread_or_404(db: Session, thread_id: int) -> DirectThread:
    thread = db.get(DirectThread, thread_id)
    if thread is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "대화방을 찾을 수 없습니다", "THREAD_NOT_FOUND")
    return thread


def _ensure_participant(thread: DirectThread, current_user: User) -> None:
    if current_user.id not in (thread.user_a_id, thread.user_b_id):
        raise AppError(status.HTTP_403_FORBIDDEN, "대화방 참여자만 접근할 수 있습니다", "FORBIDDEN")


def _participant_of(thread: DirectThread, current_user: User) -> User:
    return thread.user_b if thread.user_a_id == current_user.id else thread.user_a


def _build_thread_response(db: Session, thread: DirectThread, current_user: User) -> dict:
    last_message = (
        db.query(DirectMessage)
        .filter(DirectMessage.thread_id == thread.id)
        .order_by(DirectMessage.id.desc())
        .first()
    )
    unread_count = (
        db.query(DirectMessage)
        .filter(
            DirectMessage.thread_id == thread.id,
            DirectMessage.sender_id != current_user.id,
            DirectMessage.is_read.is_(False),
        )
        .count()
    )
    return {
        "id": thread.id,
        "participant": _participant_of(thread, current_user),
        "last_message": last_message,
        "unread_count": unread_count,
        "updated_at": last_message.created_at if last_message else thread.created_at,
    }


@router.get("/threads", response_model=list[DirectThreadResponse])
def list_threads(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[dict]:
    threads = (
        db.query(DirectThread)
        .filter(
            or_(DirectThread.user_a_id == current_user.id, DirectThread.user_b_id == current_user.id)
        )
        .all()
    )
    results = [_build_thread_response(db, thread, current_user) for thread in threads]
    results.sort(key=lambda item: item["updated_at"], reverse=True)
    return results


@router.get("/threads/unread-count", response_model=UnreadThreadCountResponse)
def get_unread_thread_count(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    threads = (
        db.query(DirectThread)
        .filter(
            or_(DirectThread.user_a_id == current_user.id, DirectThread.user_b_id == current_user.id)
        )
        .all()
    )
    count = sum(
        1
        for thread in threads
        if db.query(DirectMessage)
        .filter(
            DirectMessage.thread_id == thread.id,
            DirectMessage.sender_id != current_user.id,
            DirectMessage.is_read.is_(False),
        )
        .first()
        is not None
    )
    return {"count": count}


@router.post("/threads", response_model=DirectThreadResponse, status_code=status.HTTP_201_CREATED)
def start_thread(
    payload: StartThreadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    target = db.query(User).filter(User.username == payload.username).first()
    if target is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다", "USER_NOT_FOUND")
    if target.id == current_user.id:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "자기 자신과 대화를 시작할 수 없습니다",
            "SELF_THREAD_NOT_ALLOWED",
        )

    user_a_id, user_b_id = sorted((current_user.id, target.id))
    thread = (
        db.query(DirectThread)
        .filter(DirectThread.user_a_id == user_a_id, DirectThread.user_b_id == user_b_id)
        .first()
    )
    if thread is None:
        thread = DirectThread(user_a_id=user_a_id, user_b_id=user_b_id)
        db.add(thread)
        db.commit()
        db.refresh(thread)

    return _build_thread_response(db, thread, current_user)


@router.get("/threads/{thread_id}", response_model=DirectThreadDetailResponse)
def get_thread_detail(
    thread_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    thread = _get_thread_or_404(db, thread_id)
    _ensure_participant(thread, current_user)

    db.query(DirectMessage).filter(
        DirectMessage.thread_id == thread_id,
        DirectMessage.sender_id != current_user.id,
        DirectMessage.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(DirectMessage)
        .filter(DirectMessage.thread_id == thread_id)
        .order_by(DirectMessage.id.asc())
        .all()
    )
    return {
        "thread": _build_thread_response(db, thread, current_user),
        "messages": messages,
    }


@router.post(
    "/threads/{thread_id}/messages",
    response_model=DirectMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    thread_id: int,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DirectMessage:
    thread = _get_thread_or_404(db, thread_id)
    _ensure_participant(thread, current_user)

    message = DirectMessage(thread_id=thread_id, sender_id=current_user.id, content=payload.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
