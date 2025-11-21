"""add state snapshots table for event sourcing optimization

Revision ID: 0006_add_state_snapshots
Revises: 0005_add_game_events
Create Date: 2025-11-20 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0006_add_state_snapshots'
down_revision = '0005_add_game_events'
branch_labels = None
depends_on = None


def upgrade():
    """Create state_snapshots table for optimized event replay"""
    # Create state_snapshots table
    op.create_table('state_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.String(length=6), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('state_data', sa.JSON(), nullable=False),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for efficient queries
    op.create_index('ix_state_snapshots_id', 'state_snapshots', ['id'], unique=False)
    op.create_index('ix_state_snapshots_room_id', 'state_snapshots', ['room_id'], unique=False)
    op.create_index('ix_state_snapshots_room_version', 'state_snapshots', ['room_id', 'version'], unique=False)


def downgrade():
    """Drop state_snapshots table"""
    # Drop indexes
    op.drop_index('ix_state_snapshots_room_version', table_name='state_snapshots')
    op.drop_index('ix_state_snapshots_room_id', table_name='state_snapshots')
    op.drop_index('ix_state_snapshots_id', table_name='state_snapshots')
    
    # Drop table
    op.drop_table('state_snapshots')
