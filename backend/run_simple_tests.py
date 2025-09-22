"""
Simple test runner for Casino Card Game Logic (no pytest required)
Runs all tests and reports results
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from test_game_logic_simple import TestCasinoGameLogic

def run_tests():
    """Run all tests and report results"""
    test_instance = TestCasinoGameLogic()
    test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
    
    passed = 0
    failed = 0
    errors = []
    
    print("🧪 Running Casino Card Game Logic Tests")
    print("=" * 50)
    
    for test_method in test_methods:
        try:
            print(f"Running {test_method}...", end=" ")
            test_instance.setup_method()
            getattr(test_instance, test_method)()
            print("✅ PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ FAILED: {str(e)}")
            failed += 1
            errors.append(f"{test_method}: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if errors:
        print("\n❌ Failed Tests:")
        for error in errors:
            print(f"  - {error}")
    
    if failed == 0:
        print("\n🎉 All tests passed! Game logic is working correctly.")
    else:
        print(f"\n⚠️  {failed} tests failed. Please check the implementation.")
    
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
