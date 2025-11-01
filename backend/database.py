from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
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
    import sys
    is_local = os.getenv("ENVIRONMENT") != "production" or os.getenv("FLY_APP_NAME") is None
    if is_local:
        # Use SQLite for local development
        db_path = os.path.join(os.path.dirname(__file__), "test_casino_game.db")
        DATABASE_URL = f"sqlite:///{db_path}"
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
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine with connection pooling for PostgreSQL
# Don't connect immediately - connect on first use
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL:
    connect_args = {"connect_timeout": 10}
else:
    connect_args = {}

# Create engine with lazy connection - don't connect immediately
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=300,     # Recycle connections after 5 minutes
    pool_size=5,          # Connection pool size
    max_overflow=10,      # Max overflow connections
    # Don't connect on startup - only on first use
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
