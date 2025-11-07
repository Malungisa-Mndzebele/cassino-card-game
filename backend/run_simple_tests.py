#!/usr/bin/env python3
"""
Simple test runner for game logic tests
Runs test_game_logic_simple.py and reports results
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    """Run all tests and report results"""
    try:
        # Try using pytest first
        import pytest
        exit_code = pytest.main(['-v', 'test_game_logic_simple.py'])
        sys.exit(exit_code)
    except ImportError:
        # Fall back to manual test execution
        from test_game_logic_simple import TestCasinoGameLogic
        
        test_instance = TestCasinoGameLogic()
        test_instance.setup_method()
        
        total = 0
        passed = 0
        failed = 0
        
        # Get all test methods
        test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
        
        for test_method_name in test_methods:
            total += 1
            test_method = getattr(test_instance, test_method_name)
            try:
                test_method()
                passed += 1
                print(f"PASS: {test_method_name}")
            except Exception as e:
                failed += 1
                print(f"FAIL: {test_method_name}: {e}")
        
        print(f"\n{'='*60}")
        print(f"Test Results: {passed} passed, {failed} failed out of {total} total")
        print(f"{'='*60}")
        
        # Exit with error code if tests failed
        if failed > 0:
            sys.exit(1)
        else:
            sys.exit(0)

if __name__ == '__main__':
    run_tests()

