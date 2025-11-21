"""add game events table for event sourcing

Revision ID: 0005_add_game_events
Revises: 0004_add_version_tracking
Create Date: 2025-11-20 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0005_add_game_events'
down_revision = '0004_add_version_tracking'
branch_labels = None
depends_on = None


def upgrade():
    """Create game_events table for event sourcing"""
    # Create game_events table
    op.create_table('game_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.String(length=6), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('action_data', sa.JSON(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('room_id', 'sequence_number', name='uq_game_events_room_sequence')
    )
    
    # Create indexes for efficient queries
    op.create_index('ix_game_events_id', 'game_events', ['id'], unique=False)
    op.create_index('ix_game_events_room_id', 'game_events', ['room_id'], unique=False)
    op.create_index('ix_game_events_room_version', 'game_events', ['room_id', 'version'], unique=False)


def downgrade():
    """Drop game_events table"""
    # Drop indexes
    op.drop_index('ix_game_events_room_version', table_name='game_events')
    op.drop_index('ix_game_events_room_id', table_name='game_events')
    op.drop_index('ix_game_events_id', table_name='game_events')
    
    # Drop table
    op.drop_table('game_events')
