from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint("type IN ('like', 'comment', 'follow')", name="ck_notifications_type"),
        Index("ix_notifications_receiver_created_at", "receiver_id", "created_at"),
        Index("ix_notifications_receiver_is_read", "receiver_id", "is_read"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    receiver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    post_id: Mapped[int | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=True
    )
    comment_id: Mapped[int | None] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    receiver = relationship("User", foreign_keys=[receiver_id])
    actor = relationship("User", foreign_keys=[actor_id])
    post = relationship("Post", foreign_keys=[post_id])
