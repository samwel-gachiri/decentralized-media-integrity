"""
User Service for Climate Witness Chain
Handles user management, trust scores, wallet integration, and MeTTa user representation
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.database import crud
from app.database.models import User

class UserService:
    """Service for handling user operations"""
    
    def __init__(self, db_path: str = "./news_integrity.db"):
        self.db_path = db_path
    
    async def create_user(
        self, 
        wallet_address: str, 
        location_region: Optional[str] = None,
        initial_trust_score: int = 50
    ) -> User:
        """Create a new user with wallet address and MeTTa representation"""
        user_id = f"user-{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id,
            wallet_address=wallet_address,
            trust_score=initial_trust_score,
            location_region=location_region,
            created_at=datetime.now()
        )
        success = await crud.create_user(user)
        if not success:
            raise ValueError("Failed to create user - wallet address may already exist")
        # Create MeTTa atoms for the new user
        await self._create_user_metta_atoms(user)
        return user
    
    async def _create_user_metta_atoms(self, user: User) -> List[str]:
        """Create MeTTa atoms for a user and store them"""
        try:
            from app.services.metta_service import MeTTaService
            from app.database.models import MeTTaAtom
            import json
            
            metta_service = MeTTaService(self.db_path)
            
            # Create user atoms using the MeTTa service
            user_atoms = metta_service.knowledge_base.create_user_atoms(user)
            
            # Store atoms in database
            for i, atom_content in enumerate(user_atoms):
                atom_type = self._determine_atom_type(atom_content)
                
                atom = MeTTaAtom(
                    id=str(uuid.uuid4()),
                    event_id=None,  # User atoms are not tied to specific events
                    atom_type=atom_type,
                    atom_content=json.dumps({
                        'atom': atom_content,
                        'user_id': user.id,
                        'context': 'user_registration'
                    }),
                    created_at=datetime.now()
                )
                
                await crud.create_atom(atom)
            
            print(f"✅ Created {len(user_atoms)} MeTTa atoms for user {user.id}")
            return user_atoms
            
        except Exception as e:
            print(f"⚠️ Warning: Failed to create MeTTa atoms for user {user.id}: {str(e)}")
            return []
    
    def _determine_atom_type(self, atom_content: str) -> str:
        """Determine atom type from content"""
        if atom_content.startswith('(user '):
            return 'user'
        elif atom_content.startswith('(trust-score '):
            return 'trust_score'
        elif atom_content.startswith('(location '):
            return 'location'
        elif atom_content.startswith('(wallet-address '):
            return 'wallet'
        else:
            return 'user_other'
    
    async def get_user_by_wallet(self, wallet_address: str) -> Optional[User]:
        """Get user by wallet address"""
        return await crud.get_user_by_wallet(wallet_address)
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return await crud.get_user_by_id(user_id)
    
    async def get_or_create_user(
        self, 
        wallet_address: str, 
        location_region: Optional[str] = None
    ) -> User:
        """Get existing user or create new one"""
        user = await self.get_user_by_wallet(wallet_address)
        if user:
            return user
        
        return await self.create_user(wallet_address, location_region)
    
    async def update_trust_score(
        self, 
        user_id: str, 
        delta: int, 
        reason: str = "Manual adjustment"
    ) -> bool:
        """Update user trust score with bounds checking"""
        user = await crud.get_user_by_id(user_id)
        if not user:
            return False
        new_score = max(0, min(100, user.trust_score + delta))
        success = await crud.update_user_trust_score(user_id, new_score)
        if success:
            print(f" Trust score updated for {user_id}: {user.trust_score} → {new_score} ({reason})")
        return success
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        user = await crud.get_user_by_id(user_id)
        if not user:
            return {}
        # Get user's events
        events = await crud.get_events_by_user(user_id)
        # Calculate statistics
        total_events = len(events)
        verified_events = len([e for e in events if e.verification_status == 'verified'])
        total_payouts = sum(e.payout_amount or 0 for e in events)
        # Event type breakdown
        event_types = {}
        for event in events:
            event_types[event.event_type] = event_types.get(event.event_type, 0) + 1
        return {
            'user_id': user_id,
            'wallet_address': user.wallet_address,
            'trust_score': user.trust_score,
            'location_region': user.location_region,
            'member_since': user.created_at.isoformat() if user.created_at else None,
            'total_events': total_events,
            'verified_events': verified_events,
            'verification_rate': verified_events / total_events if total_events > 0 else 0,
            'total_payouts': total_payouts,
            'event_types': event_types,
            'trust_level': self._get_trust_level(user.trust_score)
        }
    
    def _get_trust_level(self, trust_score: int) -> str:
        """Get trust level description"""
        if trust_score >= 90:
            return "Excellent"
        elif trust_score >= 80:
            return "High"
        elif trust_score >= 60:
            return "Good"
        elif trust_score >= 40:
            return "Fair"
        else:
            return "Low"
    
    async def get_all_users(self) -> List[User]:
        """Get all users"""
        return await crud.get_all_users()
    
    async def get_users_by_region(self, region: str) -> List[User]:
        """Get users in a specific region"""
        all_users = await self.get_all_users()
        return [user for user in all_users if user.location_region == region]
    
    async def get_high_trust_users(self, min_trust: int = 80) -> List[User]:
        """Get users with high trust scores"""
        all_users = await self.get_all_users()
        return [user for user in all_users if user.trust_score >= min_trust]
    
    async def calculate_trust_adjustment(
        self, 
        user_id: str, 
        verification_accuracy: float
    ) -> int:
        """Calculate trust score adjustment based on verification accuracy"""
        if verification_accuracy >= 0.9:
            return 5  # Excellent accuracy
        elif verification_accuracy >= 0.7:
            return 2  # Good accuracy
        elif verification_accuracy >= 0.5:
            return 0  # Average accuracy
        else:
            return -3  # Poor accuracy
    
    async def process_verification_feedback(
        self, 
        user_id: str, 
        event_verified: bool, 
        consensus_score: float = 1.0
    ) -> bool:
        """Process feedback from event verification to adjust trust score"""
        if event_verified:
            # Positive feedback - increase trust
            delta = int(2 * consensus_score)  # 1-2 points for verified events
            reason = f"Event verified (consensus: {consensus_score:.2f})"
        else:
            # Negative feedback - decrease trust
            delta = int(-3 * consensus_score)  # -1 to -3 points for rejected events
            reason = f"Event rejected (consensus: {consensus_score:.2f})"
        
        return await self.update_trust_score(user_id, delta, reason)
    
    async def get_user_verification_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's verification history with trust score changes"""
        events = await crud.get_events_by_user(user_id)
        history = []
        for event in events:
            history.append({
                'event_id': event.id,
                'event_type': event.event_type,
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'verification_status': event.verification_status,
                'payout_amount': event.payout_amount,
                'location': f"({event.latitude}, {event.longitude})" if event.latitude else None
            })
        return sorted(history, key=lambda x: x['timestamp'] or '', reverse=True)    
