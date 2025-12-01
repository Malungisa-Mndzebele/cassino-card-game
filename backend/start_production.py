#!/usr/bin/env python3
"""
Production startup script for Casino Card Game Backend
Includes automatic database migrations
Run this with: python start_production.py
"""

import os
import sys
import subprocess
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def run_migrations():
    """Run database migrations before starting server"""
    print("🔄 Running database migrations...", file=sys.stderr)
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Migrations completed successfully", file=sys.stderr)
        if result.stdout:
            print(result.stdout, file=sys.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}", file=sys.stderr)
        print(f"stdout: {e.stdout}", file=sys.stderr)
        print(f"stderr: {e.stderr}", file=sys.stderr)
        return False
    except FileNotFoundError:
        print("❌ Alembic not found. Make sure it's installed.", file=sys.stderr)
        return False

def main():
    """Start the production server"""
    try:
        # Load environment from backend/.env (allow overrides)
        # Load environment from backend/.env (allow overrides)
        # Skip if file doesn't exist or has encoding issues
        env_file = backend_dir / ".env"
        try:
            if env_file.exists():
                load_dotenv(dotenv_path=env_file, override=True)
        except (UnicodeDecodeError, Exception) as e:
            # Ignore .env file errors
            print(f"⚠️  Warning: Could not load .env file: {e}", file=sys.stderr)
        
        os.environ.setdefault("ENVIRONMENT", "production")
        
        # Check critical environment variables
        database_url = os.getenv("DATABASE_URL")
        if not database_url or not database_url.strip():
            print("❌ ERROR: DATABASE_URL is not set", file=sys.stderr)
            print("   Set it in your environment variables", file=sys.stderr)
            sys.exit(1)
        
        # Production configuration
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", "8000"))
        workers = int(os.getenv("WORKERS", "1"))
        
        print(f"🚀 Starting Casino Card Game Backend", file=sys.stderr)
        print(f"📍 Host: {host}", file=sys.stderr)
        print(f"🔌 Port: {port}", file=sys.stderr)
        print(f"👥 Workers: {workers}", file=sys.stderr)
        print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'production')}", file=sys.stderr)
        
        # Test database connection before starting server
        try:
            from database import async_engine
            # Test async connection
            async def test_connection():
                async with async_engine.connect() as conn:
                    pass
            import asyncio
            asyncio.run(test_connection())
            print("✅ Database connection successful", file=sys.stderr)
        except Exception as db_error:
            print(f"❌ Database connection failed: {db_error}", file=sys.stderr)
            print("   Make sure DATABASE_URL is correct and database is accessible", file=sys.stderr)
            sys.exit(1)
        
        # Run database migrations before starting server
        if not run_migrations():
            print("❌ Cannot start server due to migration failure", file=sys.stderr)
            sys.exit(1)
        
        # Test importing main app
        try:
            from main import app
            print("✅ App import successful", file=sys.stderr)
        except Exception as import_error:
            print(f"❌ Failed to import app: {import_error}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            sys.exit(1)
        
        # Start the server
        print("🌐 Starting HTTP server...", file=sys.stderr)
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=workers,
            reload=False,
            access_log=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"❌ Fatal error starting server: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
