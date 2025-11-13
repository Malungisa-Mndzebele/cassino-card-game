"""add game action log

Revision ID: 0003_add_game_action_log
Revises: 0002_add_session_management
Create Date: 2025-11-12 10:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0003_add_game_action_log'
down_revision = '0002_add_session_management'
branch_labels = None
depends_on = None


def upgrade():
    # Create game_action_log table
    op.create_table('game_action_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.String(length=6), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('action_data', sa.JSON(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('action_id', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_game_action_log_id', 'game_action_log', ['id'], unique=False)
    op.create_index('ix_game_action_log_room_id', 'game_action_log', ['room_id'], unique=False)
    op.create_index('ix_game_action_log_action_id', 'game_action_log', ['action_id'], unique=True)
    op.create_index('ix_game_action_log_room_seq', 'game_action_log', ['room_id', 'sequence_number'], unique=True)


def downgrade():
    # Drop indexes
    op.drop_index('ix_game_action_log_room_seq', table_name='game_action_log')
    op.drop_index('ix_game_action_log_action_id', table_name='game_action_log')
    op.drop_index('ix_game_action_log_room_id', table_name='game_action_log')
    op.drop_index('ix_game_action_log_id', table_name='game_action_log')
    
    # Drop table
    op.drop_table('game_action_log')
