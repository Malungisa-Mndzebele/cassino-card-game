#!/usr/bin/env python3
"""
Production startup script for Casino Card Game Backend
Run this with: python start_production.py
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def main():
    """Start the production server"""
    
    # Set production environment variables
    os.environ.setdefault("ENVIRONMENT", "production")
    # Default to SQLite for safety; override via env in staging/prod (use MySQL)
    os.environ.setdefault("DATABASE_URL", "sqlite:///./test_casino_game.db")
    
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
