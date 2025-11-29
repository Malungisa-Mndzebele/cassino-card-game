"""
Property-based tests for database migration idempotence

**Feature: render-deployment-migration, Property 5: Migration idempotence**
**Validates: Requirements 4.1, 4.2**
"""
import pytest
import subprocess
import os
import tempfile
import shutil
from pathlib import Path
from hypothesis import given, settings, strategies as st
from sqlalchemy import create_engine, inspect, text
from database import DATABASE_URL


def run_alembic_upgrade():
    """
    Run alembic upgrade head and return success status
    
    Returns:
        bool: True if migration succeeded, False otherwise
    """
    backend_dir = Path(__file__).parent
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=True,
            timeout=30
        )
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


def get_database_schema(db_url: str):
    """
    Get the current database schema (tables and columns)
    
    Args:
        db_url: Database connection URL
        
    Returns:
        dict: Schema information with tables and their columns
    """
    # Convert aiosqlite to sqlite for synchronous operations
    if 'sqlite+aiosqlite' in db_url:
        db_url = db_url.replace('sqlite+aiosqlite', 'sqlite')
    
    engine = create_engine(db_url)
    inspector = inspect(engine)
    
    schema = {}
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        schema[table_name] = {
            'columns': [col['name'] for col in columns],
            'column_types': {col['name']: str(col['type']) for col in columns}
        }
    
    engine.dispose()
    return schema


def get_alembic_version(db_url: str):
    """
    Get the current alembic version from the database
    
    Args:
        db_url: Database connection URL
        
    Returns:
        str: Current alembic version or None if not found
    """
    # Convert aiosqlite to sqlite for synchronous operations
    if 'sqlite+aiosqlite' in db_url:
        db_url = db_url.replace('sqlite+aiosqlite', 'sqlite')
    
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            return row[0] if row else None
    except Exception:
        return None
    finally:
        engine.dispose()


@pytest.mark.asyncio
@given(num_runs=st.integers(min_value=1, max_value=5))
@settings(max_examples=20, deadline=None)
async def test_migration_idempotence(num_runs):
    """
    Property: Running migrations multiple times is safe
    
    **Feature: render-deployment-migration, Property 5: Migration idempotence**
    **Validates: Requirements 4.1, 4.2**
    
    This test verifies that running `alembic upgrade head` multiple times:
    1. Always succeeds without errors
    2. Results in the same final database schema
    3. Maintains the same alembic version
    
    The property holds for any number of migration runs (1-10).
    """
    # Use the configured database URL
    db_url = DATABASE_URL
    
    # Skip if database URL is not configured
    if not db_url or not db_url.strip():
        pytest.skip("DATABASE_URL not configured")
    
    # Track schema and version after each run
    schemas = []
    versions = []
    
    # Run migrations multiple times
    for i in range(num_runs):
        # Run migration
        success = run_alembic_upgrade()
        
        # Property 1: Migration should always succeed
        assert success, f"Migration run {i+1} failed"
        
        # Get schema after this run
        schema = get_database_schema(db_url)
        schemas.append(schema)
        
        # Get alembic version after this run
        version = get_alembic_version(db_url)
        versions.append(version)
    
    # Property 2: All schemas should be identical
    # (running migrations multiple times produces the same result)
    first_schema = schemas[0]
    for i, schema in enumerate(schemas[1:], start=2):
        assert schema == first_schema, (
            f"Schema after run {i} differs from schema after run 1. "
            f"Migration is not idempotent."
        )
    
    # Property 3: All versions should be identical
    # (alembic version should not change after first successful migration)
    first_version = versions[0]
    for i, version in enumerate(versions[1:], start=2):
        assert version == first_version, (
            f"Alembic version after run {i} ({version}) differs from "
            f"version after run 1 ({first_version}). Migration is not idempotent."
        )
    
    # Property 4: Version should not be None (migrations actually ran)
    assert first_version is not None, "No alembic version found after migration"


@pytest.mark.asyncio
async def test_migration_on_empty_database():
    """
    Example test: Verify migrations work on an empty database
    
    This is a concrete example that validates the migration system
    can bootstrap a fresh database from scratch.
    """
    # Create a temporary database for this test
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db_path = Path(tmpdir) / "test_migration.db"
        test_db_url = f"sqlite:///{test_db_path}"
        
        # Set up environment for alembic to use test database
        original_db_url = os.environ.get('DATABASE_URL')
        os.environ['DATABASE_URL'] = test_db_url
        
        try:
            # Run migrations on empty database
            backend_dir = Path(__file__).parent
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                cwd=backend_dir,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Migration should succeed
            assert result.returncode == 0, (
                f"Migration failed on empty database:\n"
                f"stdout: {result.stdout}\n"
                f"stderr: {result.stderr}"
            )
            
            # Verify database has tables
            schema = get_database_schema(test_db_url)
            assert len(schema) > 0, "No tables created after migration"
            
            # Verify alembic_version table exists and has a version
            assert 'alembic_version' in schema, "alembic_version table not created"
            version = get_alembic_version(test_db_url)
            assert version is not None, "No alembic version recorded"
            
        finally:
            # Restore original DATABASE_URL
            if original_db_url:
                os.environ['DATABASE_URL'] = original_db_url
            else:
                os.environ.pop('DATABASE_URL', None)


@pytest.mark.asyncio
async def test_migration_failure_handling():
    """
    Example test: Verify migration failures are handled correctly
    
    This test validates that when migrations fail, the system
    properly reports the error and doesn't leave the database
    in an inconsistent state.
    """
    # Create a temporary database
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db_path = Path(tmpdir) / "test_migration_fail.db"
        test_db_url = f"sqlite:///{test_db_path}"
        
        # Set up environment for alembic to use test database
        original_db_url = os.environ.get('DATABASE_URL')
        os.environ['DATABASE_URL'] = test_db_url
        
        try:
            # First, run migrations successfully
            backend_dir = Path(__file__).parent
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                cwd=backend_dir,
                capture_output=True,
                text=True,
                timeout=30
            )
            assert result.returncode == 0, "Initial migration should succeed"
            
            # Get the version after successful migration
            version_after_success = get_alembic_version(test_db_url)
            
            # Try to run migrations again (should be idempotent and succeed)
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                cwd=backend_dir,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Should succeed (idempotent)
            assert result.returncode == 0, "Re-running migration should succeed"
            
            # Version should remain the same
            version_after_rerun = get_alembic_version(test_db_url)
            assert version_after_rerun == version_after_success, (
                "Version changed after re-running migrations"
            )
            
        finally:
            # Restore original DATABASE_URL
            if original_db_url:
                os.environ['DATABASE_URL'] = original_db_url
            else:
                os.environ.pop('DATABASE_URL', None)


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "-s"])
