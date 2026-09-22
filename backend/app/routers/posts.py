from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.errors import AppError
from app.database import get_db
from app.models.follow import Follow
from app.models.like import Like
from app.models.post import Post, PostImage
from app.models.saved_post import SavedPost
from app.models.user import User
from app.schemas.post import PaginatedPosts, PostResponse
from app.services.images import save_upload
from app.services.notifications import create_notification
from app.services.pagination import (
    decode_explore_cursor,
    decode_id_cursor,
    encode_explore_cursor,
    encode_id_cursor,
)
from app.services.privacy import can_view_posts, hidden_private_author_ids
from app.services.serializers import build_post_response

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "게시물을 찾을 수 없습니다", "POST_NOT_FOUND")
    return post


@router.get("/feed", response_model=PaginatedPosts)
def get_feed(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    viewer: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Post)
    if viewer is not None:
        following_ids = [
            row[0]
            for row in db.query(Follow.following_id).filter(Follow.follower_id == viewer.id).all()
        ]
        allowed_ids = [*following_ids, viewer.id]
        query = query.filter(Post.user_id.in_(allowed_ids))
    else:
        hidden_ids = hidden_private_author_ids(db, None)
        if hidden_ids:
            query = query.filter(Post.user_id.notin_(hidden_ids))

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


@router.get("/explore", response_model=PaginatedPosts)
def get_explore(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=50),
    viewer: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    like_count_col = func.count(Like.id).label("like_count")
    query = db.query(Post, like_count_col).outerjoin(Like, Like.post_id == Post.id).group_by(Post.id)

    hidden_ids = hidden_private_author_ids(db, viewer)
    if hidden_ids:
        query = query.filter(Post.user_id.notin_(hidden_ids))

    decoded = decode_explore_cursor(cursor)
    if decoded is not None:
        last_like_count, last_id = decoded
        query = query.having(
            or_(
                like_count_col < last_like_count,
                and_(like_count_col == last_like_count, Post.id < last_id),
            )
        )

    query = query.order_by(like_count_col.desc(), Post.id.desc())
    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [build_post_response(db, post, viewer) for post, _ in rows]
    next_cursor = None
    if has_more and rows:
        last_post, last_like_count = rows[-1]
        next_cursor = encode_explore_cursor(last_like_count, last_post.id)
    return {"items": items, "next_cursor": next_cursor, "has_more": has_more}


@router.get("/saved", response_model=PaginatedPosts)
def get_saved_posts(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=12, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    query = (
        db.query(Post, SavedPost.id.label("saved_id"))
        .join(SavedPost, SavedPost.post_id == Post.id)
        .filter(SavedPost.user_id == current_user.id)
    )
    last_id = decode_id_cursor(cursor)
    if last_id is not None:
        query = query.filter(SavedPost.id < last_id)
    query = query.order_by(SavedPost.id.desc())

    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    return {
        "items": [build_post_response(db, post, current_user) for post, _ in rows],
        "next_cursor": encode_id_cursor(rows[-1][1]) if has_more and rows else None,
        "has_more": has_more,
    }


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    caption: str | None = Form(default=None, max_length=2200),
    location: str | None = Form(default=None, max_length=100),
    images: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if not images:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "이미지를 최소 1장 첨부해야 합니다", "IMAGE_REQUIRED"
        )

    post = Post(user_id=current_user.id, caption=caption, location=location)
    db.add(post)
    db.flush()

    for index, image in enumerate(images):
        url = save_upload(image, subdir="posts")
        db.add(PostImage(post_id=post.id, image_url=url, order_index=index))

    db.commit()
    db.refresh(post)
    return build_post_response(db, post, current_user)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    viewer: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    post = _get_post_or_404(db, post_id)
    if not can_view_posts(db, post.author, viewer):
        raise AppError(status.HTTP_404_NOT_FOUND, "게시물을 찾을 수 없습니다", "POST_NOT_FOUND")
    return build_post_response(db, post, viewer)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    post = _get_post_or_404(db, post_id)
    if post.user_id != current_user.id and not current_user.is_admin:
        raise AppError(status.HTTP_403_FORBIDDEN, "본인 게시물만 삭제할 수 있습니다", "FORBIDDEN")
    db.delete(post)
    db.commit()


@router.post("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def like_post(
    post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    post = _get_post_or_404(db, post_id)
    existing = (
        db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first()
    )
    if existing is None:
        db.add(Like(post_id=post_id, user_id=current_user.id))
        create_notification(
            db, receiver_id=post.user_id, actor_id=current_user.id, type="like", post_id=post_id
        )
        db.commit()


@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    _get_post_or_404(db, post_id)
    db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).delete()
    db.commit()


@router.post("/{post_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def save_post(
    post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    _get_post_or_404(db, post_id)
    existing = (
        db.query(SavedPost)
        .filter(SavedPost.post_id == post_id, SavedPost.user_id == current_user.id)
        .first()
    )
    if existing is None:
        db.add(SavedPost(post_id=post_id, user_id=current_user.id))
        db.commit()


@router.delete("/{post_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_post(
    post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    db.query(SavedPost).filter(
        SavedPost.post_id == post_id, SavedPost.user_id == current_user.id
    ).delete()
    db.commit()
