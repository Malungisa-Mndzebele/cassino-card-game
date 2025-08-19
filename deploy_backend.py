#!/usr/bin/env python3
"""
Deployment script for the Casino Card Game backend
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return None

def main():
    print("🚀 Casino Card Game Backend Deployment")
    print("=" * 50)
    
    # Check if Railway CLI is installed
    if run_command("railway --version", "Checking Railway CLI") is None:
        print("\n📦 Installing Railway CLI...")
        if sys.platform == "win32":
            run_command("npm install -g @railway/cli", "Installing Railway CLI")
        else:
            run_command("curl -fsSL https://railway.app/install.sh | sh", "Installing Railway CLI")
    
    # Login to Railway
    print("\n🔐 Please login to Railway...")
    run_command("railway login", "Logging into Railway")
    
    # Initialize Railway project
    print("\n🏗️ Initializing Railway project...")
    run_command("railway init", "Initializing Railway project")
    
    # Set environment variables
    print("\n⚙️ Setting environment variables...")
    run_command("railway variables set DATABASE_URL=postgresql://user:password@localhost/casino_game", "Setting DATABASE_URL")
    
    # Deploy
    print("\n🚀 Deploying to Railway...")
    result = run_command("railway up", "Deploying to Railway")
    
    if result:
        print("\n🎉 Deployment completed successfully!")
        print("📋 Next steps:")
        print("1. Get your Railway URL from the dashboard")
        print("2. Set VITE_API_URL in your frontend environment")
        print("3. Update your frontend deployment")
    else:
        print("\n❌ Deployment failed. Please check the logs above.")

if __name__ == "__main__":
    main()
