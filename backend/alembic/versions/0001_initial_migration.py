"""Initial migration

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create rooms table
    op.create_table('rooms',
        sa.Column('id', sa.String(length=6), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('game_phase', sa.String(length=20), nullable=True),
        sa.Column('current_turn', sa.Integer(), nullable=True),
        sa.Column('round_number', sa.Integer(), nullable=True),
        sa.Column('deck', sa.JSON(), nullable=True),
        sa.Column('player1_hand', sa.JSON(), nullable=True),
        sa.Column('player2_hand', sa.JSON(), nullable=True),
        sa.Column('table_cards', sa.JSON(), nullable=True),
        sa.Column('builds', sa.JSON(), nullable=True),
        sa.Column('player1_captured', sa.JSON(), nullable=True),
        sa.Column('player2_captured', sa.JSON(), nullable=True),
        sa.Column('player1_score', sa.Integer(), nullable=True),
        sa.Column('player2_score', sa.Integer(), nullable=True),
        sa.Column('shuffle_complete', sa.Boolean(), nullable=True),
        sa.Column('card_selection_complete', sa.Boolean(), nullable=True),
        sa.Column('dealing_complete', sa.Boolean(), nullable=True),
        sa.Column('game_started', sa.Boolean(), nullable=True),
        sa.Column('game_completed', sa.Boolean(), nullable=True),
        sa.Column('last_play', sa.JSON(), nullable=True),
        sa.Column('last_action', sa.String(length=50), nullable=True),
        sa.Column('last_update', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('winner', sa.Integer(), nullable=True),
        sa.Column('player1_ready', sa.Boolean(), nullable=True),
        sa.Column('player2_ready', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rooms_id'), 'rooms', ['id'], unique=False)

    # Create players table
    op.create_table('players',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.String(length=6), nullable=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('ready', sa.Boolean(), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_players_id'), 'players', ['id'], unique=False)

    # Create game_sessions table
    op.create_table('game_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('room_id', sa.String(length=6), nullable=True),
        sa.Column('player_id', sa.Integer(), nullable=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('game_sessions')
    op.drop_index(op.f('ix_players_id'), table_name='players')
    op.drop_table('players')
    op.drop_index(op.f('ix_rooms_id'), table_name='rooms')
    op.drop_table('rooms')

