from datetime import datetime, timedelta
from math import ceil

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.core.errors import AppError
from app.database import get_db
from app.models.comment import Comment
from app.models.direct_message import DirectMessage
from app.models.follow import Follow
from app.models.like import Like
from app.models.post import Post
from app.models.user import User
from app.schemas.admin import AdminStatsResponse, PaginatedAdminPosts, PaginatedAdminUsers
from app.services.serializers import build_post_response

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _build_admin_user(db: Session, user: User) -> dict:
    post_count = db.query(func.count(Post.id)).filter(Post.user_id == user.id).scalar() or 0
    follower_count = (
        db.query(func.count(Follow.id)).filter(Follow.following_id == user.id).scalar() or 0
    )
    following_count = (
        db.query(func.count(Follow.id)).filter(Follow.follower_id == user.id).scalar() or 0
    )
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "is_private": user.is_private,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "post_count": post_count,
        "follower_count": follower_count,
        "following_count": following_count,
    }


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    total_posts = db.query(func.count(Post.id)).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0
    total_likes = db.query(func.count(Like.id)).scalar() or 0
    total_follows = db.query(func.count(Follow.id)).scalar() or 0
    total_direct_messages = db.query(func.count(DirectMessage.id)).scalar() or 0

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    new_users_today = (
        db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    )

    signups_last_14_days = []
    for offset in range(13, -1, -1):
        day_start = today_start - timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(func.count(User.id))
            .filter(User.created_at >= day_start, User.created_at < day_end)
            .scalar()
            or 0
        )
        signups_last_14_days.append({"date": day_start.strftime("%m-%d"), "count": count})

    like_count_col = func.count(Like.id).label("like_count")
    top_posts_rows = (
        db.query(Post)
        .outerjoin(Like, Like.post_id == Post.id)
        .group_by(Post.id)
        .order_by(like_count_col.desc(), Post.id.desc())
        .limit(5)
        .all()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "deactivated_users": total_users - active_users,
        "total_posts": total_posts,
        "total_comments": total_comments,
        "total_likes": total_likes,
        "total_follows": total_follows,
        "total_direct_messages": total_direct_messages,
        "new_users_today": new_users_today,
        "signups_last_14_days": signups_last_14_days,
        "top_posts": [build_post_response(db, post, None) for post in top_posts_rows],
    }


@router.get("/users", response_model=PaginatedAdminUsers)
def list_users(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    q: str | None = Query(default=None),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(User)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(User.username.ilike(pattern), User.email.ilike(pattern)))
    query = query.order_by(User.created_at.desc())

    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()

    return {
        "items": [_build_admin_user(db, user) for user in rows],
        "page": page,
        "size": size,
        "total": total,
        "total_pages": max(1, ceil(total / size)),
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    """회원 탈퇴 처리. 실제 레코드는 남기고 is_active만 False로 바꾼다(로그인 즉시 차단).

    사용자/게시물/댓글 등을 하드 삭제하면 다른 사용자의 피드·댓글·알림까지 연쇄
    삭제되어 버리므로, 탈퇴는 소프트 삭제로 처리한다(db.md의 is_active 컬럼 설계 의도).
    """
    if user_id == current_admin.id:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "관리자 본인 계정은 탈퇴 처리할 수 없습니다",
            "CANNOT_DEACTIVATE_SELF",
        )

    user = db.get(User, user_id)
    if user is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다", "USER_NOT_FOUND")

    user.is_active = False
    db.commit()


@router.get("/posts", response_model=PaginatedAdminPosts)
def list_posts(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Post).order_by(Post.id.desc())
    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()

    return {
        "items": [build_post_response(db, post, None) for post in rows],
        "page": page,
        "size": size,
        "total": total,
        "total_pages": max(1, ceil(total / size)),
    }
