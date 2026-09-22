from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.errors import AppError
from app.database import get_db
from app.models.comment import Comment, CommentLike
from app.models.post import Post
from app.models.user import User
from app.schemas.comment import CommentCreateRequest, CommentResponse, PaginatedComments
from app.services.notifications import create_notification
from app.services.pagination import decode_id_cursor, encode_id_cursor
from app.services.serializers import build_comment_response

router = APIRouter(prefix="/api/posts/{post_id}/comments", tags=["comments"])
comment_router = APIRouter(prefix="/api/comments", tags=["comments"])


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "게시물을 찾을 수 없습니다", "POST_NOT_FOUND")
    return post


def _get_comment_or_404(db: Session, comment_id: int) -> Comment:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "댓글을 찾을 수 없습니다", "COMMENT_NOT_FOUND")
    return comment


@router.get("", response_model=PaginatedComments)
def list_comments(
    post_id: int,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    viewer: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    _get_post_or_404(db, post_id)

    query = db.query(Comment).filter(Comment.post_id == post_id, Comment.parent_id.is_(None))
    last_id = decode_id_cursor(cursor)
    if last_id is not None:
        query = query.filter(Comment.id > last_id)
    query = query.order_by(Comment.id.asc())

    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    return {
        "items": [build_comment_response(db, comment, viewer) for comment in rows],
        "next_cursor": encode_id_cursor(rows[-1].id) if has_more and rows else None,
        "has_more": has_more,
    }


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    payload: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    post = _get_post_or_404(db, post_id)

    if payload.parent_id is not None:
        parent = _get_comment_or_404(db, payload.parent_id)
        if parent.post_id != post_id:
            raise AppError(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "다른 게시물의 댓글에는 답글을 달 수 없습니다",
                "INVALID_PARENT_COMMENT",
            )
        if parent.parent_id is not None:
            raise AppError(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "대댓글에는 답글을 달 수 없습니다(1단계까지만 허용)",
                "REPLY_DEPTH_LIMIT",
            )

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=payload.parent_id,
        content=payload.content,
    )
    db.add(comment)
    db.flush()

    create_notification(
        db,
        receiver_id=post.user_id,
        actor_id=current_user.id,
        type="comment",
        post_id=post_id,
        comment_id=comment.id,
    )

    db.commit()
    db.refresh(comment)
    return build_comment_response(db, comment, current_user, include_replies=False)


@comment_router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    comment = _get_comment_or_404(db, comment_id)
    post = db.get(Post, comment.post_id)
    if comment.user_id != current_user.id and (post is None or post.user_id != current_user.id):
        raise AppError(status.HTTP_403_FORBIDDEN, "댓글을 삭제할 권한이 없습니다", "FORBIDDEN")
    db.delete(comment)
    db.commit()


@comment_router.post("/{comment_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def like_comment(
    comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    _get_comment_or_404(db, comment_id)
    existing = (
        db.query(CommentLike)
        .filter(CommentLike.comment_id == comment_id, CommentLike.user_id == current_user.id)
        .first()
    )
    if existing is None:
        db.add(CommentLike(comment_id=comment_id, user_id=current_user.id))
        db.commit()
