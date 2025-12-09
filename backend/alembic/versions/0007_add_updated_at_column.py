"""Add updated_at column to rooms table

Revision ID: 0007_add_updated_at_column
Revises: 0006_add_state_snapshots
Create Date: 2024-12-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0007_add_updated_at_column'
down_revision = '0006_add_state_snapshots'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if column already exists (for idempotency)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('rooms')]
    
    if 'updated_at' not in columns:
        # Add updated_at column to rooms table
        op.add_column('rooms', 
            sa.Column('updated_at', 
                      sa.DateTime(timezone=True), 
                      server_default=sa.text('CURRENT_TIMESTAMP'),
                      nullable=False)
        )
        
        # Create trigger to automatically update updated_at on row updates (PostgreSQL only)
        # Skip for SQLite
        if conn.dialect.name == 'postgresql':
            op.execute("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            """)
            
            op.execute("""
                CREATE TRIGGER update_rooms_updated_at 
                BEFORE UPDATE ON rooms
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            """)


def downgrade() -> None:
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop column
    op.drop_column('rooms', 'updated_at')
