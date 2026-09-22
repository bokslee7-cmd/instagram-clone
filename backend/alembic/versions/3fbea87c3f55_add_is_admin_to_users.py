"""add is_admin to users

Revision ID: 3fbea87c3f55
Revises: 8f3a1c2d4e5b
Create Date: 2026-09-18 14:56:28.152881

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fbea87c3f55'
down_revision: Union[str, None] = '8f3a1c2d4e5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")
