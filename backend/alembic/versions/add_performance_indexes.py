"""Add performance indexes for frequently queried columns

Revision ID: add_perf_indexes
Revises: 
Create Date: 2026-02-05

This migration adds composite indexes to improve query performance for:
- Game sessions by room_id and is_active
- Game action logs by room_id and timestamp
- Game events by room_id and version
- Friendships by user IDs and status
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_perf_indexes'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes."""
    # Index for finding active sessions in a room
    op.create_index(
        'ix_game_sessions_room_active',
        'game_sessions',
        ['room_id', 'is_active'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for querying action logs by room and time
    op.create_index(
        'ix_game_action_log_room_timestamp',
        'game_action_log',
        ['room_id', 'timestamp'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for querying action logs by room and sequence
    op.create_index(
        'ix_game_action_log_room_sequence',
        'game_action_log',
        ['room_id', 'sequence_number'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for querying events by room and version (for sync)
    op.create_index(
        'ix_game_events_room_version',
        'game_events',
        ['room_id', 'version'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for querying events by room and sequence
    op.create_index(
        'ix_game_events_room_sequence',
        'game_events',
        ['room_id', 'sequence_number'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for state snapshots by room and version
    op.create_index(
        'ix_state_snapshots_room_version',
        'state_snapshots',
        ['room_id', 'version'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for friendships by user pairs
    op.create_index(
        'ix_friendships_user1_status',
        'friendships',
        ['user1_id', 'status'],
        unique=False,
        if_not_exists=True
    )
    
    op.create_index(
        'ix_friendships_user2_status',
        'friendships',
        ['user2_id', 'status'],
        unique=False,
        if_not_exists=True
    )
    
    # Index for user blocks lookup
    op.create_index(
        'ix_user_blocks_blocker_blocked',
        'user_blocks',
        ['blocker_id', 'blocked_id'],
        unique=True,
        if_not_exists=True
    )


def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index('ix_game_sessions_room_active', table_name='game_sessions', if_exists=True)
    op.drop_index('ix_game_action_log_room_timestamp', table_name='game_action_log', if_exists=True)
    op.drop_index('ix_game_action_log_room_sequence', table_name='game_action_log', if_exists=True)
    op.drop_index('ix_game_events_room_version', table_name='game_events', if_exists=True)
    op.drop_index('ix_game_events_room_sequence', table_name='game_events', if_exists=True)
    op.drop_index('ix_state_snapshots_room_version', table_name='state_snapshots', if_exists=True)
    op.drop_index('ix_friendships_user1_status', table_name='friendships', if_exists=True)
    op.drop_index('ix_friendships_user2_status', table_name='friendships', if_exists=True)
    op.drop_index('ix_user_blocks_blocker_blocked', table_name='user_blocks', if_exists=True)
