"""Merge multiple heads into single head

Revision ID: 0009_merge_heads
Revises: 0008_add_ai_game_fields, 1c0d42a52479
Create Date: 2026-01-02

This migration merges the AI game branch and social features branch.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0009_merge_heads'
down_revision: Union[str, Sequence[str]] = ('0008_add_ai_game_fields', '1c0d42a52479')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass


def downgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass
