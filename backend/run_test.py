"""Simple test runner to verify tests work"""
import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def run_test():
    """Run a simple test"""
    from test_main_simple import TestCasinoAPI
    from httpx import AsyncClient, ASGITransport
    from main import app
    
    # Create test instance
    test = TestCasinoAPI()
    test.setup_class()
    test.setup_method()
    
    try:
        # Run health check test
        await test.test_health_check()
        print("✅ Health check test passed!")
        
        # Run create room test
        await test.test_create_room()
        print("✅ Create room test passed!")
        
        print("\n🎉 All tests passed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        test.teardown_method()
        test.teardown_class()

if __name__ == "__main__":
    asyncio.run(run_test())

