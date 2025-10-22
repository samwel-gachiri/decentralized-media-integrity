from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import json

@dataclass
class User:
    """User model for climate event reporters with authentication support"""
    id: str
    email: str
    password_hash: str
    first_name: str
    last_name: str
    role: str = 'user'  # 'user' or 'researcher'
    wallet_address: Optional[str] = None
    trust_score: int = 50
    location_region: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        data = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'wallet_address': self.wallet_address,
            'trust_score': self.trust_score,
            'location_region': self.location_region,
            'profile_image': self.profile_image,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
            
        return data
    
    def to_public_dict(self) -> dict:
        """Return user data safe for public consumption"""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'trust_score': self.trust_score,
            'location_region': self.location_region,
            'profile_image': self.profile_image,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

@dataclass
class Event:
    """Climate event model"""
    id: str
    user_id: str
    event_type: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_path: Optional[str] = None
    timestamp: Optional[datetime] = None
    verification_status: str = 'pending'
    smart_contract_tx_hash: Optional[str] = None
    payout_amount: Optional[float] = None
    created_at: datetime = datetime.now() 
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'description': self.description,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'photo_path': self.photo_path,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'verification_status': self.verification_status,
            'smart_contract_tx_hash': self.smart_contract_tx_hash,
            'payout_amount': self.payout_amount,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

@dataclass
class MeTTaAtom:
    """MeTTa knowledge atom model"""
    id: str
    event_id: str
    atom_type: str
    atom_content: str  # JSON string
    created_at: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'event_id': self.event_id,
            'atom_type': self.atom_type,
            'atom_content': self.atom_content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def get_content_as_dict(self) -> dict:
        """Parse atom content as dictionary"""
        try:
            return json.loads(self.atom_content)
        except json.JSONDecodeError:
            return {'raw_content': self.atom_content}

# User role constants
USER_ROLES = {
    'user': 'Normal User',
    'researcher': 'Researcher'
}

# Event type constants
EVENT_TYPES = {
    'drought': 'Drought',
    'flood': 'Flood', 
    'locust': 'Locust Sighting',
    'extreme_heat': 'Extreme Heat'
}

# Verification status constants
VERIFICATION_STATUS = {
    'pending': 'Pending',
    'verified': 'Verified',
    'rejected': 'Rejected',
    'manual_review': 'Manual Review Required'
}

# MeTTa atom types
ATOM_TYPES = {
    'user': 'User Atom',
    'location': 'Location Atom',
    'event': 'Event Atom',
    'evidence': 'Evidence Atom',
    'impact': 'Impact Atom',
    'verification': 'Verification Atom'
}