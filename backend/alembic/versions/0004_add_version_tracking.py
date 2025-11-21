"""add version tracking to rooms

Revision ID: 0004_add_version_tracking
Revises: 0003_add_game_action_log
Create Date: 2025-11-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0004_add_version_tracking'
down_revision = '0003_add_game_action_log'
branch_labels = None
depends_on = None


def upgrade():
    """Add version tracking fields to rooms table"""
    # Get connection to check existing columns
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('rooms')]
    
    # Add version column (monotonically increasing state version)
    if 'version' not in existing_columns:
        op.add_column('rooms', sa.Column('version', sa.Integer(), nullable=False, server_default='0'))
    
    # Add checksum column (SHA-256 hash of canonical state)
    if 'checksum' not in existing_columns:
        op.add_column('rooms', sa.Column('checksum', sa.String(length=64), nullable=True))
    
    # Add last_modified column (timestamp of last state change)
    if 'last_modified' not in existing_columns:
        op.add_column('rooms', sa.Column('last_modified', sa.DateTime(timezone=True), 
                                         server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    
    # Add modified_by column (player_id who made last change)
    # Note: Foreign key constraint not added for SQLite compatibility
    # The relationship is defined in the model but not enforced at DB level
    if 'modified_by' not in existing_columns:
        op.add_column('rooms', sa.Column('modified_by', sa.Integer(), nullable=True))
    
    # Create index on version for efficient queries
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('rooms')]
    if 'ix_rooms_version' not in existing_indexes:
        op.create_index('ix_rooms_version', 'rooms', ['version'], unique=False)


def downgrade():
    """Remove version tracking fields from rooms table"""
    # Drop index
    op.drop_index('ix_rooms_version', table_name='rooms')
    
    # Drop columns
    op.drop_column('rooms', 'modified_by')
    op.drop_column('rooms', 'last_modified')
    op.drop_column('rooms', 'checksum')
    op.drop_column('rooms', 'version')
