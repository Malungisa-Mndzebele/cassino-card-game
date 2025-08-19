#!/usr/bin/env python3
"""
Comprehensive test runner for the full stack without mocks.
This script tests the entire application: backend, frontend, and integration.
"""

import asyncio
import subprocess
import sys
import time
import os
from pathlib import Path

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🚀 {title}")
    print("=" * 60)

def print_section(title: str):
    """Print a formatted section"""
    print(f"\n📋 {title}")
    print("-" * 40)

def check_dependencies():
    """Check if required dependencies are installed"""
    print_section("Checking Dependencies")
    
    # Check Python dependencies
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import httpx
        print("✅ Python dependencies are installed")
    except ImportError as e:
        print(f"❌ Missing Python dependency: {e}")
        print("   Run: pip install -r backend/requirements.txt")
        return False
    
    # Check Node.js dependencies
    if not Path("node_modules").exists():
        print("❌ Node.js dependencies not installed")
        print("   Run: npm install")
        return False
    else:
        print("✅ Node.js dependencies are installed")
    
    return True

def start_backend():
    """Start the FastAPI backend"""
    print_section("Starting Backend")
    
    try:
        # Change to backend directory
        os.chdir("backend")
        
        # Set environment variable for SQLite database
        env = os.environ.copy()
        env["DATABASE_URL"] = "sqlite:///./test_casino_game.db"
        
        # Start the backend server
        process = subprocess.Popen(
            ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Check if server is running
        if process.poll() is None:
            print("✅ Backend server started successfully")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Backend failed to start: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None
    finally:
        # Change back to root directory
        os.chdir("..")

def start_frontend():
    """Start the React frontend"""
    print_section("Starting Frontend")
    
    try:
        # Start the frontend server
        process = subprocess.Popen(
            ["npm", "run", "dev", "--", "--port", "3001"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(5)
        
        # Check if server is running
        if process.poll() is None:
            print("✅ Frontend server started successfully")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Frontend failed to start: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return None

async def run_backend_tests():
    """Run backend tests"""
    print_section("Running Backend Tests")
    
    try:
        # Import and run backend tests
        from test_backend import main as backend_test_main
        success = await backend_test_main()
        return success
    except Exception as e:
        print(f"❌ Backend test error: {e}")
        return False

async def run_frontend_tests():
    """Run frontend tests"""
    print_section("Running Frontend Tests")
    
    try:
        # Import and run frontend tests
        from test_frontend import main as frontend_test_main
        success = await frontend_test_main()
        return success
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False

def run_unit_tests():
    """Run unit tests without mocks"""
    print_section("Running Unit Tests")
    
    try:
        # Run Vitest tests
        result = subprocess.run(
            ["npm", "test", "--", "--run", "--reporter=verbose"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Unit tests passed")
            return True
        else:
            print(f"❌ Unit tests failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Unit test error: {e}")
        return False

def cleanup(backend_process=None, frontend_process=None):
    """Clean up processes and temporary files"""
    print_section("Cleaning Up")
    
    # Stop backend
    if backend_process:
        try:
            backend_process.terminate()
            backend_process.wait(timeout=5)
            print("✅ Backend stopped")
        except:
            backend_process.kill()
            print("⚠️  Backend force killed")
    
    # Stop frontend
    if frontend_process:
        try:
            frontend_process.terminate()
            frontend_process.wait(timeout=5)
            print("✅ Frontend stopped")
        except:
            frontend_process.kill()
            print("⚠️  Frontend force killed")
    
    # Remove test database
    test_db = Path("backend/test_casino_game.db")
    if test_db.exists():
        test_db.unlink()
        print("✅ Test database removed")

async def main():
    """Main test runner"""
    print_header("Full Stack Test Suite (No Mocks)")
    print("Testing the complete application with real backend and frontend")
    
    backend_process = None
    frontend_process = None
    
    try:
        # Check dependencies
        if not check_dependencies():
            return False
        
        # Start backend
        backend_process = start_backend()
        if not backend_process:
            return False
        
        # Start frontend
        frontend_process = start_frontend()
        if not frontend_process:
            return False
        
        # Wait for servers to be ready
        print_section("Waiting for Servers")
        print("⏳ Waiting for servers to be ready...")
        time.sleep(10)
        
        # Run tests
        backend_success = await run_backend_tests()
        frontend_success = await run_frontend_tests()
        unit_success = run_unit_tests()
        
        # Print results
        print_header("Test Results")
        print(f"Backend Tests: {'✅ PASSED' if backend_success else '❌ FAILED'}")
        print(f"Frontend Tests: {'✅ PASSED' if frontend_success else '❌ FAILED'}")
        print(f"Unit Tests: {'✅ PASSED' if unit_success else '❌ FAILED'}")
        
        overall_success = backend_success and frontend_success and unit_success
        
        if overall_success:
            print("\n🎉 ALL TESTS PASSED! Your application is working correctly.")
        else:
            print("\n⚠️  Some tests failed. Check the implementation.")
        
        return overall_success
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return False
    except Exception as e:
        print(f"\n❌ Test runner error: {e}")
        return False
    finally:
        cleanup(backend_process, frontend_process)

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
