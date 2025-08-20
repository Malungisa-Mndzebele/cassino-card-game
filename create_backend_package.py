#!/usr/bin/env python3
"""
Create a backend package for manual deployment
"""

import os
import shutil
import subprocess

def create_backend_package():
    """Create a deployable backend package"""
    
    print("🔧 Creating backend package for manual deployment...")
    
    # Create package directory
    package_dir = "backend-package"
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)
    
    # Copy backend files
    backend_dir = "backend"
    for item in os.listdir(backend_dir):
        src = os.path.join(backend_dir, item)
        dst = os.path.join(package_dir, item)
        
        if os.path.isfile(src):
            shutil.copy2(src, dst)
        elif os.path.isdir(src):
            shutil.copytree(src, dst)
    
    # Create startup script
    startup_script = os.path.join(package_dir, "start.py")
    with open(startup_script, "w") as f:
        f.write("""#!/usr/bin/env python3
import os
import sys
import subprocess

# Install dependencies
print("📦 Installing dependencies...")
subprocess.run([sys.executable, "-m", "pip", "install", "--user", "-r", "requirements.txt"])

# Start the server
print("🚀 Starting backend server...")
subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
""")
    
    # Create README
    readme_file = os.path.join(package_dir, "README.md")
    with open(readme_file, "w") as f:
        f.write("""# Casino Backend Package

## Manual Deployment Instructions

1. Upload this entire folder to your hosting server
2. SSH into your server
3. Navigate to this directory
4. Run: `python3 start.py`

## Requirements
- Python 3.11+
- pip

## Files
- `main.py` - FastAPI application
- `models.py` - Database models
- `schemas.py` - Pydantic schemas
- `database.py` - Database configuration
- `requirements.txt` - Python dependencies
- `start.py` - Startup script

## API Endpoints
- Health: GET /health
- Create Room: POST /rooms/create
- Join Room: POST /rooms/join
- Get Game State: GET /rooms/{room_id}/state
- Set Player Ready: POST /rooms/player-ready
- Play Card: POST /game/play-card
- Start Shuffle: POST /game/start-shuffle
- Select Face-up Cards: POST /game/select-face-up-cards
- Reset Game: POST /game/reset
""")
    
    print(f"✅ Backend package created in: {package_dir}")
    print("📦 Package contents:")
    for item in os.listdir(package_dir):
        print(f"   - {item}")
    
    print("\n📋 Next steps:")
    print("1. Upload the 'backend-package' folder to your hosting server")
    print("2. SSH into your server and run: python3 start.py")
    print("3. The backend will be available on port 8000")

if __name__ == "__main__":
    create_backend_package()
