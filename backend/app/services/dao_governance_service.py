"""
Simple DAO Governance Service for News Integrity DAO
Demonstrates community governance for climate relief funding
"""

import uuid
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from app.services.metta_service import MeTTaService
from app.database.crud import *
from app.database.models import MeTTaAtom

@dataclass
class SimpleProposal:
    """Simple DAO proposal for demonstration"""
    id: str
    proposer_id: str
    title: str
    description: str
    requested_amount: float
    status: str  # active, approved, rejected, executed
    votes_yes: int
    votes_no: int
    created_at: datetime
    voting_deadline: datetime
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'proposer_id': self.proposer_id,
            'title': self.title,
            'description': self.description,
            'requested_amount': self.requested_amount,
            'status': self.status,
            'votes_yes': self.votes_yes,
            'votes_no': self.votes_no,
            'created_at': self.created_at.isoformat(),
            'voting_deadline': self.voting_deadline.isoformat()
        }

class SimpleDAOService:
    """Simple DAO governance service demonstrating community decision-making"""
    
    def __init__(self, db_path: str = "./news_integrity.db"):
        self.db_path = db_path
        self.metta_service = MeTTaService(db_path)
        # Simple DAO parameters
        self.min_trust_for_proposal = 70
        self.min_trust_for_voting = 60
        self.voting_period_days = 3  # Short period for demo
        self.approval_threshold = 0.6  # 60% approval needed
        self.dao_treasury = 10000.0  # $10,000 demo treasury
    
    async def create_funding_proposal(self, proposer_id: str, title: str, 
                                    description: str, requested_amount: float) -> dict:
        """Create a simple funding proposal"""
        try:
            # Check proposer eligibility
            proposer = await get_user_by_id(proposer_id, db_path=self.db_path)
            if not proposer:
                return {'success': False, 'error': 'Proposer not found'}
            
            if proposer.trust_score < self.min_trust_for_proposal:
                return {
                    'success': False,
                    'error': f'Minimum trust score of {self.min_trust_for_proposal} required'
                }
            
            # Validate amount
            if requested_amount <= 0 or requested_amount > self.dao_treasury:
                return {
                    'success': False,
                    'error': f'Invalid amount. Must be between $1 and ${self.dao_treasury}'
                }
            
            # Create proposal
            proposal_id = str(uuid.uuid4())
            proposal = SimpleProposal(
                id=proposal_id,
                proposer_id=proposer_id,
                title=title,
                description=description,
                requested_amount=requested_amount,
                status='active',
                votes_yes=0,
                votes_no=0,
                created_at=datetime.now(),
                voting_deadline=datetime.now() + timedelta(days=self.voting_period_days)
            )
            
            # Store proposal
            await self._store_proposal(proposal)
            
            # Add to MeTTa governance space
            proposal_atom = f'(dao-proposal "{proposal_id}" "{proposer_id}" {requested_amount} "active")'
            self.metta_service.add_to_atom_space('governance', proposal_atom)
            
            return {
                'success': True,
                'proposal': proposal.to_dict(),
                'message': f'Funding proposal created: ${requested_amount} for {title}'
            }
            
        except Exception as e:
            print(f"Error creating proposal: {e}")
            return {'success': False, 'error': str(e)}
    
    async def trigger_climate_relief(self, event_id: str) -> dict:
        """Trigger climate relief DAO decision using MeTTa"""
        try:
            # Get event details
            event = await get_event_by_id(event_id, db_path=self.db_path)
            if not event:
                return {'success': False, 'error': 'Event not found'}
            
            # Only trigger for verified events
            if event.verification_status != 'verified':
                return {'success': False, 'error': 'Event must be verified'}
            
            # Calculate severity and location for MeTTa
            location = (event.latitude, event.longitude)
            severity = self._calculate_event_severity(event)
            
            # Use MeTTa to trigger DAO relief
            metta_query = f'!(trigger-dao-relief "{event_id}" ({event.latitude} {event.longitude}) {severity})'
            metta_result = self.metta_service.knowledge_base.metta.run(metta_query)
            
            # Parse MeTTa result
            relief_data = self._parse_metta_relief_result(metta_result)
            
            if not relief_data.get('triggered', False):
                return {
                    'success': False,
                    'error': 'MeTTa did not trigger relief for this event'
                }
            
            # Create automatic relief proposal if triggered
            relief_amount = relief_data.get('relief_amount', 1000)
            auto_execute = relief_data.get('auto_execute', False)
            
            if auto_execute:
                # Execute relief immediately for critical events
                relief_result = await self._execute_emergency_relief(event_id, relief_amount)
                return {
                    'success': True,
                    'relief_triggered': True,
                    'auto_executed': True,
                    'relief_amount': relief_amount,
                    'execution_result': relief_result
                }
            else:
                # Create proposal for community voting
                proposal_result = await self.create_funding_proposal(
                    proposer_id="system",  # System-generated proposal
                    title=f"Climate Relief for {event.event_type.title()} Event",
                    description=f"Emergency relief funding for verified {event.event_type} event at coordinates ({event.latitude}, {event.longitude})",
                    requested_amount=relief_amount
                )
                
                return {
                    'success': True,
                    'relief_triggered': True,
                    'auto_executed': False,
                    'proposal_created': proposal_result.get('success', False),
                    'proposal_id': proposal_result.get('proposal', {}).get('id'),
                    'relief_amount': relief_amount
                }
                
        except Exception as e:
            print(f"Error triggering climate relief: {e}")
            return {'success': False, 'error': str(e)}
    
    async def vote_on_proposal(self, proposal_id: str, voter_id: str, vote_choice: bool) -> dict:
        """Vote on a DAO proposal (True = yes, False = no)"""
        try:
            # Check voter eligibility
            voter = await get_user_by_id(voter_id, db_path=self.db_path)
            if not voter:
                return {'success': False, 'error': 'Voter not found'}
            
            if voter.trust_score < self.min_trust_for_voting:
                return {
                    'success': False,
                    'error': f'Minimum trust score of {self.min_trust_for_voting} required to vote'
                }
            
            # Get proposal
            proposal = await self._get_proposal(proposal_id)
            if not proposal:
                return {'success': False, 'error': 'Proposal not found'}
            
            # Check if voting is still open
            if datetime.now() > proposal.voting_deadline:
                return {'success': False, 'error': 'Voting period has ended'}
            
            if proposal.status != 'active':
                return {'success': False, 'error': 'Proposal is not active'}
            
            # Check if user already voted
            if await self._has_user_voted(proposal_id, voter_id):
                return {'success': False, 'error': 'User has already voted'}
            
            # Record vote
            vote_record = {
                'id': str(uuid.uuid4()),
                'proposal_id': proposal_id,
                'voter_id': voter_id,
                'vote_choice': vote_choice,
                'timestamp': datetime.now().isoformat()
            }
            
            await self._store_vote(vote_record)
            
            # Update proposal vote counts
            if vote_choice:
                proposal.votes_yes += 1
            else:
                proposal.votes_no += 1
            
            await self._update_proposal(proposal)
            
            # Add vote to MeTTa
            vote_atom = f'(dao-vote "{proposal_id}" "{voter_id}" {str(vote_choice).lower()})'
            self.metta_service.add_to_atom_space('governance', vote_atom)
            
            # Check if proposal should be finalized
            finalization_result = await self._check_proposal_finalization(proposal)
            
            return {
                'success': True,
                'vote_recorded': vote_choice,
                'current_votes': {'yes': proposal.votes_yes, 'no': proposal.votes_no},
                'finalization_result': finalization_result,
                'message': f'Vote recorded: {"Yes" if vote_choice else "No"}'
            }
            
        except Exception as e:
            print(f"Error voting on proposal: {e}")
            return {'success': False, 'error': str(e)}
    
    async def finalize_proposal(self, proposal_id: str) -> dict:
        """Finalize a proposal after voting period"""
        try:
            proposal = await self._get_proposal(proposal_id)
            if not proposal:
                return {'success': False, 'error': 'Proposal not found'}
            
            if proposal.status != 'active':
                return {'success': False, 'error': 'Proposal is not active'}
            
            # Check if voting period has ended
            if datetime.now() <= proposal.voting_deadline:
                return {'success': False, 'error': 'Voting period is still active'}
            
            # Calculate results
            total_votes = proposal.votes_yes + proposal.votes_no
            if total_votes == 0:
                proposal.status = 'rejected'
                await self._update_proposal(proposal)
                return {
                    'success': True,
                    'approved': False,
                    'reason': 'No votes received',
                    'final_status': 'rejected'
                }
            
            approval_ratio = proposal.votes_yes / total_votes
            approved = approval_ratio >= self.approval_threshold
            
            # Update proposal status
            proposal.status = 'approved' if approved else 'rejected'
            await self._update_proposal(proposal)
            
            # Add result to MeTTa
            result_atom = f'(dao-result "{proposal_id}" "{proposal.status}" {approval_ratio})'
            self.metta_service.add_to_atom_space('governance', result_atom)
            
            return {
                'success': True,
                'approved': approved,
                'approval_ratio': approval_ratio,
                'threshold': self.approval_threshold,
                'votes': {'yes': proposal.votes_yes, 'no': proposal.votes_no},
                'final_status': proposal.status,
                'message': f'Proposal {"approved" if approved else "rejected"} with {approval_ratio:.1%} approval'
            }
            
        except Exception as e:
            print(f"Error finalizing proposal: {e}")
            return {'success': False, 'error': str(e)}
    
    async def execute_proposal(self, proposal_id: str) -> dict:
        """Execute an approved proposal"""
        try:
            proposal = await self._get_proposal(proposal_id)
            if not proposal:
                return {'success': False, 'error': 'Proposal not found'}
            
            if proposal.status != 'approved':
                return {'success': False, 'error': 'Proposal must be approved before execution'}
            
            # Check treasury balance
            if proposal.requested_amount > self.dao_treasury:
                return {'success': False, 'error': 'Insufficient treasury funds'}
            
            # Execute proposal (simplified - just update status)
            proposal.status = 'executed'
            await self._update_proposal(proposal)
            
            # Update treasury (simplified)
            self.dao_treasury -= proposal.requested_amount
            
            # Add execution record to MeTTa
            execution_atom = f'(dao-execution "{proposal_id}" {proposal.requested_amount} "completed")'
            self.metta_service.add_to_atom_space('governance', execution_atom)
            
            return {
                'success': True,
                'executed': True,
                'amount_distributed': proposal.requested_amount,
                'remaining_treasury': self.dao_treasury,
                'message': f'Proposal executed: ${proposal.requested_amount} distributed'
            }
            
        except Exception as e:
            print(f"Error executing proposal: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_active_proposals(self) -> List[dict]:
        """Get all active proposals"""
        try:
            proposals = await self._get_proposals_by_status('active')
            return [p.to_dict() for p in proposals]
        except Exception as e:
            print(f"Error getting active proposals: {e}")
            return []
    
    async def get_dao_stats(self) -> dict:
        """Get DAO statistics"""
        try:
            all_proposals = await self._get_all_proposals()
            
            stats = {
                'treasury_balance': self.dao_treasury,
                'total_proposals': len(all_proposals),
                'active_proposals': len([p for p in all_proposals if p.status == 'active']),
                'approved_proposals': len([p for p in all_proposals if p.status == 'approved']),
                'executed_proposals': len([p for p in all_proposals if p.status == 'executed']),
                'rejected_proposals': len([p for p in all_proposals if p.status == 'rejected']),
                'total_funding_requested': sum(p.requested_amount for p in all_proposals),
                'total_funding_distributed': sum(p.requested_amount for p in all_proposals if p.status == 'executed'),
                'governance_parameters': {
                    'min_trust_for_proposal': self.min_trust_for_proposal,
                    'min_trust_for_voting': self.min_trust_for_voting,
                    'voting_period_days': self.voting_period_days,
                    'approval_threshold': self.approval_threshold
                }
            }
            
            return stats
            
        except Exception as e:
            print(f"Error getting DAO stats: {e}")
            return {'error': str(e)}
    
    # Private helper methods
    
    async def _store_proposal(self, proposal: SimpleProposal):
        """Store proposal in database"""
        try:
            atom = MeTTaAtom(
                id=proposal.id,
                event_id="",
                atom_type='dao_proposal',
                atom_content=json.dumps(proposal.to_dict()),
                created_at=datetime.now()
            )
            await create_atom(atom, db_path=self.db_path)
        except Exception as e:
            print(f"Error storing proposal: {e}")
    
    async def _store_vote(self, vote_record: dict):
        """Store vote in database"""
        try:
            atom = MeTTaAtom(
                id=vote_record['id'],
                event_id="",
                atom_type='dao_vote',
                atom_content=json.dumps(vote_record),
                created_at=datetime.now()
            )
            await create_atom(atom, db_path=self.db_path)
        except Exception as e:
            print(f"Error storing vote: {e}")
    
    async def _get_proposal(self, proposal_id: str) -> Optional[SimpleProposal]:
        """Get proposal by ID"""
        try:
            atoms = await get_all_atoms(db_path=self.db_path)
            for atom in atoms:
                if atom.atom_type == 'dao_proposal' and atom.id == proposal_id:
                    data = json.loads(atom.atom_content)
                    return SimpleProposal(
                        id=data['id'],
                        proposer_id=data['proposer_id'],
                        title=data['title'],
                        description=data['description'],
                        requested_amount=data['requested_amount'],
                        status=data['status'],
                        votes_yes=data['votes_yes'],
                        votes_no=data['votes_no'],
                        created_at=datetime.fromisoformat(data['created_at']),
                        voting_deadline=datetime.fromisoformat(data['voting_deadline'])
                    )
            return None
        except Exception as e:
            print(f"Error getting proposal: {e}")
            return None
    
    async def _update_proposal(self, proposal: SimpleProposal):
        """Update proposal in database"""
        # In a real implementation, you'd update the existing record
        # For simplicity, we'll store a new version
        await self._store_proposal(proposal)
    
    async def _has_user_voted(self, proposal_id: str, voter_id: str) -> bool:
        """Check if user has already voted"""
        try:
            atoms = await get_all_atoms(db_path=self.db_path)
            for atom in atoms:
                if atom.atom_type == 'dao_vote':
                    vote_data = json.loads(atom.atom_content)
                    if vote_data['proposal_id'] == proposal_id and vote_data['voter_id'] == voter_id:
                        return True
            return False
        except Exception as e:
            print(f"Error checking if user voted: {e}")
            return False
    
    async def _check_proposal_finalization(self, proposal: SimpleProposal) -> Optional[dict]:
        """Check if proposal should be automatically finalized"""
        if datetime.now() > proposal.voting_deadline:
            return await self.finalize_proposal(proposal.id)
        return None
    
    async def _get_proposals_by_status(self, status: str) -> List[SimpleProposal]:
        """Get proposals by status"""
        try:
            proposals = []
            atoms = await get_all_atoms(db_path=self.db_path)
            for atom in atoms:
                if atom.atom_type == 'dao_proposal':
                    data = json.loads(atom.atom_content)
                    if data['status'] == status:
                        proposal = SimpleProposal(
                            id=data['id'],
                            proposer_id=data['proposer_id'],
                            title=data['title'],
                            description=data['description'],
                            requested_amount=data['requested_amount'],
                            status=data['status'],
                            votes_yes=data['votes_yes'],
                            votes_no=data['votes_no'],
                            created_at=datetime.fromisoformat(data['created_at']),
                            voting_deadline=datetime.fromisoformat(data['voting_deadline'])
                        )
                        proposals.append(proposal)
            return proposals
        except Exception as e:
            print(f"Error getting proposals by status: {e}")
            return []
    
    async def _get_all_proposals(self) -> List[SimpleProposal]:
        """Get all proposals"""
        try:
            proposals = []
            atoms = await get_all_atoms(db_path=self.db_path)
            for atom in atoms:
                if atom.atom_type == 'dao_proposal':
                    data = json.loads(atom.atom_content)
                    proposal = SimpleProposal(
                        id=data['id'],
                        proposer_id=data['proposer_id'],
                        title=data['title'],
                        description=data['description'],
                        requested_amount=data['requested_amount'],
                        status=data['status'],
                        votes_yes=data['votes_yes'],
                        votes_no=data['votes_no'],
                        created_at=datetime.fromisoformat(data['created_at']),
                        voting_deadline=datetime.fromisoformat(data['voting_deadline'])
                    )
                    proposals.append(proposal)
            return proposals
        except Exception as e:
            print(f"Error getting all proposals: {e}")
            return []   
    def _calculate_event_severity(self, event) -> float:
        """Calculate event severity for MeTTa processing"""
        severity_map = {
            'drought': 0.8,
            'flood': 0.7,
            'locust': 0.9,
            'extreme_heat': 0.6,
            'wildfire': 0.9,
            'storm': 0.7
        }
        
        base_severity = severity_map.get(event.event_type, 0.5)
        
        # Adjust based on description keywords
        if event.description:
            description_lower = event.description.lower()
            if any(word in description_lower for word in ['severe', 'extreme', 'devastating', 'massive']):
                base_severity = min(1.0, base_severity + 0.2)
            elif any(word in description_lower for word in ['minor', 'small', 'light']):
                base_severity = max(0.1, base_severity - 0.2)
        
        return base_severity
    
    def _parse_metta_relief_result(self, metta_result) -> dict:
        """Parse MeTTa DAO relief trigger result"""
        try:
            result_data = {
                'triggered': False,
                'relief_amount': 0,
                'auto_execute': False
            }
            
            if metta_result and len(metta_result) > 0:
                result_str = str(metta_result[0]) if metta_result else ""
                if "dao-relief-triggered" in result_str:
                    result_data['triggered'] = True
                    # Extract relief amount and auto-execute flag
                    import re
                    numbers = re.findall(r'\d+\.?\d*', result_str)
                    if numbers:
                        result_data['relief_amount'] = float(numbers[0]) if numbers[0] else 1000
                    
                    # Check for auto-execute flag
                    result_data['auto_execute'] = 'true' in result_str.lower()
            
            return result_data
            
        except Exception as e:
            print(f"Error parsing MeTTa relief result: {e}")
            return {'triggered': False, 'relief_amount': 0, 'auto_execute': False}
    
    async def _execute_emergency_relief(self, event_id: str, relief_amount: float) -> dict:
        """Execute emergency relief immediately"""
        try:
            # Create relief execution record
            relief_id = str(uuid.uuid4())
            relief_record = {
                'id': relief_id,
                'event_id': event_id,
                'amount': relief_amount,
                'status': 'executed',
                'execution_type': 'emergency_auto',
                'timestamp': datetime.now().isoformat()
            }
            
            # Store relief record
            atom = MeTTaAtom(
                id=relief_id,
                event_id=event_id,
                atom_type='climate_relief',
                atom_content=json.dumps(relief_record),
                created_at=datetime.now()
            )
            await create_atom(atom, db_path=self.db_path)
            
            # Add to MeTTa space
            relief_atom = f'(climate-relief-executed "{event_id}" {relief_amount} "emergency")'
            self.metta_service.add_to_atom_space('governance', relief_atom)
            
            return {
                'success': True,
                'relief_id': relief_id,
                'amount': relief_amount,
                'execution_type': 'emergency_auto'
            }
            
        except Exception as e:
            print(f"Error executing emergency relief: {e}")
            return {'success': False, 'error': str(e)}
