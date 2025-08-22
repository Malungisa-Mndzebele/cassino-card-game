#!/usr/bin/env python3
"""
Database switching utility for Casino Card Game Backend
This script helps you switch between SQLite and PostgreSQL databases
"""

import os
import sys
from pathlib import Path

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = Path(__file__).parent / ".env"
    env_example = Path(__file__).parent / "env.example"
    
    if not env_file.exists():
        if env_example.exists():
            print("📝 Creating .env file from template...")
            with open(env_example, 'r') as f:
                content = f.read()
            with open(env_file, 'w') as f:
                f.write(content)
            print("✅ .env file created")
        else:
            print("❌ env.example file not found")
            return False
    return True

def switch_to_postgresql():
    """Switch to PostgreSQL database"""
    env_file = Path(__file__).parent / ".env"
    
    if not create_env_file():
        return False
    
    # Read current .env file
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    # Update DATABASE_URL to PostgreSQL
    updated_lines = []
    for line in lines:
        if line.startswith("DATABASE_URL="):
            if "postgresql" in line:
                print("✅ Already using PostgreSQL")
                return True
            else:
                # Comment out SQLite and uncomment PostgreSQL
                updated_lines.append("# " + line.strip() + "\n")
                updated_lines.append("DATABASE_URL=postgresql://casino_user:casino_password@localhost:5432/casino_game\n")
        elif line.startswith("# DATABASE_URL=") and "postgresql" in line:
            # Uncomment PostgreSQL line
            updated_lines.append(line.replace("# ", ""))
        else:
            updated_lines.append(line)
    
    # Write updated .env file
    with open(env_file, 'w') as f:
        f.writelines(updated_lines)
    
    print("✅ Switched to PostgreSQL database")
    print("🐘 Make sure PostgreSQL is running with: docker-compose up -d postgres")
    return True

def switch_to_sqlite():
    """Switch to SQLite database"""
    env_file = Path(__file__).parent / ".env"
    
    if not create_env_file():
        return False
    
    # Read current .env file
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    # Update DATABASE_URL to SQLite
    updated_lines = []
    for line in lines:
        if line.startswith("DATABASE_URL="):
            if "sqlite" in line:
                print("✅ Already using SQLite")
                return True
            else:
                # Comment out PostgreSQL and uncomment SQLite
                updated_lines.append("# " + line.strip() + "\n")
                updated_lines.append("DATABASE_URL=sqlite:///./test_casino_game.db\n")
        elif line.startswith("# DATABASE_URL=") and "sqlite" in line:
            # Uncomment SQLite line
            updated_lines.append(line.replace("# ", ""))
        else:
            updated_lines.append(line)
    
    # Write updated .env file
    with open(env_file, 'w') as f:
        f.writelines(updated_lines)
    
    print("✅ Switched to SQLite database")
    return True

def show_current_db():
    """Show current database configuration"""
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        print("❌ .env file not found")
        return
    
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    for line in lines:
        if line.startswith("DATABASE_URL=") and not line.startswith("#"):
            db_url = line.split("=", 1)[1].strip()
            if "postgresql" in db_url:
                print("🐘 Currently using: PostgreSQL")
                print(f"   URL: {db_url}")
            elif "sqlite" in db_url:
                print("💾 Currently using: SQLite")
                print(f"   URL: {db_url}")
            else:
                print("❓ Unknown database type")
                print(f"   URL: {db_url}")
            return
    
    print("❌ DATABASE_URL not found in .env file")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python switch_db.py [postgresql|sqlite|status]")
        print("\nCommands:")
        print("  postgresql  - Switch to PostgreSQL database")
        print("  sqlite      - Switch to SQLite database")
        print("  status      - Show current database configuration")
        return
    
    command = sys.argv[1].lower()
    
    if command == "postgresql":
        switch_to_postgresql()
    elif command == "sqlite":
        switch_to_sqlite()
    elif command == "status":
        show_current_db()
    else:
        print(f"❌ Unknown command: {command}")
        print("Available commands: postgresql, sqlite, status")

if __name__ == "__main__":
    main()
