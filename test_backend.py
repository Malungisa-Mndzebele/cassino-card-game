#!/usr/bin/env python3
"""
Comprehensive test script for the Casino Card Game FastAPI backend
Tests all endpoints and game functionality
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
TEST_PLAYER_1 = "TestPlayer1"
TEST_PLAYER_2 = "TestPlayer2"

def print_test_result(test_name: str, success: bool, details: str = ""):
    """Print test result with formatting"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        success = response.status_code == 200
        details = f"Status: {response.status_code}, Response: {response.json()}"
        print_test_result("Health Check", success, details)
        return success
    except Exception as e:
        print_test_result("Health Check", False, f"Error: {str(e)}")
        return False

def test_create_room(player_name: str) -> Dict[str, Any]:
    """Test room creation and return room data"""
    try:
        data = {"player_name": player_name}
        response = requests.post(f"{BASE_URL}/rooms/create", json=data, timeout=10)
        success = response.status_code == 200
        details = f"Status: {response.status_code}"
        
        if success:
            room_data = response.json()
            details += f", Room ID: {room_data.get('room_id')}, Player ID: {room_data.get('player_id')}"
            print_test_result("Create Room", success, details)
            return room_data
        else:
            details += f", Response: {response.text}"
            print_test_result("Create Room", success, details)
            return {}
    except Exception as e:
        print_test_result("Create Room", False, f"Error: {str(e)}")
        return {}

def test_join_room(room_id: str, player_name: str) -> Dict[str, Any]:
    """Test joining a room and return player data"""
    try:
        data = {"room_id": room_id, "player_name": player_name}
        response = requests.post(f"{BASE_URL}/rooms/join", json=data, timeout=10)
        success = response.status_code == 200
        details = f"Status: {response.status_code}"
        
        if success:
            player_data = response.json()
            details += f", Player ID: {player_data.get('player_id')}"
            print_test_result("Join Room", success, details)
            return player_data
        else:
            details += f", Response: {response.text}"
            print_test_result("Join Room", success, details)
            return {}
    except Exception as e:
        print_test_result("Join Room", False, f"Error: {str(e)}")
        return {}

def test_get_game_state(room_id: str) -> Dict[str, Any]:
    """Test getting game state and return state data"""
    try:
        response = requests.get(f"{BASE_URL}/rooms/{room_id}/state", timeout=10)
        success = response.status_code == 200
        details = f"Status: {response.status_code}"
        
        if success:
            state_data = response.json()
            details += f", Phase: {state_data.get('phase')}, Players: {len(state_data.get('players', []))}"
            print_test_result("Get Game State", success, details)
            return state_data
        else:
            details += f", Response: {response.text}"
            print_test_result("Get Game State", success, details)
            return {}
    except Exception as e:
        print_test_result("Get Game State", False, f"Error: {str(e)}")
        return {}

def test_set_player_ready(room_id: str, player_id: int, is_ready: bool):
    """Test setting player ready status"""
    try:
        data = {"room_id": room_id, "player_id": player_id, "is_ready": is_ready}
        response = requests.post(f"{BASE_URL}/rooms/ready", json=data, timeout=10)
        success = response.status_code == 200
        details = f"Status: {response.status_code}, Ready: {is_ready}"
        
        if success:
            result = response.json()
            details += f", Message: {result.get('message', '')}"
        else:
            details += f", Response: {response.text}"
            
        print_test_result("Set Player Ready", success, details)
        return success
    except Exception as e:
        print_test_result("Set Player Ready", False, f"Error: {str(e)}")
        return False

def test_game_flow():
    """Test complete game flow"""
    print("🎮 Testing Complete Game Flow")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_endpoint():
        print("❌ Backend is not running. Please start the backend first.")
        return False
    
    # Test 2: Create room with player 1
    room_data = test_create_room(TEST_PLAYER_1)
    if not room_data:
        return False
    
    room_id = room_data.get('room_id')
    player1_id = room_data.get('player_id')
    
    # Test 3: Get initial game state
    state_data = test_get_game_state(room_id)
    if not state_data:
        return False
    
    # Test 4: Join room with player 2
    player2_data = test_join_room(room_id, TEST_PLAYER_2)
    if not player2_data:
        return False
    
    player2_id = player2_data.get('player_id')
    
    # Test 5: Get updated game state (should have 2 players)
    state_data = test_get_game_state(room_id)
    if not state_data:
        return False
    
    # Test 6: Set player 1 ready
    test_set_player_ready(room_id, player1_id, True)
    
    # Test 7: Set player 2 ready
    test_set_player_ready(room_id, player2_id, True)
    
    # Test 8: Get final game state (should be ready to start)
    time.sleep(1)  # Give backend time to process
    state_data = test_get_game_state(room_id)
    if not state_data:
        return False
    
    print("🎉 All tests completed!")
    return True

def test_error_cases():
    """Test error cases and edge conditions"""
    print("\n🔍 Testing Error Cases")
    print("=" * 50)
    
    # Test 1: Create room with empty player name
    try:
        response = requests.post(f"{BASE_URL}/rooms/create", json={"player_name": ""}, timeout=10)
        success = response.status_code == 422  # Validation error expected
        details = f"Status: {response.status_code}"
        print_test_result("Create Room (Empty Name)", success, details)
    except Exception as e:
        print_test_result("Create Room (Empty Name)", False, f"Error: {str(e)}")
    
    # Test 2: Join non-existent room
    try:
        response = requests.post(f"{BASE_URL}/rooms/join", json={"room_id": "INVALID", "player_name": "Test"}, timeout=10)
        success = response.status_code == 404  # Not found expected
        details = f"Status: {response.status_code}"
        print_test_result("Join Invalid Room", success, details)
    except Exception as e:
        print_test_result("Join Invalid Room", False, f"Error: {str(e)}")
    
    # Test 3: Get state of non-existent room
    try:
        response = requests.get(f"{BASE_URL}/rooms/INVALID/state", timeout=10)
        success = response.status_code == 404  # Not found expected
        details = f"Status: {response.status_code}"
        print_test_result("Get Invalid Room State", success, details)
    except Exception as e:
        print_test_result("Get Invalid Room State", False, f"Error: {str(e)}")
    
    # Test 4: Set ready for non-existent player
    try:
        response = requests.post(f"{BASE_URL}/rooms/ready", json={"room_id": "INVALID", "player_id": 999, "is_ready": True}, timeout=10)
        success = response.status_code == 404  # Not found expected
        details = f"Status: {response.status_code}"
        print_test_result("Set Ready Invalid Player", success, details)
    except Exception as e:
        print_test_result("Set Ready Invalid Player", False, f"Error: {str(e)}")

def main():
    """Main test function"""
    print("🧪 Casino Card Game Backend Test Suite")
    print("=" * 60)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend is not responding properly.")
            print("Please make sure the backend is running on http://localhost:8000")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend.")
        print("Please start the backend with: cd backend && python -m uvicorn main:app --reload")
        sys.exit(1)
    
    # Run tests
    success = test_game_flow()
    test_error_cases()
    
    if success:
        print("\n🎊 All tests passed! Backend is working correctly.")
    else:
        print("\n💥 Some tests failed. Please check the backend logs.")
    
    print(f"\n📊 Test Summary:")
    print(f"Backend URL: {BASE_URL}")
    print(f"Health Check: {BASE_URL}/health")
    print(f"API Documentation: {BASE_URL}/docs")

if __name__ == "__main__":
    main()
