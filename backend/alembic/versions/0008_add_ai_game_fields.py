"""add_ai_game_fields

Revision ID: 0008_add_ai_game_fields
Revises: 0007_add_updated_at_column
Create Date: 2026-01-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0008_add_ai_game_fields'
down_revision: Union[str, None] = '0007_add_updated_at_column'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add AI game fields to rooms table
    op.add_column('rooms', sa.Column('is_ai_game', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('rooms', sa.Column('ai_difficulty', sa.String(20), nullable=True))
    
    # Add is_ai field to players table
    op.add_column('players', sa.Column('is_ai', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    # Remove AI fields
    op.drop_column('rooms', 'is_ai_game')
    op.drop_column('rooms', 'ai_difficulty')
    op.drop_column('players', 'is_ai')
