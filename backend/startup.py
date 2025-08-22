#!/usr/bin/env python3
"""
Startup script for the Casino Card Game Backend
This script runs database migrations before starting the FastAPI application
"""

import os
import sys
import subprocess
from pathlib import Path

def run_migrations():
    """Run Alembic database migrations"""
    try:
        print("Running database migrations...")
        
        # Check if we're using PostgreSQL
        database_url = os.getenv("DATABASE_URL", "sqlite:///./test_casino_game.db")
        if "postgresql" in database_url:
            print("🐘 Using PostgreSQL database")
        else:
            print("💾 Using SQLite database")
        
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Database migrations completed successfully")
            if result.stdout.strip():
                print(result.stdout)
        else:
            print("❌ Database migrations failed:")
            print(result.stderr)
            return False
            
    except FileNotFoundError:
        print("⚠️  Alembic not found, skipping migrations")
        print("Make sure to run migrations manually: alembic upgrade head")
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False
    
    return True

def start_application():
    """Start the FastAPI application"""
    try:
        print("Starting FastAPI application...")
        subprocess.run([
            "uvicorn", "main:app", 
            "--host", "0.0.0.0", 
            "--port", os.getenv("PORT", "8000"),
            "--reload"
        ], cwd=Path(__file__).parent)
    except KeyboardInterrupt:
        print("\n🛑 Application stopped by user")
    except Exception as e:
        print(f"❌ Error starting application: {e}")

if __name__ == "__main__":
    print("🚀 Starting Casino Card Game Backend...")
    
    # Run migrations first
    if run_migrations():
        # Start the application
        start_application()
    else:
        print("❌ Failed to start application due to migration errors")
        sys.exit(1)
