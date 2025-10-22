from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.services.user_service import UserService

router = APIRouter()

# Global user service instance
user_service = UserService()

class CreateUserRequest(BaseModel):
    wallet_address: str
    location_region: Optional[str] = None
    initial_trust_score: Optional[int] = 50

class UpdateTrustScoreRequest(BaseModel):
    delta: int
    reason: Optional[str] = "Manual adjustment"

@router.post("/")
async def create_user(request: CreateUserRequest, crud = None):
    """Create a new user"""
    try:
        user = await user_service.create_user(
            wallet_address=request.wallet_address,
            location_region=request.location_region,
            initial_trust_score=request.initial_trust_score or 50
        )
        
        return {
            "message": "User created successfully",
            "user": user.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.get("/")
async def get_all_users(crud = None):
    """Get all users"""
    users = await user_service.get_all_users()
    return {
        "total_users": len(users),
        "users": [user.to_dict() for user in users]
    }

@router.get("/wallet/{wallet_address}")
async def get_user_by_wallet(wallet_address: str, crud = None):
    """Get user by wallet address"""
    user = await user_service.get_user_by_wallet(wallet_address)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user": user.to_dict()}

@router.get("/{user_id}")
async def get_user(user_id: str, crud = None):
    """Get user by ID"""
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user": user.to_dict()}

@router.get("/{user_id}/stats")
async def get_user_stats(user_id: str, crud = None):
    """Get comprehensive user statistics"""
    stats = await user_service.get_user_stats(user_id)
    if not stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"stats": stats}

@router.get("/{user_id}/history")
async def get_user_history(user_id: str, crud = None):
    """Get user's verification history"""
    history = await user_service.get_user_verification_history(user_id)
    
    return {
        "user_id": user_id,
        "total_events": len(history),
        "history": history
    }

@router.put("/{user_id}/trust-score")
async def update_trust_score(
    user_id: str, 
    request: UpdateTrustScoreRequest, 
    crud = None
):
    """Update user trust score"""
    success = await user_service.update_trust_score(
        user_id, 
        request.delta, 
        request.reason or "Manual adjustment"
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get updated user
    user = await user_service.get_user_by_id(user_id)
    
    return {
        "message": "Trust score updated successfully",
        "user": user.to_dict() if user else None
    }

@router.get("/region/{region}")
async def get_users_by_region(region: str, crud = None):
    """Get users in a specific region"""
    users = await user_service.get_users_by_region(region)
    
    return {
        "region": region,
        "total_users": len(users),
        "users": [user.to_dict() for user in users]
    }

@router.get("/trust/high")
async def get_high_trust_users(
    min_trust: Optional[int] = 80, 
    crud = None
):
    """Get users with high trust scores"""
    users = await user_service.get_high_trust_users(min_trust or 80)
    
    return {
        "min_trust_score": min_trust,
        "total_users": len(users),
        "users": [user.to_dict() for user in users]
    }

@router.post("/get-or-create")
async def get_or_create_user(request: CreateUserRequest, crud = None):
    """Get existing user or create new one"""
    try:
        user = await user_service.get_or_create_user(
            wallet_address=request.wallet_address,
            location_region=request.location_region
        )
        
        return {
            "message": "User retrieved or created successfully",
            "user": user.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get or create user: {str(e)}")

@router.post("/{user_id}/verification-feedback")
async def process_verification_feedback(
    user_id: str,
    event_verified: bool,
    consensus_score: Optional[float] = 1.0,
    crud = None
):
    """Process verification feedback to adjust trust score"""
    success = await user_service.process_verification_feedback(
        user_id, 
        event_verified, 
        consensus_score or 1.0
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Verification feedback processed successfully",
        "event_verified": event_verified,
        "consensus_score": consensus_score
    }