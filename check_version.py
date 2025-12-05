#!/usr/bin/env python3
"""
Check if the new WebSocket fixes are present in the code
"""

import os
import sys

def check_file(filepath, search_string, description):
    """Check if a file contains a specific string"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if search_string in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description}")
                return False
    except FileNotFoundError:
        print(f"⚠️  File not found: {filepath}")
        return False

def main():
    print("=" * 60)
    print("Checking if WebSocket fixes are present...")
    print("=" * 60)
    print()
    
    checks = [
        (
            "backend/websocket_manager.py",
            "# Redis unavailable - fallback to local broadcast",
            "Redis fallback in WebSocket manager"
        ),
        (
            "backend/websocket_manager.py",
            "async def broadcast_json_to_room",
            "broadcast_json_to_room method exists"
        ),
        (
            "backend/main.py",
            'print("ℹ️  WebSocket using local-only mode (no Redis)"',
            "Local-only mode message in lifespan"
        ),
        (
            "backend/main.py",
            "await manager.start_subscriber()",
            "WebSocket subscriber started in lifespan"
        ),
        (
            "backend/main.py",
            "await manager.broadcast_json_to_room",
            "Using broadcast_json_to_room in endpoints"
        ),
    ]
    
    all_passed = True
    for filepath, search_string, description in checks:
        if not check_file(filepath, search_string, description):
            all_passed = False
    
    print()
    print("=" * 60)
    if all_passed:
        print("✅ ALL CHECKS PASSED - New code is present!")
        print()
        print("Next steps:")
        print("1. Restart backend: cd backend && python main.py")
        print("2. Look for: 'ℹ️  WebSocket using local-only mode (no Redis)'")
        print("3. Restart frontend: npm run dev")
        print("4. Clear browser cache")
        print("5. Test with 2 players")
    else:
        print("❌ SOME CHECKS FAILED - Code may not be updated")
        print()
        print("Try:")
        print("1. git pull origin master")
        print("2. Check if you're in the right directory")
        print("3. Run this script again")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
