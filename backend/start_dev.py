#!/usr/bin/env python3
"""Development startup script - uses SQLite"""
import os
import sys
import uvicorn

# Set development environment
os.environ["ENVIRONMENT"] = "development"

if __name__ == "__main__":
    print("🚀 Starting backend in development mode with SQLite...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
