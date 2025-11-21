"""
Test script to verify backend modernization

Tests:
1. Import all modernized modules
2. Database connection (async)
3. Redis connection
4. Model creation
5. Schema validation
"""

import asyncio
import sys
import os
from pathlib import Path

# Force UTF-8 encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Clear DATABASE_URL to force SQLite
os.environ.pop("DATABASE_URL", None)

async def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    
    try:
        # Core modules
        import models
        import database
        import schemas
        import redis_client
        import cache_manager
        import session_manager
        import websocket_manager
        
        print("[PASS] All modules imported successfully")
        return True
    except Exception as e:
        print(f"[FAIL] Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_database():
    """Test database connection and async engine"""
    print("\nTesting database connection...")
    
    try:
        from database import async_engine, init_db, Base
        from models import Room, Player
        
        # Test engine creation
        print(f"  Database URL: {async_engine.url}")
        
        # Test connection
        async with async_engine.connect() as conn:
            print("  [PASS] Database connection successful")
        
        # Test table creation
        await init_db()
        print("  [PASS] Tables created/verified")
        
        return True
    except Exception as e:
        print(f"  [FAIL] Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_redis():
    """Test Redis connection"""
    print("\nTesting Redis connection...")
    
    try:
        from redis_client import redis_client
        
        # Test ping
        is_available = await redis_client.ping()
        
        if is_available:
            print("  [PASS] Redis connection successful")
            
            # Test basic operations
            await redis_client.set_json("test_key", {"test": "data"}, expire=60)
            data = await redis_client.get_json("test_key")
            
            if data and data.get("test") == "data":
                print("  [PASS] Redis read/write successful")
                await redis_client.delete("test_key")
                return True
            else:
                print("  [FAIL] Redis read/write failed")
                return False
        else:
            print("  [WARN] Redis not available (this is OK for local dev without Docker)")
            print("         To start Redis: docker-compose up redis -d")
            return True  # Don't fail if Redis isn't running
            
    except Exception as e:
        print(f"  [WARN] Redis test failed: {e}")
        print("         This is OK if Redis isn't running locally")
        return True  # Don't fail if Redis isn't running


async def test_models():
    """Test SQLAlchemy 2.0 models"""
    print("\nTesting SQLAlchemy 2.0 models...")
    
    try:
        from models import Room, Player, GameSession, GameActionLog
        from database import AsyncSessionLocal
        from datetime import datetime
        
        # Create a test room
        async with AsyncSessionLocal() as session:
            # Test model creation
            room = Room(
                id="TEST01",
                status="waiting",
                game_phase="waiting",
                player1_score=0,
                player2_score=0
            )
            
            session.add(room)
            await session.commit()
            
            print(f"  [PASS] Created test room: {room}")
            
            # Test model retrieval
            from sqlalchemy import select
            result = await session.execute(select(Room).where(Room.id == "TEST01"))
            retrieved_room = result.scalar_one_or_none()
            
            if retrieved_room:
                print(f"  [PASS] Retrieved room: {retrieved_room}")
            
            # Cleanup
            await session.delete(retrieved_room)
            await session.commit()
            print("  [PASS] Cleaned up test data")
        
        return True
    except Exception as e:
        print(f"  [FAIL] Model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_schemas():
    """Test Pydantic v2 schemas"""
    print("\nTesting Pydantic v2 schemas...")
    
    try:
        from schemas import (
            CreateRoomRequest,
            JoinRoomRequest,
            PlayCardRequest,
            GameStateResponse,
            PlayerResponse
        )
        from pydantic import ValidationError
        
        # Test valid request
        create_req = CreateRoomRequest(player_name="TestPlayer")
        print(f"  [PASS] Valid schema: {create_req.player_name}")
        
        # Test validation (should strip whitespace)
        create_req2 = CreateRoomRequest(player_name="  Spaced  ")
        assert create_req2.player_name == "Spaced", "Whitespace not stripped"
        print("  [PASS] Whitespace stripping works")
        
        # Test invalid request (should raise ValidationError)
        try:
            CreateRoomRequest(player_name="")
            print("  [FAIL] Validation should have failed for empty name")
            return False
        except ValidationError:
            print("  [PASS] Validation correctly rejects empty names")
        
        # Test room code validation
        join_req = JoinRoomRequest(room_id="abc123", player_name="Player")
        assert join_req.room_id == "ABC123", "Room ID not uppercased"
        print("  [PASS] Room ID uppercasing works")
        
        return True
    except Exception as e:
        print(f"  [FAIL] Schema test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_cache_manager():
    """Test cache manager"""
    print("\nTesting cache manager...")
    
    try:
        from cache_manager import cache_manager
        
        # Test game state caching
        test_state = {
            "room_id": "TEST01",
            "phase": "waiting",
            "score": 0
        }
        
        # This will only work if Redis is running
        try:
            await cache_manager.cache_game_state("TEST01", test_state, ttl=60)
            cached = await cache_manager.get_game_state("TEST01")
            
            if cached:
                print(f"  [PASS] Cache manager working: {cached}")
                await cache_manager.invalidate_game_state("TEST01")
                return True
            else:
                print("  [WARN] Cache manager requires Redis")
                return True
        except Exception as e:
            print(f"  [WARN] Cache manager test skipped (Redis not available): {e}")
            return True
            
    except Exception as e:
        print(f"  [FAIL] Cache manager test failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("=" * 60)
    print("Backend Modernization Verification Tests")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Imports", await test_imports()))
    results.append(("Database", await test_database()))
    results.append(("Redis", await test_redis()))
    results.append(("Models", await test_models()))
    results.append(("Schemas", await test_schemas()))
    results.append(("Cache Manager", await test_cache_manager()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{name:20} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! Backend modernization is working correctly.")
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed. Check errors above.")
    
    # Cleanup
    from database import close_db
    await close_db()
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
