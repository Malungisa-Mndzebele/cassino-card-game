"""
Database Configuration and Connection Management

This module configures SQLAlchemy async engine and session management for the application.
It supports both SQLite (development) and PostgreSQL (production) databases with
automatic fallback and connection pooling.

Environment Variables:
    DATABASE_URL: Full database connection string
    ENVIRONMENT: "production" or other (determines SQLite fallback)
    FLY_APP_NAME: Fly.io app name (indicates production environment)

Example:
    >>> from database import get_db, async_engine
    >>> # Use in FastAPI dependency injection
    >>> @app.get("/items")
    >>> async def get_items(db: AsyncSession = Depends(get_db)):
    ...     result = await db.execute(select(Item))
    ...     return result.scalars().all()
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import event
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file (if it exists)
# In Fly.io, environment variables come from secrets, so .env is optional
try:
    load_dotenv()
except (UnicodeDecodeError, Exception):
    # Ignore .env file errors - Fly.io uses secrets instead
    pass

# Get DATABASE_URL - use SQLite for local development if not set
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.strip():
    # For local development, use SQLite as fallback
    is_local = os.getenv("ENVIRONMENT") != "production" or os.getenv("FLY_APP_NAME") is None
    if is_local:
        # Use SQLite for local development with async driver
        db_path = os.path.join(os.path.dirname(__file__), "test_casino_game.db")
        DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
        print(f"ℹ️  Using SQLite for local development: {DATABASE_URL}", file=sys.stderr)
    else:
        # In production, DATABASE_URL must be set
        print("❌ ERROR: DATABASE_URL must be set in environment", file=sys.stderr)
        print("   Check Fly.io secrets: flyctl secrets list", file=sys.stderr)
        raise RuntimeError(
            "DATABASE_URL must be set in environment. Check Fly.io secrets: flyctl secrets list"
        )

# Legacy compatibility: normalize old postgres URLs if present
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    # Add asyncpg driver for async support
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("sqlite:///") and "+aiosqlite" not in DATABASE_URL:
    # Fix SQLite to use async driver
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    print(f"ℹ️  Updated SQLite URL to use aiosqlite: {DATABASE_URL}", file=sys.stderr)

# Create async SQLAlchemy engine with connection pooling
if "sqlite" in DATABASE_URL:
    # SQLite-specific settings
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
    
    # Enable foreign keys for SQLite
    @event.listens_for(async_engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
        
elif "postgresql" in DATABASE_URL:
    # PostgreSQL-specific settings
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300,  # Recycle connections after 5 minutes
        pool_size=10,      # Connection pool size
        max_overflow=20,   # Max overflow connections
        connect_args={
            "server_settings": {"application_name": "cassino_game"},
            "timeout": 10,
        }
    )
else:
    # Generic async engine
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Import Base from models (SQLAlchemy 2.0 style)
from models import Base


async def get_db():
    """
    FastAPI dependency for async database session management.
    
    Creates a new async database session for each request and ensures it's properly
    closed after the request completes. Use with FastAPI's Depends() injection.
    
    Yields:
        AsyncSession: SQLAlchemy async database session
    
    Example:
        >>> from fastapi import Depends
        >>> from database import get_db
        >>> from sqlalchemy import select
        >>> 
        >>> @app.get("/rooms/{room_id}")
        >>> async def get_room(room_id: str, db: AsyncSession = Depends(get_db)):
        ...     result = await db.execute(select(Room).where(Room.id == room_id))
        ...     room = result.scalar_one_or_none()
        ...     return room
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables.
    
    Creates all tables defined in models if they don't exist.
    Should be called on application startup.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections.
    
    Should be called on application shutdown to properly close
    all database connections in the pool.
    """
    await async_engine.dispose()
