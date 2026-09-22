from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DirectThread(Base):
    __tablename__ = "direct_threads"
    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_direct_threads_pair"),
        CheckConstraint("user_a_id < user_b_id", name="ck_direct_threads_ordered_pair"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_a_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user_b_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user_a = relationship("User", foreign_keys=[user_a_id], back_populates="direct_threads_as_a")
    user_b = relationship("User", foreign_keys=[user_b_id], back_populates="direct_threads_as_b")
    messages = relationship(
        "DirectMessage",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="DirectMessage.created_at",
    )


class DirectMessage(Base):
    __tablename__ = "direct_messages"
    __table_args__ = (Index("ix_direct_messages_thread_id_created_at", "thread_id", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_id: Mapped[int] = mapped_column(
        ForeignKey("direct_threads.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    thread = relationship("DirectThread", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")