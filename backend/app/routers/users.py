from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.errors import AppError
from app.database import get_db
from app.models.follow import Follow
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PaginatedPosts
from app.schemas.user import PaginatedUsers, UserMe, UserProfile, UserUpdateRequest
from app.services.images import save_upload
from app.services.pagination import decode_id_cursor, encode_id_cursor
from app.services.privacy import can_view_posts
from app.services.serializers import build_post_response, build_user_me, build_user_profile

router = APIRouter(prefix="/api/users", tags=["users"])


def _get_user_or_404(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다", "USER_NOT_FOUND")
    return user


def _paginate_offset(query, page: int, size: int) -> dict:
    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()
    has_more = page * size < total
    return {
        "items": rows,
        "next_cursor": str(page + 1) if has_more else None,
        "has_more": has_more,
    }


@router.get("/{username}", response_model=UserProfile)
def get_profile(
    username: str,
    viewer: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    user = _get_user_or_404(db, username)
    return build_user_profile(db, user, viewer)


@router.patch("/me", response_model=UserMe)
def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    update_data = payload.model_dump(exclude_unset=True)

    new_username = update_data.get("username")
    if new_username is not None and new_username != current_user.username:
        taken = db.query(User).filter(User.username == new_username, User.id != current_user.id).first()
        if taken is not None:
            raise AppError(status.HTTP_409_CONFLICT, "이미 사용 중인 아이디입니다", "USERNAME_TAKEN")

    new_email = update_data.get("email")
    if new_email is not None and new_email != current_user.email:
        taken = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
        if taken is not None:
            raise AppError(status.HTTP_409_CONFLICT, "이미 사용 중인 이메일입니다", "EMAIL_TAKEN")

    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return build_user_me(db, current_user)


@router.post("/me/avatar", response_model=UserMe)
def update_my_avatar(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    current_user.avatar_url = save_upload(image, subdir="avatars")
    db.commit()
    db.refresh(current_user)
    return build_user_me(db, current_user)


@router.get("/{username}/posts", response_model=PaginatedPosts)
def list_user_posts(
    username: str,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=12, ge=1, le=50),
    viewer: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    author = _get_user_or_404(db, username)
    if not can_view_posts(db, author, viewer):
        return {"items": [], "next_cursor": None, "has_more": False}

    query = db.query(Post).filter(Post.user_id == author.id)
    last_id = decode_id_cursor(cursor)
    if last_id is not None:
        query = query.filter(Post.id < last_id)
    query = query.order_by(Post.id.desc())

    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    return {
        "items": [build_post_response(db, post, viewer) for post in rows],
        "next_cursor": encode_id_cursor(rows[-1].id) if has_more and rows else None,
        "has_more": has_more,
    }


@router.get("/{username}/followers", response_model=PaginatedUsers)
def list_followers(
    username: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    target = _get_user_or_404(db, username)
    query = (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == target.id)
        .order_by(Follow.id.desc())
    )
    return _paginate_offset(query, page, size)


@router.get("/{username}/following", response_model=PaginatedUsers)
def list_following(
    username: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    target = _get_user_or_404(db, username)
    query = (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == target.id)
        .order_by(Follow.id.desc())
    )
    return _paginate_offset(query, page, size)
