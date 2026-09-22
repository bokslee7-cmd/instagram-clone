from sqlalchemy.orm import Session

from app.models.notification import Notification

NOTIFICATION_TYPES = {"like", "comment", "follow", "mention"}


def create_notification(
    db: Session,
    *,
    receiver_id: int,
    actor_id: int,
    type: str,
    post_id: int | None = None,
    comment_id: int | None = None,
) -> Notification | None:
    """알림 생성. 본인 행위에 대한 자기 알림은 생성하지 않는다."""
    if receiver_id == actor_id:
        return None

    notification = Notification(
        receiver_id=receiver_id,
        actor_id=actor_id,
        type=type,
        post_id=post_id,
        comment_id=comment_id,
    )
    db.add(notification)
    return notification
