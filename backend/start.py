#!/usr/bin/env python3
"""
Startup script for the Casino Card Game FastAPI backend
"""

import uvicorn
import os
from main import app

if __name__ == "__main__":
    # Get port from environment variable or default to 8000
    port = int(os.getenv("PORT", 8000))
    
    # Get host from environment variable or default to 0.0.0.0
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting Casino Card Game Backend on {host}:{port}")
    print(f"API will be available at: http://{host}:{port}/api")
    print(f"Health check: http://{host}:{port}/api/health")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Set to True for development
        log_level="info"
    )
