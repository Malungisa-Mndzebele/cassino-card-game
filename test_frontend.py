#!/usr/bin/env python3
"""
Frontend integration test script.
Tests the React frontend with the real FastAPI backend.
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3001"  # Frontend is running on port 3001

class FrontendTester:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.room_id = None
        self.player1_id = None
        self.player2_id = None
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def test_backend_connectivity(self) -> bool:
        """Test if backend is accessible"""
        print("🧪 Testing backend connectivity...")
        
        try:
            response = await self.client.get(f"{BACKEND_URL}/docs")
            if response.status_code == 200:
                print("✅ Backend is accessible")
                return True
            else:
                print(f"❌ Backend returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to backend: {e}")
            return False
    
    async def test_frontend_connectivity(self) -> bool:
        """Test if frontend is accessible"""
        print("🧪 Testing frontend connectivity...")
        
        try:
            response = await self.client.get(FRONTEND_URL)
            if response.status_code == 200:
                print("✅ Frontend is accessible")
                return True
            else:
                print(f"❌ Frontend returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to frontend: {e}")
            return False
    
    async def test_api_endpoints(self) -> bool:
        """Test all API endpoints"""
        print("🧪 Testing API endpoints...")
        
        # Test create room
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/rooms/create",
                json={"player_name": "TestPlayer1"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.room_id = data["room_id"]
                self.player1_id = data["player_id"]
                print(f"✅ Create room endpoint works: {self.room_id}")
            else:
                print(f"❌ Create room failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Create room error: {e}")
            return False
        
        # Test join room
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/rooms/join",
                json={
                    "room_id": self.room_id,
                    "player_name": "TestPlayer2"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.player2_id = data["player_id"]
                print(f"✅ Join room endpoint works: {self.player2_id}")
            else:
                print(f"❌ Join room failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Join room error: {e}")
            return False
        
        # Test get game state
        try:
            response = await self.client.get(f"{BACKEND_URL}/rooms/{self.room_id}/state")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Get game state endpoint works")
            else:
                print(f"❌ Get game state failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Get game state error: {e}")
            return False
        
        return True
    
    async def test_cors_headers(self) -> bool:
        """Test CORS headers"""
        print("🧪 Testing CORS headers...")
        
        try:
            response = await self.client.options(f"{BACKEND_URL}/rooms/create")
            
            # Check for CORS headers (case-insensitive)
            headers_lower = {k.lower(): v for k, v in response.headers.items()}
            
            if "access-control-allow-origin" in headers_lower:
                print("✅ CORS headers are present")
                print(f"   Origin: {headers_lower.get('access-control-allow-origin', 'Not found')}")
                return True
            else:
                print("❌ CORS headers missing")
                print(f"   Available headers: {list(headers_lower.keys())}")
                return False
                
        except Exception as e:
            print(f"❌ CORS test error: {e}")
            return False
    
    async def test_error_handling(self) -> bool:
        """Test error handling"""
        print("🧪 Testing error handling...")
        
        # Test invalid room ID
        try:
            response = await self.client.get(f"{BACKEND_URL}/rooms/INVALID/state")
            
            if response.status_code == 404:
                print("✅ 404 error handling works")
            else:
                print(f"❌ Expected 404, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
            return False
        
        # Test invalid JSON
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/rooms/create",
                content="invalid json"
            )
            
            if response.status_code == 422:
                print("✅ JSON validation works")
            else:
                print(f"❌ Expected 422, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ JSON validation test failed: {e}")
            return False
        
        return True
    
    async def run_all_tests(self):
        """Run all frontend integration tests"""
        print("🚀 Starting frontend integration tests...")
        print("=" * 50)
        
        tests = [
            ("Backend Connectivity", self.test_backend_connectivity),
            ("Frontend Connectivity", self.test_frontend_connectivity),
            ("API Endpoints", self.test_api_endpoints),
            ("CORS Headers", self.test_cors_headers),
            ("Error Handling", self.test_error_handling),
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
            print("🎉 All frontend integration tests passed!")
        else:
            print("⚠️  Some tests failed. Check the implementation.")
        
        return passed == total

async def main():
    """Main test runner"""
    print("🔧 Frontend Integration Test Suite")
    print("Testing React frontend with FastAPI backend")
    print("=" * 50)
    
    # Run tests
    async with FrontendTester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
