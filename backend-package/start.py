#!/usr/bin/env python3
import os
import sys
import subprocess

# Install dependencies
print("📦 Installing dependencies...")
subprocess.run([sys.executable, "-m", "pip", "install", "--user", "-r", "requirements.txt"])

# Start the server
print("🚀 Starting backend server...")
subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
