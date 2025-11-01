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

# Require DATABASE_URL to be set (no silent SQLite fallback)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.strip():
    # Log error instead of crashing immediately (helps debugging)
    import sys
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
