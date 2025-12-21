
import subprocess
import time
import requests
import sys
import os
import signal

def run_debug():
    # 1. Start Server
    print("Starting server...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd="c:\\Home\\Code\\Multiplayer Card Game\\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    time.sleep(5)  # Wait for startup
    
    try:
        # 2. Run Test
        print("Running reproduction steps...")
        BASE_URL = "http://127.0.0.1:8001"
        
        # Create
        res = requests.post(f"{BASE_URL}/rooms/create", json={"player_name": "P1Debug"})
        if res.status_code != 200:
            print(f"Create failed: {res.text}")
            return
        data = res.json()
        room_id = data["room_id"]
        p1_id = data["player_id"]
        print(f"Created {room_id}")
        
        # Join
        res = requests.post(f"{BASE_URL}/rooms/join", json={"room_id": room_id, "player_name": "P2Debug"})
        if res.status_code != 200:
            print(f"Join failed: {res.text}")
            return
        p2_id = res.json()["player_id"]
        
        # Reproduce 500
        print("Triggering error...")
        res = requests.post(f"{BASE_URL}/rooms/player-ready", json={
            "room_id": room_id, 
            "player_id": p2_id, 
            "is_ready": True
        })
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")
        
    except Exception as e:
        print(f"Test exception: {e}")
    finally:
        # 3. Capture Logs
        print("\n--- SERVER STDOUT ---")
        out, err = server.communicate(timeout=2)
        print(out)
        print("\n--- SERVER STDERR ---")
        print(err)
        
        server.terminate()

if __name__ == "__main__":
    run_debug()
