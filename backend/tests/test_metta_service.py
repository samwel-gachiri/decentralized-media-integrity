"""
Unit tests for MeTTa Service
"""

import pytest
import asyncio
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.metta_service import NewsIntegrityKnowledgeBase, MeTTaService
from app.database.models import User, Event
from app.database.migrations import create_tables

class TestNewsIntegrityKnowledgeBase:
    """Test MeTTa Knowledge Base functionality"""
    
    def setup_method(self):
        """Set up test environment"""
        self.kb = NewsIntegrityKnowledgeBase()
    
    def test_knowledge_base_initialization(self):
        """Test that knowledge base initializes correctly"""
        assert self.kb.metta is not None
        assert len(self.kb.verification_history) == 0
        
        # Test base knowledge loading
        state = self.kb.get_knowledge_base_state()
        assert state['base_knowledge_loaded'] is True
        assert state['verification_rules_loaded'] is True
    
    def test_create_user_atoms(self):
        """Test user atom creation"""
        user = User(
            id="test-user-001",
            wallet_address="0x1234567890123456789012345678901234567890",
            trust_score=75,
            location_region="Test Region",
            created_at=datetime.now()
        )
        
        atoms = self.kb.create_user_atoms(user)
        
        assert len(atoms) == 4  # user, location, trust-score, wallet-address
        assert "(user test-user-001)" in atoms
        assert "(trust-score test-user-001 75)" in atoms
        assert "(location test-user-001 \"Test Region\")" in atoms
        assert "(wallet-address test-user-001 \"0x1234567890123456789012345678901234567890\")" in atoms
    
    def test_create_event_atoms(self):
        """Test event atom creation"""
        user = User(
            id="test-user-001",
            wallet_address="0x1234567890123456789012345678901234567890",
            trust_score=75,
            location_region="Test Region"
        )
        
        event = Event(
            id="test-event-001",
            user_id="test-user-001",
            event_type="drought",
            description="Test drought event",
            latitude=1.2345,
            longitude=35.6789,
            photo_path="test/photo.jpg",
            timestamp=datetime.now()
        )
        
        atoms, event_id = self.kb.create_event_atoms(event, user)
        
        assert len(atoms) >= 6  # event, reports, event-type, timestamp, gps-coords, evidence-link, etc.
        assert f"(event {event_id})" in atoms
        assert f"(reports test-user-001 {event_id})" in atoms
        assert f"(event-type {event_id} drought)" in atoms
        assert f"(gps-coords {event_id} (1.2345 35.6789))" in atoms
        assert f"(evidence-link {event_id} \"test/photo.jpg\")" in atoms
    
    def test_verification_logic(self):
        """Test MeTTa verification logic"""
        user = User(
            id="test-user-001",
            trust_score=75,  # Above threshold
            location_region="Test Region"
        )
        
        event = Event(
            id="test-event-001",
            user_id="test-user-001",
            event_type="drought",
            latitude=1.2345,
            longitude=35.6789,
            photo_path="test/photo.jpg",
            timestamp=datetime.now()
        )
        
        user_atoms = self.kb.create_user_atoms(user)
        event_atoms, event_id = self.kb.create_event_atoms(event, user)
        
        # Run verification
        result = self.kb.run_verification(event_atoms, user_atoms, event_id, user.id)
        
        assert 'verified' in result
        assert 'reasoning' in result
        assert 'event_id' in result
        assert result['event_id'] == event_id
        assert len(result['reasoning']) > 0
    
    def test_payout_calculation(self):
        """Test payout calculation logic"""
        # This test will verify payout calculation once atoms are in the knowledge base
        # For now, we'll test the method exists and handles errors gracefully
        result = self.kb.calculate_payout("nonexistent_event")
        assert result is None
    
    def test_query_knowledge_base(self):
        """Test knowledge base querying"""
        # Test basic query
        results = self.kb.query_knowledge_base("(climate-event-type $type)")
        assert isinstance(results, list)
        
        # Test invalid query handling
        results = self.kb.query_knowledge_base("invalid query syntax")
        assert isinstance(results, list)
        assert len(results) > 0  # Should contain error info
    
    def test_impact_severity_determination(self):
        """Test impact and severity determination"""
        drought_event = Event(id="1", user_id="1", event_type="drought")
        flood_event = Event(id="2", user_id="1", event_type="flood")
        locust_event = Event(id="3", user_id="1", event_type="locust")
        heat_event = Event(id="4", user_id="1", event_type="extreme_heat")
        
        drought_impact, drought_severity = self.kb._determine_impact_severity(drought_event)
        assert drought_impact == "Livestock_Risk"
        assert drought_severity == "High"
        
        flood_impact, flood_severity = self.kb._determine_impact_severity(flood_event)
        assert flood_impact == "Infrastructure_Damage"
        assert flood_severity == "Medium"
        
        locust_impact, locust_severity = self.kb._determine_impact_severity(locust_event)
        assert locust_impact == "Crop_Failure"
        assert locust_severity == "High"
        
        heat_impact, heat_severity = self.kb._determine_impact_severity(heat_event)
        assert heat_impact == "Water_Scarcity"
        assert heat_severity == "Medium"


class TestMeTTaService:
    """Test MeTTa Service integration"""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Set up test database"""
        self.test_db_path = "./test_news_integrity.db"
        
        # Remove existing test database
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)
        
        # Create test database
        await create_tables(self.test_db_path)
        
        # Initialize service
        self.service = MeTTaService(self.test_db_path)
        
        yield
        
        # Cleanup
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.knowledge_base is not None
        assert self.service.crud is not None
    
    def test_atom_type_determination(self):
        """Test atom type determination"""
        assert self.service._determine_atom_type("(user test-user)") == "user"
        assert self.service._determine_atom_type("(event test-event)") == "event"
        assert self.service._determine_atom_type("(location user region)") == "location"
        assert self.service._determine_atom_type("(evidence-link event link)") == "evidence"
        assert self.service._determine_atom_type("(impact event impact)") == "impact"
        assert self.service._determine_atom_type("(verified event)") == "verification"
        assert self.service._determine_atom_type("(other-atom data)") == "other"


def run_tests():
    """Run all MeTTa tests"""
    print(" Running MeTTa Service Tests")
    print("=" * 50)
    
    # Run knowledge base tests
    kb_test = TestNewsIntegrityKnowledgeBase()
    kb_test.setup_method()
    
    try:
        kb_test.test_knowledge_base_initialization()
        print("✅ Knowledge base initialization test passed")
        
        kb_test.test_create_user_atoms()
        print("✅ User atoms creation test passed")
        
        kb_test.test_create_event_atoms()
        print("✅ Event atoms creation test passed")
        
        kb_test.test_verification_logic()
        print("✅ Verification logic test passed")
        
        kb_test.test_payout_calculation()
        print("✅ Payout calculation test passed")
        
        kb_test.test_query_knowledge_base()
        print("✅ Knowledge base query test passed")
        
        kb_test.test_impact_severity_determination()
        print("✅ Impact/severity determination test passed")
        
        print("\n All MeTTa tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        raise


if __name__ == "__main__":
    run_tests()
