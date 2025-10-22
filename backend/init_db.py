#!/usr/bin/env python3
"""
Database initialization script for News Integrity
"""

import asyncio
import os
from app.database.database import init_db

async def main():
    """Initialize the database"""
    try:
        print(" Starting database initialization...")
        
        # Check if database file exists
        db_path = "./news_integrity.db"
        if os.path.exists(db_path):
            print(f" Database file exists at {db_path}")
        else:
            print(f" Creating new database at {db_path}")
        
        # Initialize database
        await init_db()
        
        print("✅ Database initialization completed successfully!")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
