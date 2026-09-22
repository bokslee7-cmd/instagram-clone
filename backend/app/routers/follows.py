from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import AppError
from app.database import get_db
from app.models.follow import Follow
from app.models.user import User
from app.services.notifications import create_notification

router = APIRouter(prefix="/api/follows", tags=["follows"])


def _get_target_or_404(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다", "USER_NOT_FOUND")
    return user


@router.post("/{username}", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(
    username: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    target = _get_target_or_404(db, username)
    if target.id == current_user.id:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "자기 자신을 팔로우할 수 없습니다", "SELF_FOLLOW_NOT_ALLOWED"
        )

    existing = (
        db.query(Follow)
        .filter(Follow.follower_id == current_user.id, Follow.following_id == target.id)
        .first()
    )
    if existing is None:
        db.add(Follow(follower_id=current_user.id, following_id=target.id))
        create_notification(db, receiver_id=target.id, actor_id=current_user.id, type="follow")
        db.commit()


@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    username: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    target = _get_target_or_404(db, username)
    db.query(Follow).filter(
        Follow.follower_id == current_user.id, Follow.following_id == target.id
    ).delete()
    db.commit()
