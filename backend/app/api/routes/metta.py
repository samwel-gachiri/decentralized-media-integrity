from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from app.services.metta_service import MeTTaService

router = APIRouter()

# Global MeTTa service instance
metta_service = MeTTaService()

@router.post("/atoms")
async def create_atoms(event_data: Dict, crud = None):
    """Create MeTTa knowledge atoms from event data"""
    try:
        if 'event_id' not in event_data:
            raise HTTPException(status_code=400, detail="event_id is required")
        
        atoms = await metta_service.create_atoms(event_data)
        
        return {
            "message": "MeTTa atoms created successfully",
            "event_id": event_data['event_id'],
            "atoms_created": len(atoms),
            "atoms": atoms
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create atoms: {str(e)}")

@router.post("/verify/{event_id}")
async def verify_event(event_id: str, crud = None):
    """Verify an event using MeTTa logic"""
    try:
        # Check if event exists
        event = await crud.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Run MeTTa verification
        is_verified = await metta_service.run_verification(event_id)
        
        # Get updated event
        updated_event = await crud.get_event_by_id(event_id)
        
        return {
            "message": f"MeTTa verification completed for event {event_id}",
            "event_id": event_id,
            "verified": is_verified,
            "verification_status": updated_event.verification_status,
            "payout_amount": updated_event.payout_amount,
            "event": updated_event.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.get("/atoms/{event_id}")
async def get_event_atoms(event_id: str, crud = None):
    """Get MeTTa atoms for a specific event"""
    atoms = await crud.get_atoms_by_event(event_id)
    return {
        "event_id": event_id,
        "atoms_count": len(atoms),
        "atoms": [atom.to_dict() for atom in atoms]
    }

@router.get("/atoms")
async def get_all_atoms(crud = None):
    """Get all MeTTa atoms"""
    atoms = await crud.get_all_atoms()
    return {
        "total_atoms": len(atoms),
        "atoms": [atom.to_dict() for atom in atoms]
    }

@router.get("/knowledge-base")
async def get_knowledge_base():
    """Get current state of the MeTTa knowledge base"""
    try:
        kb_state = metta_service.get_knowledge_base_state()
        
        return {
            "message": "MeTTa knowledge base state",
            "state": kb_state,
            "loaded_files": kb_state.get('loaded_metta_files', []),
            "knowledge_base_type": kb_state.get('knowledge_base_type', 'unknown'),
            "sample_knowledge": [
                "(climate-event-type Drought)",
                "(climate-event-type Flood)", 
                "(climate-event-type Locust)",
                "(climate-event-type ExtremeHeat)",
                "(min-trust-score 60)",
                "(max-trust-score 100)",
                "(impact-category Livestock_Risk)",
                "(impact-category Crop_Failure)",
                "(impact-category Infrastructure_Damage)",
                "(impact-category Water_Scarcity)"
            ],
            "sample_rules": [
                "(= (auto-verify $event $user) (and (evidence-link $event $link) (gps-coords $event $coords) (trust-score $user $score) (>= $score 60) (reports $user $event)) (verified $event))",
                "(= (payout-eligible $event $amount) (and (verified $event) (impact $event $impact-type) (severity $event $severity-level) (payout-amount $severity-level $amount)) (eligible-for-payout $event $amount))"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get knowledge base state: {str(e)}")

@router.post("/query")
async def query_knowledge_base(query_data: Dict):
    """Query the MeTTa knowledge base with custom queries"""
    try:
        if 'query' not in query_data:
            raise HTTPException(status_code=400, detail="query is required")
        
        results = metta_service.query_knowledge_base(query_data['query'])
        
        return {
            "query": query_data['query'],
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@router.get("/demo/verify-all")
async def demo_verify_all_events(crud = None):
    """Demo endpoint: Verify all pending events using MeTTa"""
    try:
        # Get all pending events
        all_events = await crud.get_all_events()
        pending_events = [e for e in all_events if e.verification_status == 'pending']
        
        verification_results = []
        
        for event in pending_events:
            try:
                is_verified = await metta_service.run_verification(event.id)
                verification_results.append({
                    'event_id': event.id,
                    'event_type': event.event_type,
                    'verified': is_verified
                })
            except Exception as e:
                verification_results.append({
                    'event_id': event.id,
                    'event_type': event.event_type,
                    'verified': False,
                    'error': str(e)
                })
        
        return {
            "message": f"Verified {len(pending_events)} pending events",
            "results": verification_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo verification failed: {str(e)}")