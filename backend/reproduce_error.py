
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8080"

def run_test():
    # 1. Create Room
    print("Creating room...")
    res = requests.post(f"{BASE_URL}/rooms/create", json={"player_name": "P1"})
    print(f"Create status: {res.status_code}")
    if res.status_code != 200:
        print(res.text)
        return
    
    data = res.json()
    room_id = data["room_id"]
    p1_id = data["player_id"]
    print(f"Room: {room_id}, P1: {p1_id}")
    
    # 2. Join Room (P2)
    print("Joining room...")
    res = requests.post(f"{BASE_URL}/rooms/join", json={"room_id": room_id, "player_name": "P2"})
    print(f"Join status: {res.status_code}")
    if res.status_code != 200:
        print(res.text)
        return
        
    data = res.json()
    p2_id = data["player_id"]
    print(f"P2: {p2_id}")
    
    # 3. P2 Ready
    print("Setting P2 ready...")
    res = requests.post(f"{BASE_URL}/rooms/player-ready", json={
        "room_id": room_id, 
        "player_id": p2_id, 
        "is_ready": True
    })
    print(f"P2 Ready status: {res.status_code}")
    if res.status_code != 200:
        print(res.text)
    
    # 4. P1 Ready (triggers phase change)
    print("Setting P1 ready...")
    res = requests.post(f"{BASE_URL}/rooms/player-ready", json={
        "room_id": room_id, 
        "player_id": p1_id, 
        "is_ready": True
    })
    print(f"P1 Ready status: {res.status_code}")
    if res.status_code != 200:
        print(res.text)

if __name__ == "__main__":
    run_test()
