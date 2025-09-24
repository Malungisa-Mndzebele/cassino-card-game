"""
Simple test runner for Casino Card Game
Runs all test files without requiring pytest
"""

import sys
import os
import inspect
import traceback
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import test classes
from test_game_logic_simple import TestCasinoGameLogic
from test_main_simple import TestCasinoAPI

def run_test_class(test_class):
    """Run all test methods in a test class"""
    print(f"\n🧪 Running tests for {test_class.__name__}...")
    
    # Create instance of test class
    test_instance = test_class()
    
    # Get all test methods
    test_methods = [
        method for method in dir(test_class)
        if method.startswith('test_') and callable(getattr(test_class, method))
    ]
    
    # Track results
    passed = 0
    failed = 0
    errors = []
    
    # Run each test
    for method_name in test_methods:
        print(f"\n⚡ Running {method_name}...")
        
        try:
            # Run setup if it exists
            if hasattr(test_instance, 'setup_method'):
                test_instance.setup_method()
            
            # Run the test
            method = getattr(test_instance, method_name)
            method()
            
            print(f"✅ {method_name} passed")
            passed += 1
            
        except Exception as e:
            print(f"❌ {method_name} failed:")
            print(f"   {str(e)}")
            print(f"   {traceback.format_exc()}")
            failed += 1
            errors.append((method_name, str(e), traceback.format_exc()))
    
    return passed, failed, errors

def main():
    """Run all tests"""
    print("🚀 Starting Casino Card Game Tests")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Track overall results
    total_passed = 0
    total_failed = 0
    all_errors = []
    
    # Run game logic tests
    passed, failed, errors = run_test_class(TestCasinoGameLogic)
    total_passed += passed
    total_failed += failed
    all_errors.extend(errors)
    
    # Run API tests
    passed, failed, errors = run_test_class(TestCasinoAPI)
    total_passed += passed
    total_failed += failed
    all_errors.extend(errors)
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"✅ Passed: {total_passed}")
    print(f"❌ Failed: {total_failed}")
    print(f"📈 Success Rate: {(total_passed / (total_passed + total_failed)) * 100:.1f}%")
    
    # Print errors if any
    if all_errors:
        print("\n❌ Failed Tests:")
        for test_name, error, traceback in all_errors:
            print(f"\n{test_name}:")
            print(f"Error: {error}")
            print("Traceback:")
            print(traceback)
    
    # Return non-zero exit code if any tests failed
    return 1 if total_failed > 0 else 0

if __name__ == "__main__":
    sys.exit(main())
