"""
Simple DAO Governance API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.dao_governance_service import SimpleDAOService

router = APIRouter()
dao_service = SimpleDAOService()

class CreateProposalRequest(BaseModel):
    proposer_id: str
    title: str
    description: str
    requested_amount: float

class VoteRequest(BaseModel):
    proposal_id: str
    voter_id: str
    vote_choice: bool

@router.post("/create-proposal")
async def create_proposal(request: CreateProposalRequest, crud = None):
    result = await dao_service.create_funding_proposal(
        request.proposer_id, request.title, request.description, request.requested_amount
    )
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    return result

@router.post("/vote")
async def vote(request: VoteRequest, crud = None):
    result = await dao_service.vote_on_proposal(request.proposal_id, request.voter_id, request.vote_choice)
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    return result

@router.get("/proposals/active")
async def get_active_proposals(crud = None):
    return {"proposals": await dao_service.get_active_proposals()}

@router.get("/stats")
async def get_stats(crud = None):
    return await dao_service.get_dao_stats()

@router.post("/finalize/{proposal_id}")
async def finalize_proposal(proposal_id: str, crud = None):
    result = await dao_service.finalize_proposal(proposal_id)
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    return result

@router.post("/execute/{proposal_id}")
async def execute_proposal(proposal_id: str, crud = None):
    result = await dao_service.execute_proposal(proposal_id)
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    return result