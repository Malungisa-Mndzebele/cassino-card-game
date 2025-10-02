#!/usr/bin/env python3
"""
Test database connection to MySQL database
Run this on the server after deployment to verify database connectivity
"""

import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 60)
print("Database Connection Test")
print("=" * 60)

# Mask password in output
if DATABASE_URL:
    display_url = DATABASE_URL.split('@')[0].split('://')[1]
    safe_url = DATABASE_URL.replace(display_url, '***:***')
    print(f"Database URL: {safe_url}")
else:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

print()

try:
    # Create engine
    print("Creating database engine...")
    engine = create_engine(DATABASE_URL)
    
    # Test connection
    print("Testing connection...")
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1 as test"))
        row = result.fetchone()
        print(f"✅ Connection successful! Test query result: {row[0]}")
        
        # Get database info
        result = connection.execute(text("SELECT DATABASE() as db_name, VERSION() as version"))
        row = result.fetchone()
        print(f"✅ Connected to database: {row[0]}")
        print(f"✅ MySQL version: {row[1]}")
        
        # List tables
        result = connection.execute(text("SHOW TABLES"))
        tables = result.fetchall()
        print(f"\n📊 Existing tables: {len(tables)}")
        if tables:
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("  (No tables yet - run migrations with: alembic upgrade head)")
        
    print("\n" + "=" * 60)
    print("✅ Database connection test PASSED!")
    print("=" * 60)
    sys.exit(0)
    
except Exception as e:
    print(f"\n❌ Connection failed!")
    print(f"Error: {str(e)}")
    print("\n" + "=" * 60)
    print("❌ Database connection test FAILED!")
    print("=" * 60)
    print("\nTroubleshooting tips:")
    print("1. Verify DATABASE_URL in .env file")
    print("2. Ensure database credentials are correct")
    print("3. Check if MySQL service is running")
    print("4. Verify database user has proper permissions")
    print("5. If remote connection, check firewall/whitelist")
    sys.exit(1)

