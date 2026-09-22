"""add direct messages and notification constraints

Revision ID: 8f3a1c2d4e5b
Revises: c221ae4356cd
Create Date: 2026-09-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8f3a1c2d4e5b"
down_revision: Union[str, None] = "c221ae4356cd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.create_check_constraint(
            "ck_notifications_type",
            "type IN ('like', 'comment', 'follow')",
        )

    op.create_table(
        "direct_threads",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_a_id", sa.Integer(), nullable=False),
        sa.Column("user_b_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("user_a_id < user_b_id", name="ck_direct_threads_ordered_pair"),
        sa.ForeignKeyConstraint(["user_a_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_b_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_a_id", "user_b_id", name="uq_direct_threads_pair"),
    )
    op.create_table(
        "direct_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("thread_id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.String(length=1000), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["thread_id"], ["direct_threads.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_direct_messages_thread_id_created_at",
        "direct_messages",
        ["thread_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_direct_messages_thread_id_created_at", table_name="direct_messages")
    op.drop_table("direct_messages")
    op.drop_table("direct_threads")
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.drop_constraint("ck_notifications_type", type_="check")