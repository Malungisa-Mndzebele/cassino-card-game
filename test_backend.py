#!/usr/bin/env python3
"""
Test script for the FastAPI backend without mocks.
This script tests the actual API endpoints and database operations.
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_PLAYER_1 = "Alice"
TEST_PLAYER_2 = "Bob"

class BackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.room_id = None
        self.player1_id = None
        self.player2_id = None
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def test_create_room(self) -> bool:
        """Test creating a new room"""
        print("🧪 Testing create room...")
        
        try:
            response = await self.client.post(
                f"{BASE_URL}/rooms/create",
                json={"player_name": TEST_PLAYER_1}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.room_id = data["room_id"]
                self.player1_id = data["player_id"]
                print(f"✅ Room created successfully: {self.room_id}")
                print(f"   Player 1 ID: {self.player1_id}")
                return True
            else:
                print(f"❌ Failed to create room: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating room: {e}")
            return False
    
    async def test_join_room(self) -> bool:
        """Test joining an existing room"""
        print("🧪 Testing join room...")
        
        if not self.room_id:
            print("❌ No room ID available")
            return False
            
        try:
            response = await self.client.post(
                f"{BASE_URL}/rooms/join",
                json={
                    "room_id": self.room_id,
                    "player_name": TEST_PLAYER_2
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.player2_id = data["player_id"]
                print(f"✅ Player 2 joined successfully: {self.player2_id}")
                return True
            else:
                print(f"❌ Failed to join room: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error joining room: {e}")
            return False
    
    async def test_get_game_state(self) -> bool:
        """Test getting game state"""
        print("🧪 Testing get game state...")
        
        if not self.room_id:
            print("❌ No room ID available")
            return False
            
        try:
            response = await self.client.get(f"{BASE_URL}/rooms/{self.room_id}/state")
            
            if response.status_code == 200:
                data = response.json()
                game_state = data["game_state"]
                print(f"✅ Game state retrieved successfully")
                print(f"   Phase: {game_state['phase']}")
                print(f"   Players: {len(game_state['players'])}")
                return True
            else:
                print(f"❌ Failed to get game state: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error getting game state: {e}")
            return False
    
    async def test_set_player_ready(self) -> bool:
        """Test setting player ready status"""
        print("🧪 Testing set player ready...")
        
        if not self.room_id or not self.player1_id:
            print("❌ No room ID or player ID available")
            return False
            
        try:
            response = await self.client.post(
                f"{BASE_URL}/rooms/player-ready",
                json={
                    "room_id": self.room_id,
                    "player_id": self.player1_id,
                    "is_ready": True
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Player ready status set successfully")
                return True
            else:
                print(f"❌ Failed to set player ready: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error setting player ready: {e}")
            return False
    
    async def test_start_shuffle(self) -> bool:
        """Test starting shuffle phase"""
        print("🧪 Testing start shuffle...")
        
        if not self.room_id or not self.player1_id:
            print("❌ No room ID or player ID available")
            return False
            
        try:
            response = await self.client.post(
                f"{BASE_URL}/game/start-shuffle",
                json={
                    "room_id": self.room_id,
                    "player_id": self.player1_id
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Shuffle started successfully")
                return True
            else:
                print(f"❌ Failed to start shuffle: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error starting shuffle: {e}")
            return False
    
    async def test_select_face_up_cards(self) -> bool:
        """Test selecting face-up cards"""
        print("🧪 Testing select face-up cards...")
        
        if not self.room_id or not self.player1_id:
            print("❌ No room ID or player ID available")
            return False
            
        try:
            response = await self.client.post(
                f"{BASE_URL}/game/select-face-up-cards",
                json={
                    "room_id": self.room_id,
                    "player_id": self.player1_id,
                    "card_ids": ["A_hearts", "K_diamonds", "Q_clubs", "J_spades"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Face-up cards selected successfully")
                return True
            else:
                print(f"❌ Failed to select face-up cards: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error selecting face-up cards: {e}")
            return False
    
    async def test_play_card(self) -> bool:
        """Test playing a card"""
        print("🧪 Testing play card...")
        
        if not self.room_id or not self.player1_id:
            print("❌ No room ID or player ID available")
            return False
            
        try:
            response = await self.client.post(
                f"{BASE_URL}/game/play-card",
                json={
                    "room_id": self.room_id,
                    "player_id": self.player1_id,
                    "card_id": "A_hearts",
                    "action": "trail"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Card played successfully")
                return True
            else:
                print(f"❌ Failed to play card: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error playing card: {e}")
            return False
    
    async def test_reset_game(self) -> bool:
        """Test resetting the game"""
        print("🧪 Testing reset game...")
        
        if not self.room_id:
            print("❌ No room ID available")
            return False
            
        try:
            response = await self.client.post(f"{BASE_URL}/game/reset?room_id={self.room_id}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Game reset successfully")
                return True
            else:
                print(f"❌ Failed to reset game: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error resetting game: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting backend tests without mocks...")
        print("=" * 50)
        
        tests = [
            ("Create Room", self.test_create_room),
            ("Join Room", self.test_join_room),
            ("Get Game State", self.test_get_game_state),
            ("Set Player Ready", self.test_set_player_ready),
            ("Start Shuffle", self.test_start_shuffle),
            ("Select Face-up Cards", self.test_select_face_up_cards),
            ("Play Card", self.test_play_card),
            ("Reset Game", self.test_reset_game),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}")
            print("-" * 30)
            
            try:
                success = await test_func()
                if success:
                    passed += 1
                    print(f"✅ {test_name} PASSED")
                else:
                    print(f"❌ {test_name} FAILED")
            except Exception as e:
                print(f"❌ {test_name} ERROR: {e}")
            
            # Small delay between tests
            await asyncio.sleep(0.5)
        
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the backend implementation.")
        
        return passed == total

async def main():
    """Main test runner"""
    print("🔧 Backend Integration Test Suite")
    print("Testing FastAPI backend without mocks")
    print("=" * 50)
    
    # Check if backend is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs")
            if response.status_code != 200:
                print("❌ Backend is not running or not accessible")
                print("   Please start the backend with: uvicorn main:app --reload")
                return False
    except Exception as e:
        print("❌ Cannot connect to backend")
        print("   Please start the backend with: uvicorn main:app --reload")
        print(f"   Error: {e}")
        return False
    
    print("✅ Backend is running and accessible")
    
    # Run tests
    async with BackendTester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
