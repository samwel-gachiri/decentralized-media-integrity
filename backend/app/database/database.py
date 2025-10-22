import aiosqlite
import os
from typing import AsyncGenerator
from .migrations import create_tables, seed_sample_data


DATABASE_URL = "sqlite:///./news_integrity.db"
DATABASE_PATH = "./news_integrity.db"

async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Get database connection"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db



async def init_db():
    """Initialize database with tables and sample data"""
    print(" Initializing News Integrity database...")
    
    # Create tables
    await create_tables(DATABASE_PATH)
    
    # Seed sample data for demo
    await seed_sample_data(DATABASE_PATH)
    
    print("✅ Database initialization complete!")

async def reset_db():
    """Reset database (useful for development)"""
    from .migrations import reset_database
    await reset_database(DATABASE_PATH)