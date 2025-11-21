"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from database import async_engine, init_db
from models import Base





@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Initialize database tables before running tests"""
    # Only initialize if tests don't override the database dependency
    # Tests that override get_db will handle their own database setup
    from database import get_db
    if not hasattr(app, 'dependency_overrides') or get_db not in app.dependency_overrides:
        await init_db()
    yield
    # Cleanup after all tests (only if we initialized)
    if not hasattr(app, 'dependency_overrides') or get_db not in app.dependency_overrides:
        try:
            async with async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
        except Exception:
            # Ignore cleanup errors - tables may not exist or may be in use
            pass


@pytest.fixture
async def client():
    """Create an async HTTP client for testing"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
