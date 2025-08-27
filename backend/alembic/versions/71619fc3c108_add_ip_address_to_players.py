"""add_ip_address_to_players

Revision ID: 71619fc3c108
Revises: 0001
Create Date: 2025-08-26 21:09:32.332857

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '71619fc3c108'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add ip_address column to players table
    op.add_column('players', sa.Column('ip_address', sa.String(length=45), nullable=True))


def downgrade() -> None:
    # Remove ip_address column from players table
    op.drop_column('players', 'ip_address')
