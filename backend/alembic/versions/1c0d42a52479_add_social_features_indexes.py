"""add_social_features_indexes

Revision ID: 1c0d42a52479
Revises: 67fadccc4d5a
Create Date: 2025-12-20 20:55:06.707492

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c0d42a52479'
down_revision = '67fadccc4d5a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add performance indexes for social features
    
    # Friendship lookup indexes
    op.create_index('ix_friendships_user1_status', 'friendships', ['user1_id', 'status'])
    op.create_index('ix_friendships_user2_status', 'friendships', ['user2_id', 'status'])
    op.create_index('ix_friendships_status', 'friendships', ['status'])
    
    # Moderation report indexes
    op.create_index('ix_moderation_reports_status', 'moderation_reports', ['status'])
    op.create_index('ix_moderation_reports_reported_user', 'moderation_reports', ['reported_user_id'])
    op.create_index('ix_moderation_reports_created_at', 'moderation_reports', ['created_at'])
    
    # User block indexes
    op.create_index('ix_user_blocks_blocker', 'user_blocks', ['blocker_id'])
    op.create_index('ix_user_blocks_blocked', 'user_blocks', ['blocked_id'])
    op.create_index('ix_user_blocks_blocker_blocked', 'user_blocks', ['blocker_id', 'blocked_id'], unique=True)
    
    # User activity indexes
    op.create_index('ix_users_last_seen', 'users', ['last_seen'])
    op.create_index('ix_users_is_active', 'users', ['is_active'])


def downgrade() -> None:
    # Remove performance indexes
    op.drop_index('ix_users_is_active', table_name='users')
    op.drop_index('ix_users_last_seen', table_name='users')
    op.drop_index('ix_user_blocks_blocker_blocked', table_name='user_blocks')
    op.drop_index('ix_user_blocks_blocked', table_name='user_blocks')
    op.drop_index('ix_user_blocks_blocker', table_name='user_blocks')
    op.drop_index('ix_moderation_reports_created_at', table_name='moderation_reports')
    op.drop_index('ix_moderation_reports_reported_user', table_name='moderation_reports')
    op.drop_index('ix_moderation_reports_status', table_name='moderation_reports')
    op.drop_index('ix_friendships_status', table_name='friendships')
    op.drop_index('ix_friendships_user2_status', table_name='friendships')
    op.drop_index('ix_friendships_user1_status', table_name='friendships')
