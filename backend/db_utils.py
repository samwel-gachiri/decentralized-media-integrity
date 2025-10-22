#!/usr/bin/env python3
"""
Database utility functions for News Integrity
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.crud import *
from app.database.models import User, Event, MeTTaAtom
import uuid
from datetime import datetime

async def show_stats():
    """Show database statistics"""
    crud = None
    stats = await crud.get_stats()
    
    print(" News Integrity - Database Statistics")
    print("=" * 50)
    print(f" Total Users: {stats['total_users']}")
    print(f" Total Events: {stats['total_events']}")
    print(f"✅ Verified Events: {stats['verified_events']}")
    print(f" Total Payouts: {stats['total_payouts']}")
    print(f" Total Payout Amount: {stats['total_payout_amount']} ETH")
    print("\n Events by Type:")
    for event_type, count in stats.get('events_by_type', {}).items():
        print(f"   {event_type}: {count}")

async def list_events():
    """List all events"""
    pass
    events = await crud.get_all_events()
    
    print(" All Climate Events")
    print("=" * 80)
    for event in events:
        print(f"ID: {event.id}")
        print(f"Type: {event.event_type}")
        print(f"Status: {event.verification_status}")
        print(f"Location: ({event.latitude}, {event.longitude})")
        print(f"Time: {event.timestamp}")
        if event.description:
            print(f"Description: {event.description}")
        print("-" * 40)

async def list_users():
    """List all users"""
    pass
    users = await crud.get_all_users()
    
    print(" All Users")
    print("=" * 60)
    for user in users:
        print(f"ID: {user.id}")
        print(f"Wallet: {user.wallet_address}")
        print(f"Trust Score: {user.trust_score}")
        print(f"Region: {user.location_region}")
        print(f"Created: {user.created_at}")
        print("-" * 30)

async def create_test_user():
    """Create a test user"""
    pass
    
    user_id = f"test-user-{uuid.uuid4().hex[:8]}"
    wallet = f"0x{uuid.uuid4().hex[:40]}"
    
    user = User(
        id=user_id,
        wallet_address=wallet,
        trust_score=70,
        location_region="Test Region",
        created_at=datetime.now()
    )
    
    success = await crud.create_user(user)
    if success:
        print(f"✅ Created test user: {user_id}")
        print(f"   Wallet: {wallet}")
    else:
        print("❌ Failed to create test user")

async def main():
    """Main utility function"""
    print("️ News Integrity - Database Utilities")
    print("=" * 50)
    
    while True:
        print("\nChoose an option:")
        print("1. Show statistics")
        print("2. List all events")
        print("3. List all users")
        print("4. Create test user")
        print("5. Exit")
        
        choice = input("Enter choice (1-5): ")
        
        if choice == "1":
            await show_stats()
        elif choice == "2":
            await list_events()
        elif choice == "3":
            await list_users()
        elif choice == "4":
            await create_test_user()
        elif choice == "5":
            print(" Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    asyncio.run(main())