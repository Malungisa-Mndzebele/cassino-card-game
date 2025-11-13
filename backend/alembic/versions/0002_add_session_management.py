"""add session management

Revision ID: 0002_add_session_management
Revises: 71619fc3c108
Create Date: 2025-11-12 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_session_management'
down_revision = '71619fc3c108'
branch_labels = None
depends_on = None


def upgrade():
    # Add session management columns to game_sessions table
    op.add_column('game_sessions', 
        sa.Column('session_token', sa.String(256), nullable=True))
    op.add_column('game_sessions',
        sa.Column('disconnected_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('game_sessions',
        sa.Column('reconnected_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('game_sessions',
        sa.Column('connection_count', sa.Integer, default=0))
    op.add_column('game_sessions',
        sa.Column('ip_address', sa.String(45), nullable=True))
    op.add_column('game_sessions',
        sa.Column('user_agent', sa.String(256), nullable=True))
    
    # Create unique index on session_token
    op.create_index('ix_game_sessions_token', 'game_sessions', 
        ['session_token'], unique=True)


def downgrade():
    # Drop index
    op.drop_index('ix_game_sessions_token', table_name='game_sessions')
    
    # Drop columns
    op.drop_column('game_sessions', 'user_agent')
    op.drop_column('game_sessions', 'ip_address')
    op.drop_column('game_sessions', 'connection_count')
    op.drop_column('game_sessions', 'reconnected_at')
    op.drop_column('game_sessions', 'disconnected_at')
    op.drop_column('game_sessions', 'session_token')
