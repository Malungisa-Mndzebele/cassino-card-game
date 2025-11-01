#!/usr/bin/env python3
"""
Production startup script for Casino Card Game Backend
Run this with: python start_production.py
"""

import os
import sys
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def main():
    """Start the production server"""
    
    # Load environment from backend/.env (allow overrides)
    # Skip if file doesn't exist or has encoding issues (Fly.io uses secrets)
    env_file = backend_dir / ".env"
    try:
        if env_file.exists():
            load_dotenv(dotenv_path=env_file, override=True)
    except (UnicodeDecodeError, Exception) as e:
        # Ignore .env file errors - Fly.io uses secrets instead
        print(f"⚠️  Warning: Could not load .env file (using Fly.io secrets instead): {e}")
    
    os.environ.setdefault("ENVIRONMENT", "production")
    
    # Production configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))
    
    print(f"🚀 Starting Casino Card Game Backend")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"👥 Workers: {workers}")
    print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'production')}")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        reload=False,
        access_log=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
