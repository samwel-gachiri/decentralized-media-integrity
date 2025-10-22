#!/usr/bin/env python3
"""
Test script to check MeTTa service return values
"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app.services.metta_service import MeTTaService

def test_metta_service():
    """Test MeTTa service functions and their return values"""

    print("🔬 Testing MeTTa Service Return Values")
    print("=" * 50)

    # Initialize service
    service = MeTTaService()
    print("✅ MeTTaService initialized")

    # Test 1: get_knowledge_base_state
    print("\n📊 Testing get_knowledge_base_state():")
    try:
        state = service.get_knowledge_base_state()
        print(f"Return type: {type(state)}")
        print(f"Keys: {list(state.keys()) if isinstance(state, dict) else 'Not a dict'}")
        print(f"Sample content: {state}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: query_knowledge_base
    print("\n🔍 Testing query_knowledge_base():")
    try:
        results = service.query_knowledge_base("(user $x)", "identity")
        print(f"Return type: {type(results)}")
        print(f"Length: {len(results)}")
        print(f"Sample results: {results[:3] if results else 'Empty'}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: query_atom_space
    print("\n🔍 Testing query_atom_space():")
    try:
        results = service.query_atom_space("identity", "(user $x)")
        print(f"Return type: {type(results)}")
        print(f"Length: {len(results)}")
        if results:
            print(f"First result type: {type(results[0])}")
            print(f"First result keys: {list(results[0].keys()) if isinstance(results[0], dict) else 'Not a dict'}")
            print(f"Sample result: {results[0]}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 4: update_trust_score
    print("\n📈 Testing update_trust_score():")
    try:
        result = service.update_trust_score("test_user", 5)
        print(f"Return type: {type(result)}")
        print(f"Return value: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 5: add_to_atom_space
    print("\n➕ Testing add_to_atom_space():")
    try:
        result = service.add_to_atom_space("identity", "(test-atom test-value)")
        print(f"Return type: {type(result)}")
        print(f"Return value: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")

    print("\n🎯 Test completed!")

if __name__ == "__main__":
    test_metta_service()