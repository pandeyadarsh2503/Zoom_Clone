"""add meeting duration_minutes

Revision ID: b2c4e6a8f012
Revises: 1e8f18a49488
Create Date: 2026-06-28

Adds the `duration_minutes` column to `meetings` (planned meeting length),
with a positive CHECK constraint, to support scheduled meetings.
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c4e6a8f012"
down_revision: Union[str, None] = "1e8f18a49488"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("meetings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "duration_minutes",
                sa.Integer(),
                nullable=False,
                server_default="30",
            )
        )
        batch_op.create_check_constraint(
            "ck_meeting_duration_positive", "duration_minutes > 0"
        )


def downgrade() -> None:
    with op.batch_alter_table("meetings", schema=None) as batch_op:
        batch_op.drop_constraint("ck_meeting_duration_positive", type_="check")
        batch_op.drop_column("duration_minutes")
