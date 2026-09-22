"""ORM 객체 -> 응답 dict 빌더.

좋아요/댓글 수, is_liked/is_saved/is_following 같은 조회자 개인화 필드는
컬럼으로 비정규화하지 않고(db.md 6절) 매 요청마다 계산한다.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.comment import Comment, CommentLike
from app.models.follow import Follow
from app.models.like import Like
from app.models.post import Post
from app.models.saved_post import SavedPost
from app.models.user import User
from app.services.privacy import is_following


def build_user_profile(db: Session, user: User, viewer: User | None) -> dict:
    post_count = db.query(func.count(Post.id)).filter(Post.user_id == user.id).scalar() or 0
    follower_count = (
        db.query(func.count(Follow.id)).filter(Follow.following_id == user.id).scalar() or 0
    )
    following_count = (
        db.query(func.count(Follow.id)).filter(Follow.follower_id == user.id).scalar() or 0
    )
    viewer_follows = False
    if viewer is not None and viewer.id != user.id:
        viewer_follows = is_following(db, viewer.id, user.id)

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "website": user.website,
        "is_private": user.is_private,
        "post_count": post_count,
        "follower_count": follower_count,
        "following_count": following_count,
        "is_following": viewer_follows,
    }


def build_user_me(db: Session, user: User) -> dict:
    profile = build_user_profile(db, user, user)
    profile["email"] = user.email
    profile["is_admin"] = user.is_admin
    return profile


def build_post_response(db: Session, post: Post, viewer: User | None) -> dict:
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    comment_count = (
        db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar() or 0
    )
    is_liked = False
    is_saved = False
    if viewer is not None:
        is_liked = (
            db.query(Like.id)
            .filter(Like.post_id == post.id, Like.user_id == viewer.id)
            .first()
            is not None
        )
        is_saved = (
            db.query(SavedPost.id)
            .filter(SavedPost.post_id == post.id, SavedPost.user_id == viewer.id)
            .first()
            is not None
        )

    return {
        "id": post.id,
        "author": post.author,
        "caption": post.caption,
        "location": post.location,
        "images": sorted(post.images, key=lambda img: img.order_index),
        "like_count": like_count,
        "comment_count": comment_count,
        "is_liked": is_liked,
        "is_saved": is_saved,
        "created_at": post.created_at,
    }


def build_comment_response(
    db: Session, comment: Comment, viewer: User | None, *, include_replies: bool = True
) -> dict:
    like_count = (
        db.query(func.count(CommentLike.id))
        .filter(CommentLike.comment_id == comment.id)
        .scalar()
        or 0
    )
    is_liked = False
    if viewer is not None:
        is_liked = (
            db.query(CommentLike.id)
            .filter(CommentLike.comment_id == comment.id, CommentLike.user_id == viewer.id)
            .first()
            is not None
        )

    replies: list[dict] = []
    if include_replies:
        reply_rows = (
            db.query(Comment)
            .filter(Comment.parent_id == comment.id)
            .order_by(Comment.id.asc())
            .all()
        )
        replies = [
            build_comment_response(db, reply, viewer, include_replies=False) for reply in reply_rows
        ]

    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "author": comment.author,
        "parent_id": comment.parent_id,
        "content": comment.content,
        "like_count": like_count,
        "is_liked": is_liked,
        "created_at": comment.created_at,
        "replies": replies,
    }
