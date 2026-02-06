"""merge_multiple_heads

Revision ID: 7fa01264610a
Revises: 0009_merge_heads, 0010_perf_idx
Create Date: 2026-02-06 14:42:14.216348

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7fa01264610a'
down_revision = ('0009_merge_heads', '0010_perf_idx')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
