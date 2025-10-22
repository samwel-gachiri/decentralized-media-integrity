"""
Community Verification API Routes
Handles community-based verification endpoints for the News Integrity DAO
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.services.community_verification_service import CommunityVerificationService

router = APIRouter()

# Global community verification service instance
community_verification_service = CommunityVerificationService()

# Request/Response Models
class VerificationSubmissionRequest(BaseModel):
    event_id: str
    verifier_id: str
    verified: bool
    confidence: float = 0.5
    evidence: List[str] = []
    reasoning: str = ""

class VerifierAssignmentRequest(BaseModel):
    event_id: str
    max_verifiers: int = 5

class VerificationAssignment(BaseModel):
    event_id: str
    event_type: str
    description: str
    location: dict
    timestamp: Optional[str]
    photo_path: Optional[str]
    assigned_at: str
    deadline: str

class ConsensusStatus(BaseModel):
    event_id: str
    consensus_reached: bool
    consensus_ratio: float
    total_verifications: int
    positive_verifications: int
    negative_verifications: int
    final_result: str

@router.post("/assign-verifiers")
async def assign_verifiers(
    request: VerifierAssignmentRequest,
    crud = None
):
    """Assign community verifiers to an event"""
    try:
        verifier_ids = await community_verification_service.assign_verifiers(
            request.event_id,
            request.max_verifiers
        )
        
        if not verifier_ids:
            raise HTTPException(status_code=404, detail="No eligible verifiers found")
        
        return {
            "message": f"Assigned {len(verifier_ids)} verifiers to event",
            "event_id": request.event_id,
            "assigned_verifiers": verifier_ids,
            "total_assigned": len(verifier_ids)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign verifiers: {str(e)}")

@router.post("/submit-verification")
async def submit_verification(
    request: VerificationSubmissionRequest,
    crud = None
):
    """Submit a community verification result"""
    try:
        verification_data = {
            'verified': request.verified,
            'confidence': request.confidence,
            'evidence': request.evidence,
            'reasoning': request.reasoning
        }
        
        result = await community_verification_service.submit_verification(
            request.event_id,
            request.verifier_id,
            verification_data
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('error', 'Verification submission failed'))
        
        return {
            "message": "Verification submitted successfully",
            "verification_id": result.get('verification_id'),
            "consensus_reached": result.get('consensus_reached', False),
            "consensus_result": result.get('consensus_result'),
            "total_verifications": result.get('total_verifications', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit verification: {str(e)}")

@router.get("/assignments/{verifier_id}")
async def get_verification_assignments(
    verifier_id: str,
    crud = None
) -> List[VerificationAssignment]:
    """Get pending verification assignments for a verifier"""
    try:
        assignments = await community_verification_service.get_verification_assignments(verifier_id)
        
        return [
            VerificationAssignment(
                event_id=assignment['event_id'],
                event_type=assignment['event_type'],
                description=assignment['description'],
                location=assignment['location'],
                timestamp=assignment['timestamp'],
                photo_path=assignment['photo_path'],
                assigned_at=assignment['assigned_at'],
                deadline=assignment['deadline']
            )
            for assignment in assignments
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get assignments: {str(e)}")

@router.get("/consensus/{event_id}")
async def get_consensus_status(
    event_id: str,
    crud = None
) -> ConsensusStatus:
    """Get current consensus status for an event"""
    try:
        consensus = await community_verification_service.get_consensus_status(event_id)
        
        if 'error' in consensus:
            raise HTTPException(status_code=500, detail=consensus['error'])
        
        return ConsensusStatus(
            event_id=consensus['event_id'],
            consensus_reached=consensus['consensus_reached'],
            consensus_ratio=consensus['consensus_ratio'],
            total_verifications=consensus['total_verifications'],
            positive_verifications=consensus['positive_verifications'],
            negative_verifications=consensus['negative_verifications'],
            final_result=consensus['final_result']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get consensus status: {str(e)}")

@router.get("/verifier-stats/{verifier_id}")
async def get_verifier_stats(
    verifier_id: str,
    crud = None
):
    """Get verification statistics for a verifier"""
    try:
        stats = await community_verification_service.get_verifier_stats(verifier_id)
        
        if 'error' in stats:
            raise HTTPException(status_code=404, detail=stats['error'])
        
        return {
            "verifier_id": stats['verifier_id'],
            "trust_score": stats['trust_score'],
            "verifier_weight": stats['verifier_weight'],
            "total_verifications": stats['total_verifications'],
            "correct_verifications": stats['correct_verifications'],
            "accuracy": stats['accuracy'],
            "status": stats['status'],
            "recent_activity": stats['recent_activity']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get verifier stats: {str(e)}")

@router.get("/events/{event_id}/verifications")
async def get_event_verifications(
    event_id: str,
    crud = None
):
    """Get all verifications for a specific event"""
    try:
        # Get consensus status which includes verification details
        consensus = await community_verification_service.get_consensus_status(event_id)
        
        # Get detailed verification records
        verifications = await community_verification_service._get_event_verifications(event_id)
        
        return {
            "event_id": event_id,
            "consensus_status": consensus,
            "verifications": verifications,
            "total_verifications": len(verifications)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get event verifications: {str(e)}")

@router.post("/events/{event_id}/auto-assign")
async def auto_assign_verifiers(
    event_id: str,
    max_verifiers: int = 5,
    crud = None
):
    """Automatically assign verifiers to an event based on MeTTa logic"""
    try:
        verifier_ids = await community_verification_service.assign_verifiers(event_id, max_verifiers)
        
        if not verifier_ids:
            return {
                "message": "No eligible verifiers found for this event",
                "event_id": event_id,
                "assigned_verifiers": [],
                "total_assigned": 0
            }
        
        return {
            "message": f"Auto-assigned {len(verifier_ids)} verifiers",
            "event_id": event_id,
            "assigned_verifiers": verifier_ids,
            "total_assigned": len(verifier_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-assign verifiers: {str(e)}")

@router.get("/leaderboard")
async def get_verifier_leaderboard(
    limit: int = 20,
    crud = None
):
    """Get top verifiers leaderboard"""
    try:
        # Get all users and calculate their verification stats
        all_users = await crud.get_all_users()
        verifier_rankings = []
        
        for user in all_users:
            stats = await community_verification_service.get_verifier_stats(user.id)
            if not stats.get('error') and stats.get('total_verifications', 0) > 0:
                verifier_rankings.append({
                    'verifier_id': user.id,
                    'wallet_address': user.wallet_address,
                    'trust_score': stats['trust_score'],
                    'total_verifications': stats['total_verifications'],
                    'accuracy': stats['accuracy'],
                    'verifier_weight': stats['verifier_weight'],
                    'status': stats['status']
                })
        
        # Sort by trust score and accuracy
        verifier_rankings.sort(
            key=lambda x: (x['trust_score'], x['accuracy'], x['total_verifications']),
            reverse=True
        )
        
        return {
            "leaderboard": verifier_rankings[:limit],
            "total_verifiers": len(verifier_rankings)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

@router.post("/events/{event_id}/force-consensus")
async def force_consensus_check(
    event_id: str,
    crud = None
):
    """Force a consensus check for an event (admin function)"""
    try:
        consensus = await community_verification_service.get_consensus_status(event_id)
        
        if consensus.get('consensus_reached', False):
            # Update event status in database
            final_result = consensus.get('final_result', 'pending')
            status = 'verified' if final_result == 'verified' else 'rejected'
            
            await crud.update_event_verification(event_id, status, None, None)
            
            return {
                "message": f"Event {status} based on community consensus",
                "event_id": event_id,
                "consensus_ratio": consensus.get('consensus_ratio', 0),
                "total_verifications": consensus.get('total_verifications', 0),
                "final_status": status
            }
        else:
            return {
                "message": "Consensus not yet reached",
                "event_id": event_id,
                "consensus_ratio": consensus.get('consensus_ratio', 0),
                "total_verifications": consensus.get('total_verifications', 0),
                "required_verifications": 3,
                "required_consensus": 0.7
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to force consensus check: {str(e)}")

@router.get("/stats/overview")
async def get_verification_overview(crud = None):
    """Get overall community verification statistics"""
    try:
        # Get all events
        all_events = await crud.get_all_events()
        
        # Calculate statistics
        total_events = len(all_events)
        pending_verification = len([e for e in all_events if e.verification_status == 'pending'])
        community_verified = len([e for e in all_events if e.verification_status == 'verified'])
        rejected = len([e for e in all_events if e.verification_status == 'rejected'])
        
        # Get active verifiers
        all_users = await crud.get_all_users()
        active_verifiers = 0
        total_verifications = 0
        
        for user in all_users:
            stats = await community_verification_service.get_verifier_stats(user.id)
            if not stats.get('error') and stats.get('total_verifications', 0) > 0:
                active_verifiers += 1
                total_verifications += stats.get('total_verifications', 0)
        
        return {
            "total_events": total_events,
            "pending_verification": pending_verification,
            "community_verified": community_verified,
            "rejected": rejected,
            "active_verifiers": active_verifiers,
            "total_verifications": total_verifications,
            "average_verifications_per_event": total_verifications / total_events if total_events > 0 else 0,
            "verification_rate": (community_verified + rejected) / total_events if total_events > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get verification overview: {str(e)}")