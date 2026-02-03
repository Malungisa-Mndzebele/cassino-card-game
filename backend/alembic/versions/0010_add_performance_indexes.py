"""add_performance_indexes

Revision ID: 0010_perf_idx
Revises: 1c0d42a52479
Create Date: 2026-02-03

Adds indexes to frequently queried columns for improved query performance:
- Room.status and Room.game_phase for room lookups
- Player.room_id for player queries
- GameSession.room_id and GameSession.player_id for session lookups
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0010_perf_idx'
down_revision = '1c0d42a52479'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Room indexes for game phase and status lookups
    # These are frequently used in waiting room queries and game state checks
    op.create_index('ix_rooms_status', 'rooms', ['status'], if_not_exists=True)
    op.create_index('ix_rooms_game_phase', 'rooms', ['game_phase'], if_not_exists=True)
    
    # Player room_id index for efficient player lookups by room
    op.create_index('ix_players_room_id', 'players', ['room_id'], if_not_exists=True)
    
    # GameSession indexes for session validation and room queries
    op.create_index('ix_game_sessions_room_id', 'game_sessions', ['room_id'], if_not_exists=True)
    op.create_index('ix_game_sessions_player_id', 'game_sessions', ['player_id'], if_not_exists=True)


def downgrade() -> None:
    # Remove performance indexes
    op.drop_index('ix_game_sessions_player_id', table_name='game_sessions')
    op.drop_index('ix_game_sessions_room_id', table_name='game_sessions')
    op.drop_index('ix_players_room_id', table_name='players')
    op.drop_index('ix_rooms_game_phase', table_name='rooms')
    op.drop_index('ix_rooms_status', table_name='rooms')
