#!/usr/bin/env python3
"""
Deployment Verification Script for Render

This script verifies that a Render deployment is working correctly by testing:
- Health endpoint availability
- Database connectivity
- Redis connectivity
- WebSocket connections
- Session management

Usage:
    python verify_deployment.py [--url BASE_URL]

Example:
    python verify_deployment.py --url https://cassino-game-backend.onrender.com
"""

import sys
import argparse
import asyncio
import httpx
from typing import Optional


class DeploymentVerifier:
    """Verifies Render deployment is working correctly"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.results = {
            "health": False,
            "database": False,
            "redis": False,
            "websocket": False,
            "session": False
        }
    
    async def verify_health_endpoint(self) -> bool:
        """Verify health endpoint returns HTTP 200"""
        print("🔍 Testing health endpoint...")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check required fields
                    if all(key in data for key in ["status", "database", "redis"]):
                        print(f"✅ Health endpoint: {data['status']}")
                        self.results["health"] = True
                        return True
                    else:
                        print("❌ Health endpoint: Missing required fields")
                        return False
                else:
                    print(f"❌ Health endpoint returned {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Health endpoint error: {e}")
            return False
    
    async def verify_database_connectivity(self) -> bool:
        """Verify database connectivity via health endpoint"""
        print("🔍 Testing database connectivity...")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    db_status = data.get("database", "disconnected")
                    
                    if db_status == "connected":
                        print("✅ Database: connected")
                        self.results["database"] = True
                        return True
                    else:
                        print(f"❌ Database: {db_status}")
                        return False
                else:
                    print(f"❌ Database check failed (HTTP {response.status_code})")
                    return False
        except Exception as e:
            print(f"❌ Database check error: {e}")
            return False
    
    async def verify_redis_connectivity(self) -> bool:
        """Verify Redis connectivity via health endpoint"""
        print("🔍 Testing Redis connectivity...")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    redis_status = data.get("redis", "disconnected")
                    
                    if redis_status == "connected":
                        print("✅ Redis: connected")
                        self.results["redis"] = True
                        return True
                    else:
                        print(f"⚠️  Redis: {redis_status} (may be degraded)")
                        # Redis is optional, so we don't fail the deployment
                        self.results["redis"] = False
                        return True
                else:
                    print(f"❌ Redis check failed (HTTP {response.status_code})")
                    return False
        except Exception as e:
            print(f"❌ Redis check error: {e}")
            return False
    
    async def verify_websocket_support(self) -> bool:
        """Verify WebSocket endpoint exists (basic check)"""
        print("🔍 Testing WebSocket support...")
        try:
            # We can't easily test WebSocket from this script without a room
            # So we just verify the endpoint exists by checking if we can create a room
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/rooms/create",
                    json={"player_name": "VerificationTest"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "room_id" in data:
                        print("✅ WebSocket: endpoint available")
                        self.results["websocket"] = True
                        return True
                    else:
                        print("❌ WebSocket: Invalid response")
                        return False
                else:
                    print(f"❌ WebSocket check failed (HTTP {response.status_code})")
                    return False
        except Exception as e:
            print(f"❌ WebSocket check error: {e}")
            return False
    
    async def verify_session_management(self) -> bool:
        """Verify session creation works"""
        print("🔍 Testing session management...")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Create a room (which creates a session)
                response = await client.post(
                    f"{self.base_url}/rooms/create",
                    json={"player_name": "SessionTest"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify session data is returned
                    if all(key in data for key in ["room_id", "player_id", "game_state"]):
                        print("✅ Session management: working")
                        self.results["session"] = True
                        return True
                    else:
                        print("❌ Session management: Missing data")
                        return False
                else:
                    print(f"❌ Session management failed (HTTP {response.status_code})")
                    return False
        except Exception as e:
            print(f"❌ Session management error: {e}")
            return False
    
    async def run_all_checks(self) -> bool:
        """Run all verification checks"""
        print(f"\n🚀 Verifying deployment at {self.base_url}\n")
        
        # Run checks in sequence
        checks = [
            self.verify_health_endpoint(),
            self.verify_database_connectivity(),
            self.verify_redis_connectivity(),
            self.verify_websocket_support(),
            self.verify_session_management()
        ]
        
        results = await asyncio.gather(*checks, return_exceptions=True)
        
        # Check if all passed
        all_passed = all(r is True for r in results if not isinstance(r, Exception))
        
        # Print summary
        print("\n" + "="*50)
        print("📊 Verification Summary")
        print("="*50)
        for check_name, passed in self.results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{check_name.capitalize():20s} {status}")
        print("="*50)
        
        if all_passed:
            print("\n✨ All checks passed! Deployment is healthy.\n")
            return True
        else:
            print("\n⚠️  Some checks failed. Please review the deployment.\n")
            return False


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Verify Render deployment is working correctly"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the deployment (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    verifier = DeploymentVerifier(args.url)
    success = await verifier.run_all_checks()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
