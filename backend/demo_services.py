#!/usr/bin/env python3
"""
Service Integration Demo for Climate Witness Chain
Demonstrates the integration between all services with MeTTa
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import init_db
from app.services.user_service import UserService
from app.services.event_service import EventService
from app.services.metta_service import MeTTaService

async def demo_user_service():
    """Demonstrate User Service with MeTTa integration"""
    print(" User Service Demo")
    print("=" * 40)
    
    user_service = UserService()
    
    # Create a test user
    print("1. Creating test user...")
    user = await user_service.create_user(
        wallet_address="0xDEMO123456789012345678901234567890ABCDEF",
        location_region="Demo Region, Kenya",
        initial_trust_score=70
    )
    
    print(f"   ✅ User created: {user.id}")
    print(f"    Location: {user.location_region}")
    print(f"    Trust Score: {user.trust_score}")
    print(f"    Wallet: {user.wallet_address}")
    
    # Get user stats
    print("\n2. Getting user statistics...")
    stats = await user_service.get_user_stats(user.id)
    print(f"    Total Events: {stats['total_events']}")
    print(f"   ✅ Verified Events: {stats['verified_events']}")
    print(f"    Trust Level: {stats['trust_level']}")
    
    # Update trust score
    print("\n3. Updating trust score...")
    await user_service.update_trust_score(user.id, 5, "Demo positive feedback")
    updated_user = await user_service.get_user_by_id(user.id)
    print(f"    Trust Score: {user.trust_score} → {updated_user.trust_score}")
    
    return user

async def demo_event_service(user):
    """Demonstrate Event Service with MeTTa integration"""
    print("\n Event Service Demo")
    print("=" * 40)
    
    event_service = EventService()
    
    # Create a test event
    print("1. Creating test event...")
    event_data = {
        'user_id': user.id,
        'event_type': 'drought',
        'description': 'Demo drought event for service testing',
        'latitude': 3.1190,
        'longitude': 35.5970,
        'photo_path': None
    }
    
    result = await event_service.submit_event(event_data)
    event_id = result['event_id']
    
    print(f"   ✅ Event created: {event_id}")
    print(f"    Location: ({event_data['latitude']}, {event_data['longitude']})")
    print(f"    MeTTa atoms: {result['metta_atoms_created']}")
    
    # Verify the event
    print("\n2. Verifying event with MeTTa...")
    verification_result = await event_service.verify_event_with_metta(event_id)
    
    print(f"    Verification: {'✅ VERIFIED' if verification_result['verified'] else '❌ FAILED'}")
    if verification_result['event']:
        event = verification_result['event']
        print(f"    Payout: {event.get('payout_amount', 0)} ETH")
        print(f"    Status: {event.get('verification_status', 'unknown')}")
    
    # Get event statistics
    print("\n3. Getting event statistics...")
    stats = await event_service.get_event_statistics()
    print(f"    Total Events: {stats['total_events']}")
    print(f"   ✅ Verified Events: {stats['verified_events']}")
    print(f"    Verification Rate: {stats['verification_rate']:.2%}")
    print(f"    Total Payouts: {stats['total_payout_amount']} ETH")
    
    return event_id

async def demo_metta_service(user, event_id):
    """Demonstrate MeTTa Service functionality"""
    print("\n MeTTa Service Demo")
    print("=" * 40)
    
    metta_service = MeTTaService()
    
    # Get knowledge base state
    print("1. Knowledge base state...")
    kb_state = metta_service.get_knowledge_base_state()
    print(f"    Loaded files: {len(kb_state.get('loaded_metta_files', []))}")
    print(f"    Total verifications: {kb_state['total_verifications']}")
    print(f"    Files: {', '.join(kb_state.get('loaded_metta_files', []))}")
    
    # Query knowledge base
    print("\n2. Querying knowledge base...")
    queries = [
        "(climate-event-type $type)",
        f"(trust-score {user.id} $score)",
        "(payout-amount High $amount)"
    ]
    
    for query in queries:
        print(f"   Query: {query}")
        results = metta_service.query_knowledge_base(query)
        if results:
            for result in results[:2]:  # Show first 2 results
                print(f"     Result: {result}")
        else:
            print("     No results")
    
    # Create additional atoms
    print("\n3. Creating additional MeTTa atoms...")
    try:
        atoms = await metta_service.create_atoms({"event_id": event_id})
        print(f"   ✅ Created {len(atoms)} atoms")
        for atom in atoms[:3]:  # Show first 3 atoms
            print(f"     {atom}")
    except Exception as e:
        print(f"   ⚠️ Atom creation: {str(e)}")

async def demo_service_integration():
    """Demonstrate full service integration"""
    print("\n Service Integration Demo")
    print("=" * 40)
    
    user_service = UserService()
    event_service = EventService()
    
    # Create multiple users
    print("1. Creating multiple users...")
    users = []
    for i, (region, trust) in enumerate([
        ("Turkana, Kenya", 85),
        ("Kajiado, Kenya", 60),
        ("Marsabit, Kenya", 75)
    ]):
        user = await user_service.create_user(
            wallet_address=f"0x{i:040d}",
            location_region=region,
            initial_trust_score=trust
        )
        users.append(user)
        print(f"    User {i+1}: {user.id} (Trust: {trust})")
    
    # Create events for each user
    print("\n2. Creating events for each user...")
    event_types = ['drought', 'flood', 'locust']
    events = []
    
    for i, (user, event_type) in enumerate(zip(users, event_types)):
        event_data = {
            'user_id': user.id,
            'event_type': event_type,
            'description': f'Demo {event_type} event from {user.location_region}',
            'latitude': 3.0 + i * 0.5,
            'longitude': 35.0 + i * 0.5,
            'photo_path': None
        }
        
        result = await event_service.submit_event(event_data)
        events.append(result['event_id'])
        print(f"    Event {i+1}: {event_type} by {user.id}")
    
    # Verify all events
    print("\n3. Verifying all events...")
    verified_count = 0
    for i, event_id in enumerate(events):
        try:
            result = await event_service.verify_event_with_metta(event_id)
            if result['verified']:
                verified_count += 1
                print(f"   ✅ Event {i+1}: VERIFIED")
            else:
                print(f"   ❌ Event {i+1}: FAILED")
        except Exception as e:
            print(f"   ⚠️ Event {i+1}: Error - {str(e)}")
    
    print(f"\n    Verification Summary: {verified_count}/{len(events)} events verified")
    
    # Final statistics
    print("\n4. Final system statistics...")
    all_users = await user_service.get_all_users()
    all_events = await event_service.get_all_events()
    stats = await event_service.get_event_statistics()
    
    print(f"    Total Users: {len(all_users)}")
    print(f"    Total Events: {len(all_events)}")
    print(f"   ✅ Verified Events: {stats['verified_events']}")
    print(f"    Total Payouts: {stats['total_payout_amount']} ETH")

async def main():
    """Main demo function"""
    print(" Climate Witness Chain - Service Integration Demo")
    print("=" * 80)
    
    try:
        # Initialize database
        print(" Initializing database...")
        await init_db()
        
        # Run service demos
        user = await demo_user_service()
        event_id = await demo_event_service(user)
        await demo_metta_service(user, event_id)
        await demo_service_integration()
        
        print("\n Service Integration Demo Complete!")
        print("All services are working together with MeTTa integration")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())