"""
Community Verification Service for News Integrity DAO
Handles community-based verification, consensus mechanisms, and verifier management
"""

import uuid
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.services.metta_service import MeTTaService
from app.database import crud
from app.database.models import Event, User, MeTTaAtom

class CommunityVerificationService:
    """Service for managing community-based event verification"""
    
    def __init__(self, db_path: str = "./news_integrity.db"):
        self.db_path = db_path
        self.metta_service = MeTTaService(db_path)
        from app.database import crud as db_crud
        self.crud = db_crud
        
    async def assign_verifiers(self, event_id: str, max_verifiers: int = 5) -> List[str]:
        """Assign community verifiers to an event using MeTTa logic"""
        try:
            event = await crud.get_event_by_id(event_id)
            if not event:
                raise ValueError("Event not found")
            regional_users = await self._get_regional_users(event.latitude, event.longitude, radius_km=100)
            eligible_verifiers = []
            for user in regional_users:
                if hasattr(user, 'id') and user.id == event.user_id:
                    continue
                eligibility_result = await self.metta_service.community_verify_event(event_id, user.id)
                if eligibility_result.get('eligible', False):
                    eligible_verifiers.append(user.id)
            selected_verifiers = await self._select_best_verifiers(eligible_verifiers, max_verifiers)
            for verifier_id in selected_verifiers:
                await self._create_verification_assignment(event_id, verifier_id)
            return selected_verifiers
        except Exception as e:
            print(f"Error assigning verifiers: {e}")
            return []
    
    async def submit_verification(self, event_id: str, verifier_id: str, verification_data: dict) -> dict:
        """Submit a community verification result"""
        try:
            # Validate verifier eligibility
            eligibility_result = await self.metta_service.community_verify_event(event_id, verifier_id)
            if not eligibility_result.get('eligible', False):
                return {
                    'success': False,
                    'error': 'Verifier not eligible for this event'
                }

            # Extract verification details
            verification_result = verification_data.get('verified', False)
            confidence_level = verification_data.get('confidence', 0.5)
            evidence_provided = verification_data.get('evidence', [])
            reasoning = verification_data.get('reasoning', '')

            # Get verifier weight from MeTTa
            verifier_weight = await self._get_verifier_weight(verifier_id)

            # Store verification in database
            verification_record = {
                'id': str(uuid.uuid4()),
                'event_id': event_id,
                'verifier_id': verifier_id,
                'verification_result': verification_result,
                'confidence_level': confidence_level,
                'evidence_provided': evidence_provided,
                'reasoning': reasoning,
                'verifier_weight': verifier_weight,
                'timestamp': datetime.now().isoformat()
            }

            # Add verification atoms to MeTTa knowledge base
            verification_atoms = self._create_verification_atoms(verification_record)
            for atom in verification_atoms:
                self.metta_service.add_to_atom_space('trust', atom)

            atom = MeTTaAtom(
                id=verification_record['id'],
                event_id=event_id,
                atom_type='community_verification',
                atom_content=json.dumps(verification_record),
                created_at=datetime.now()
            )
            await self.crud.create_atom(atom)

            # Check if consensus is reached
            consensus_result = await self._check_consensus(event_id)
            event = await crud.get_event_by_id(event_id)
            # Update trust score based on verification
            await self._update_verifier_trust_score(verifier_id, verification_result, consensus_result)

            return {
                'success': True,
                'verification_id': verification_record['id'],
                'consensus_reached': consensus_result.get('consensus_reached', False),
                'consensus_result': consensus_result.get('result'),
                'total_verifications': consensus_result.get('total_verifications', 0)
            }
        except Exception as e:
            print(f"Error submitting verification: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_verification_assignments(self, verifier_id: str) -> List[dict]:
        """Get pending verification assignments for a verifier"""
        try:
            # Query MeTTa for assignments
            assignments_query = f'(verification-assignment {verifier_id} $event-id $status)'
            assignments = self.metta_service.query_atom_space('identity', assignments_query)
            
            # Get event details for each assignment
            assignment_details = []
            for assignment in assignments:
                # Extract event ID from assignment
                # This is a simplified extraction - in practice, you'd parse the MeTTa result
                event_id = str(assignment).split()[2] if len(str(assignment).split()) > 2 else None
                if event_id:
                    event = await crud.get_event_by_id(event_id.strip('"()'))
                    if event:
                        assignment_details.append({
                            'event_id': event.id,
                            'event_type': event.event_type,
                            'description': event.description,
                            'location': {'latitude': event.latitude, 'longitude': event.longitude},
                            'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                            'photo_path': event.photo_path,
                            'assigned_at': datetime.now().isoformat(),  # Placeholder
                            'deadline': (datetime.now() + timedelta(days=3)).isoformat()
                        })
            
            return assignment_details
            
        except Exception as e:
            print(f"Error getting verification assignments: {e}")
            return []
    
    async def get_consensus_status(self, event_id: str) -> dict:
        """Get current consensus status for an event"""
        try:
            # Use MeTTa to calculate consensus
            consensus_result = await self.metta_service.community_verify_event(event_id, "consensus_check")
            
            # Get all verifications for this event
            verifications = await self._get_event_verifications(event_id)
            
            # Calculate consensus metrics
            total_verifications = len(verifications)
            positive_verifications = sum(1 for v in verifications if v.get('verification_result', False))
            negative_verifications = total_verifications - positive_verifications
            
            # Calculate weighted consensus
            total_weight = sum(v.get('verifier_weight', 1.0) for v in verifications)
            positive_weight = sum(v.get('verifier_weight', 1.0) for v in verifications if v.get('verification_result', False))
            
            consensus_ratio = positive_weight / total_weight if total_weight > 0 else 0
            consensus_reached = consensus_ratio >= 0.7 and total_verifications >= 3
            
            return {
                'event_id': event_id,
                'consensus_reached': consensus_reached,
                'consensus_ratio': consensus_ratio,
                'total_verifications': total_verifications,
                'positive_verifications': positive_verifications,
                'negative_verifications': negative_verifications,
                'total_weight': total_weight,
                'positive_weight': positive_weight,
                'required_consensus': 0.7,
                'minimum_verifications': 3,
                'final_result': 'verified' if consensus_reached and consensus_ratio >= 0.7 else 'pending'
            }
            
        except Exception as e:
            print(f"Error getting consensus status: {e}")
            return {
                'event_id': event_id,
                'error': str(e),
                'consensus_reached': False
            }
    
    async def get_verifier_stats(self, verifier_id: str) -> dict:
        """Get verification statistics for a verifier"""
        try:
            # Get verifier details
            verifier = await self.crud.get_user_by_id(verifier_id)
            if not verifier:
                return {'error': 'Verifier not found'}
            
            # Get verification history
            verifications = await self._get_verifier_history(verifier_id)
            
            # Calculate statistics
            total_verifications = len(verifications)
            correct_verifications = sum(1 for v in verifications if v.get('was_correct', False))
            accuracy = correct_verifications / total_verifications if total_verifications > 0 else 0
            
            # Get trust score from MeTTa
            trust_result = await self.metta_service.calculate_advanced_trust_score(verifier_id)
            current_trust_score = trust_result.get('trust_score', verifier.trust_score)
            
            verifier = await crud.get_user_by_id(verifier_id)
            verifier_weight = await self._get_verifier_weight(verifier_id)
            
            return {
                'verifier_id': verifier_id,
                'trust_score': current_trust_score,
                'verifier_weight': verifier_weight,
                'total_verifications': total_verifications,
                'correct_verifications': correct_verifications,
                'accuracy': accuracy,
                'recent_activity': verifications[-10:] if verifications else [],
                'status': 'active' if accuracy >= 0.7 else 'probation' if accuracy >= 0.5 else 'suspended'
            }
            
        except Exception as e:
            print(f"Error getting verifier stats: {e}")
            return {'error': str(e)}
    
    # Private helper methods
    
    async def _get_regional_users(self, latitude: float, longitude: float, radius_km: float = 100) -> List[User]:
        """Get users within a geographic radius"""
        # This is a simplified implementation
        # In practice, you'd use spatial queries or geographic indexing
        all_users = await self.crud.get_all_users()
        regional_users = []
        
        for user in all_users:
            # For now, just return all users - in practice, implement distance calculation
            regional_users.append(user)
        
        return regional_users
    
    async def _select_best_verifiers(self, eligible_verifiers: List[str], max_count: int) -> List[str]:
        """Select the best verifiers based on trust score and availability"""
        verifier_scores = []
        
        for verifier_id in eligible_verifiers:
            user = await self.crud.get_user_by_id(verifier_id)
            if user:
                all_users = await crud.get_all_users()
                trust_score = user.trust_score
                recent_verifications = len(await self._get_recent_verifications(verifier_id))
                availability_score = max(0, 10 - recent_verifications)  # Prefer less busy verifiers
                
                selection_score = trust_score + availability_score
                verifier_scores.append((verifier_id, selection_score))
        
        # Sort by score and select top verifiers
        verifier_scores.sort(key=lambda x: x[1], reverse=True)
        return [verifier_id for verifier_id, _ in verifier_scores[:max_count]]
    
    async def _create_verification_assignment(self, event_id: str, verifier_id: str):
        """Create a verification assignment"""
        user = await crud.get_user_by_id(verifier_id)
        assignment_atom = f'(verification-assignment {verifier_id} {event_id} "pending")'
        self.metta_service.add_to_atom_space('identity', assignment_atom)
    
    async def _get_verifier_weight(self, verifier_id: str) -> float:
        """Get verifier weight from MeTTa logic"""
        try:
            # Query MeTTa for verifier weight
            weight_query = f'(verifier-weight {verifier_id} $weight)'
            weight_result = self.metta_service.query_atom_space('identity', weight_query)

            if weight_result:
                # Extract weight from result (simplified)
                return 1.0  # Default weight

            # Calculate weight based on trust score
            user = await self.crud.get_user_by_id(verifier_id)
            if user:
                trust_score = user.trust_score
                if trust_score >= 90:
                    return 2.0
                elif trust_score >= 80:
                    return 1.5
                elif trust_score >= 70:
                    return 1.2
                elif trust_score >= 60:
                    return 1.0
                else:
                    return 0.5

            return 1.0
        except Exception as e:
            print(f"Error getting verifier weight: {e}")
            return 1.0
    
    def _create_verification_atoms(self, verification_record: dict) -> List[str]:
        """Create MeTTa atoms for verification record"""
        atoms = []
        
        # Main verification atom
        verification_atom = f'(verification "{verification_record["event_id"]}" {verification_record["verifier_id"]} {verification_record["verification_result"]} {verification_record["verifier_weight"]})'
        atoms.append(verification_atom)
        
        # Confidence atom
        confidence_atom = f'(verification-confidence "{verification_record["event_id"]}" {verification_record["verifier_id"]} {verification_record["confidence_level"]})'
        atoms.append(confidence_atom)
        
        # Timestamp atom
        timestamp_atom = f'(verification-timestamp "{verification_record["event_id"]}" {verification_record["verifier_id"]} "{verification_record["timestamp"]}")'
        atoms.append(timestamp_atom)
        
        return atoms
    
    async def _check_consensus(self, event_id: str) -> dict:
        """Check if consensus is reached for an event"""
        try:
            # Use MeTTa to calculate consensus
            consensus_result = await self.metta_service.community_verify_event(event_id, "consensus_check")
            
            # Get verification count
            verifications = await self._get_event_verifications(event_id)
            total_verifications = len(verifications)
            
            # Determine if consensus is reached
            consensus_reached = total_verifications >= 3 and consensus_result.get('verified', False)
            
            return {
                'consensus_reached': consensus_reached,
                'result': 'verified' if consensus_reached else 'pending',
                'total_verifications': total_verifications
            }
            
        except Exception as e:
            print(f"Error checking consensus: {e}")
            return {
                'consensus_reached': False,
                'result': 'error',
                'total_verifications': 0
            }
    
    async def _update_verifier_trust_score(self, verifier_id: str, verification_result: bool, consensus_result: dict):
        """Update verifier trust score based on verification accuracy"""
        try:
            if consensus_result.get('consensus_reached', False):
                # Determine if verification was correct
                consensus_verified = consensus_result.get('result') == 'verified'
                was_correct = verification_result == consensus_verified
                
                # Update trust score
                delta = 3 if was_correct else -2
                await self.crud.update_user_trust_score(verifier_id, delta)
                
                # Add trust update atom to MeTTa
                trust_update_atom = f'(trust-score-update {verifier_id} {delta} "verification-feedback")'
                self.metta_service.add_to_atom_space('identity', trust_update_atom)
                
        except Exception as e:
            print(f"Error updating verifier trust score: {e}")
    
    async def _get_event_verifications(self, event_id: str) -> List[dict]:
        """Get all verifications for an event"""
        try:
            # Query database for verification atoms
            atoms = await self.crud.get_atoms_by_event(event_id)
            verifications = []
            for atom in atoms:
                if atom.atom_type == 'community_verification':
                    verification_data = json.loads(atom.atom_content)
                    verifications.append(verification_data)
            return verifications
        except Exception as e:
            print(f"Error getting event verifications: {e}")
            return []
    
    async def _get_verifier_history(self, verifier_id: str) -> List[dict]:
        """Get verification history for a verifier"""
        try:
            # This is a simplified implementation
            # In practice, you'd query the database for all verifications by this verifier
            return []
        except Exception as e:
            print(f"Error getting verifier history: {e}")
            return []
    
    async def _get_recent_verifications(self, verifier_id: str, days: int = 7) -> List[dict]:
        """Get recent verifications by a verifier"""
        try:
            # This is a simplified implementation
            return []
            
        except Exception as e:
            print(f"Error getting recent verifications: {e}")
            return []
