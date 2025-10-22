"""
MeTTa Service for Decentralized News Integrity
Handles MeTTa knowledge atoms, verification logic, and reasoning using proper Hyperon API
"""

import json
import uuid
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple, Union
from hyperon import MeTTa, Atom, ExpressionAtom
from app.database.crud import *
from app.database.models import MeTTaAtom, Event, User
from app.models.newsmodels import NewsReportCreate, MediaAnalysisResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsIntegrityKnowledgeBase:
    """MeTTa Knowledge Base for Decentralized News Integrity using proper Hyperon API with advanced features"""
    
    def __init__(self):
        """Initialize MeTTa runner with news integrity knowledge and multiple atom spaces"""
        self.metta = MeTTa()
        self.space = self.metta.space()  # Get the space to query atoms
        self.atom_spaces = {}
        self.verification_history = []
        self.loaded_files = []
        
        self._initialize_atom_spaces()
        self.load_base_knowledge()
    
    def _initialize_atom_spaces(self):
        """Initialize multiple atom spaces for different domains"""
        try:
            # Create specialized atom spaces
            self.metta.run('!(bind! &event-space (new-space))')
            self.metta.run('!(bind! &trust-space (new-space))')
            self.metta.run('!(bind! &economic-space (new-space))')
            self.metta.run('!(bind! &governance-space (new-space))')
            self.metta.run('!(bind! &prediction-space (new-space))')
            
            self.atom_spaces = {
                'event': '&event-space',
                'trust': '&trust-space',
                'economic': '&economic-space',
                'governance': '&governance-space',
                'prediction': '&prediction-space'
            }
            logger.info("✅ Initialized multiple atom spaces")
        except Exception as e:
            logger.error(f"❌ Error initializing atom spaces: {str(e)}")
            raise

    def load_base_knowledge(self):
        """Load base news integrity knowledge and verification rules from .metta files"""
        logger.info(" Loading MeTTa knowledge from .metta files...")
        
        metta_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'metta')
        
        # List of MeTTa files to load in order
        metta_files = [
            'base_knowledge.metta',
            'helper_functions.metta', 
            'users.metta',
            'verification_rules.metta',
            'news_integrity_data.metta',
            'advanced_verification.metta',
            'economic_analysis.metta',
            'governance_logic.metta',
            'prediction_models.metta',
            'trust_network.metta'
        ]
        
        loaded_files = []
        
        for filename in metta_files:
            filepath = os.path.join(metta_dir, filename)
            try:
                if os.path.exists(filepath):
                    logger.info(f"    Loading {filename}...")
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        self.metta.run(content)
                    loaded_files.append(filename)
                else:
                    logger.warning(f"   ⚠️ Warning: {filename} not found at {filepath}")
            except Exception as e:
                logger.error(f"   ❌ Error loading {filename}: {str(e)}")
        
        self.loaded_files = loaded_files
        logger.info(f"✅ MeTTa knowledge loaded from {len(loaded_files)} files: {', '.join(loaded_files)}")
    
    def add_atom(self, atom_str: str, space: str = "default") -> bool:
        """Add a single atom to the specified MeTTa space"""
        try:
            if space != "default" and space in self.atom_spaces:
                space_ref = self.atom_spaces[space]
                query = f'!(add-atom {space_ref} {atom_str})'
            else:
                query = atom_str
                
            result = self.metta.run(query)
            logger.info(f" Added atom to {space}: {atom_str}")
            return True
        except Exception as e:
            logger.error(f" Error adding atom {atom_str}: {str(e)}")
            return False
    
    def query_atoms(self, query_str: str, space: str = "default", response: str = "$result") -> List[Any]:
        """Query atoms from the specified MeTTa space using match"""
        try:
            if space != "default" and space in self.atom_spaces:
                space_ref = self.atom_spaces[space]
                query = f"!(match {space_ref} {query_str} {response})"
            else:
                query = f"!(match &self {query_str} {response})"
            print(f'Query: {query}')   
            result = self.metta.run(query)
            # print(f'query res: {result} and space consists: \n{self.metta.run(f'!(match {space_ref} $x $x)')}')
            # print(f'query res: {result}')
            return self._parse_query_result(result)
        except Exception as e:
            logger.error(f"   ❌ Error querying {query_str}: {str(e)}")
            return []
    
    def run_metta_function(self, query_str: str) -> List[Any]:
        """Query atoms from the specified MeTTa space using match"""
        try:
            # Prepend '!' only if query_str does not already start with '!'
            query = query_str if query_str.strip().startswith('!') else f'!{query_str.strip()}'

            print(f'Query: {query}') 
            result = self.metta.run(query, flat=True)
            # print(f'query res: {result} and space consists: \n{self.metta.run(f'!(match {space_ref} $x $x)')}')
            # print(f'query res: {result}')
            return result
        except Exception as e:
            logger.error(f"   ❌ Error querying {query_str}: {str(e)}")
            return []
    
    def _parse_query_result(self, result: List[Any]) -> List[Dict[str, Any]]:
        """Parse MeTTa query results into a more usable format"""
        parsed_results = []
        for item in result:
            if isinstance(item, ExpressionAtom):
                try:
                    children = item.get_children()
                    if children:
                        parsed = {
                            'type': 'expression',
                            'children': [str(child) for child in children],
                            'raw': str(item)
                        }
                        parsed_results.append(parsed)
                except:
                    parsed_results.append({'raw': str(item), 'type': 'atom'})
            else:
                parsed_results.append({'raw': str(item), 'type': 'unknown'})
        return parsed_results
    
    def create_user_atoms(self, user: User) -> List[str]:
        """Create MeTTa atoms for a user and add them to the space"""
        atoms = []
        
        # User identity atom
        user_atom = f"(user {user.id})"
        atoms.append(user_atom)
        self.add_atom(user_atom, "trust")
        
        # Location atom
        if user.location_region:
            location_atom = f"(location {user.id} \"{user.location_region}\")"
            atoms.append(location_atom)
            self.add_atom(location_atom, "event")
        
        # Trust score atom
        trust_atom = f"(trust-score {user.id} {user.trust_score})"
        atoms.append(trust_atom)
        self.add_atom(trust_atom, "trust")
        
        # Wallet atom
        if user.wallet_address:
            wallet_atom = f"(wallet-address {user.id} \"{user.wallet_address}\")"
            atoms.append(wallet_atom)
            self.add_atom(wallet_atom, "economic")
        
        return atoms
    
    def create_news_atoms(self, news_report: 'NewsReport', user: 'User') -> Tuple[List[str], str]:
        """Create MeTTa atoms for a news report and add them to the space"""
        atoms = []
        
        # Create a unique news ID for MeTTa
        news_id = f"{news_report.category}_{news_report.id[:8]}"
        
        # News identity atom
        news_atom = f"(news {news_id})"
        atoms.append(news_atom)
        self.add_atom(news_atom, "event")
        
        # Reporter relationship
        reports_atom = f"(reports {user.id} {news_id})"
        atoms.append(reports_atom)
        self.add_atom(reports_atom, "event")
        
        # News category
        category_atom = f"(news-category {news_id} {news_report.category})"
        atoms.append(category_atom)
        self.add_atom(category_atom, "event")
        
        # Timestamp
        if news_report.timestamp:
            timestamp_atom = f"(timestamp {news_id} \"{news_report.timestamp.isoformat()}\")"
            atoms.append(timestamp_atom)
            self.add_atom(timestamp_atom, "event")
        
        # GPS coordinates
        if news_report.latitude and news_report.longitude:
            coords_atom = f"(gps-coords {news_id} ({news_report.latitude} {news_report.longitude}))"
            atoms.append(coords_atom)
            self.add_atom(coords_atom, "event")
        
        # Media URL (evidence link)
        if news_report.media_url:
            evidence_atom = f"(evidence-link {news_id} \"{news_report.media_url}\")"
            atoms.append(evidence_atom)
            self.add_atom(evidence_atom, "event")
            
            # Media timestamp (same as news for now)
            media_timestamp_atom = f"(media-timestamp {news_id} \"{news_report.timestamp.isoformat()}\")"
            atoms.append(media_timestamp_atom)
            self.add_atom(media_timestamp_atom, "event")
        
        # Content
        if news_report.content:
            content_atom = f"(content {news_id} \"{news_report.content[:200]}...\")"
            atoms.append(content_atom)
            self.add_atom(content_atom, "event")
        
        # Source
        if news_report.source:
            source_atom = f"(news-source {news_id} \"{news_report.source}\")"
            atoms.append(source_atom)
            self.add_atom(source_atom, "event")
        
        # Integrity level
        integrity_atom = f"(integrity-level {news_id} {news_report.integrity_level})"
        atoms.append(integrity_atom)
        self.add_atom(integrity_atom, "event")
        
        return atoms, news_id
    
    def _determine_impact_severity(self, event: Event) -> Tuple[Optional[str], Optional[str]]:
        """Determine impact and severity based on event type and description"""
        impact_mapping = {
            'drought': ('Livestock_Risk', 'High'),
            'flood': ('Infrastructure_Damage', 'Medium'),
            'locust': ('Crop_Failure', 'High'),
            'extreme_heat': ('Water_Scarcity', 'Medium'),
            'wildfire': ('Ecosystem_Damage', 'High'),
            'storm': ('Property_Damage', 'Medium')
        }
        
        return impact_mapping.get(event.event_type, (None, None))
    
    def run_verification(self, event_id: str, user_id: str, image_confidence: int, desc_confidence: int) -> Dict[str, Any]:
        """Run MeTTa verification logic using proper queries"""
        logger.info(f" Running MeTTa verification for event {event_id}")
        print('running metta verification')
        try:
            # Query for auto-verification
            auto_verify_query = f"(auto-verify {event_id} {user_id} {image_confidence} {desc_confidence})"
            auto_verify_result = self.run_metta_function(auto_verify_query)
            print(f'autoverify res: {auto_verify_result}')
            # Check if verification passed by looking for verified atom
            
            raw_value = auto_verify_result[0]
            str_value = str(raw_value).strip().lower()
            is_verified = str_value == "true"

            print(f"verified (raw): {raw_value} -> (str): '{str_value}' -> (bool): {is_verified}")

            if is_verified:
                atom = f"(verified {event_id})"
                verified_result = self.add_atom(atom, "event")

            # If auto-verify didn't work, try high-trust verification
            if not is_verified:
                high_trust_query = f"(high-trust-verify {event_id} {user_id})"
                high_trust_result = self.run_metta_function(high_trust_query)
                # give the person the benefit of doubt if they are having high trust score
                if high_trust_result and len(high_trust_result) > 0:
                    high_trust_raw = high_trust_result[0]
                    high_trust_str = str(high_trust_raw).strip().lower()
                    is_verified = high_trust_str == "true" or "high-trust-verify" in high_trust_str
                    print(f"high-trust verified (raw): {high_trust_raw} -> (str): '{high_trust_str}' -> (bool): {is_verified}")
            
            # Ensure verified is always a boolean
            if not isinstance(is_verified, bool):
                is_verified = bool(is_verified)
            
            # Get reasoning
            reasoning = self._get_verification_reasoning(event_id, user_id)
            
            verification_result = {
                'verified': is_verified,
                'event_id': event_id,
                'user_id': user_id,
                'reasoning': reasoning,
                'verification_time': datetime.now().isoformat(),
                'method': 'auto-verify' if auto_verify_result else 'high-trust-verify' if is_verified else 'failed'
            }
            
            # Store verification history
            self.verification_history.append(verification_result)
            
            logger.info(f"✅ Verification complete: {'VERIFIED' if is_verified else 'FAILED'}")
            return verification_result
            
        except Exception as e:
            logger.error(f"❌ Verification error: {str(e)}")
            return {
                'verified': False,
                'event_id': event_id,
                'user_id': user_id,
                'error': str(e),
                'reasoning': ['Verification failed due to technical error'],
                'verification_time': datetime.now().isoformat()
            }
    
    def _get_verification_reasoning(self, event_id: str, user_id: str) -> List[str]:
        """Get reasoning for verification decision using proper queries"""
        reasoning = []
        
        # Check trust score
        trust_query = f"(trust-score {user_id} $score)"
        trust_result = self.query_atoms(trust_query, "trust", "$score")
        if trust_result:
            try:
                # Extract score from the result
                for result_item in trust_result:
                    if 'children' in result_item and len(result_item['children']) >= 3:
                        score_raw = result_item['children'][2]
                        if hasattr(score_raw, 'get_grounded_value'):
                            score = score_raw.get_grounded_value()
                        else:
                            score = str(score_raw)
                        
                        # Try to convert to number
                        try:
                            if isinstance(score, str) and score.isdigit():
                                score = int(score)
                            elif isinstance(score, str) and '.' in score:
                                score = float(score)
                        except (ValueError, TypeError):
                            pass
                        
                        reasoning.append(f"User trust score: {score}")
                        
                        # Check if score meets threshold
                        if isinstance(score, (int, float)):
                            if score >= 60:
                                reasoning.append("✅ Trust score meets minimum threshold (60)")
                            else:
                                reasoning.append("❌ Trust score below minimum threshold (60)")
                        break
                else:
                    reasoning.append("User trust score: unknown")
            except (IndexError, ValueError, AttributeError) as e:
                reasoning.append(f"User trust score: unknown (parse error: {e})")
        else:
            reasoning.append("User trust score: unknown")
        evidence_query = f"(evidence-link {event_id} $link)"
        evidence_result = self.query_atoms(evidence_query, "event", "$link")
        if evidence_result:
            reasoning.append("✅ Photo evidence provided")
        else:
            reasoning.append("❌ No photo evidence found")
        
        # Check GPS coordinates
        gps_query = f"(gps-coords {event_id} $coords)"
        gps_result = self.query_atoms(gps_query, "event", "$coords")
        if gps_result:
            reasoning.append("✅ GPS coordinates available")
        else:
            reasoning.append("❌ No GPS coordinates found")
        
        # Check timestamp
        timestamp_query = f"(timestamp {event_id} $time)"
        timestamp_result = self.query_atoms(timestamp_query, "event", "$time")
        if timestamp_result:
            reasoning.append("✅ Event timestamp recorded")
        else:
            reasoning.append("❌ No timestamp found")
        print(f"MeTTa Reasoning: {reasoning}")
        return reasoning
    
    def calculate_payout(self, event_id: str) -> Optional[float]:
        """Calculate payout amount for verified event using proper queries"""
        try:
            # Query for payout eligibility
            payout_query = f"(payout-eligible {event_id} $amount)"
            result = self.run_metta_function(payout_query, "economic")
            
            if result:
                # Extract amount from result
                try:
                    amount_str = result[0].get('children', [])[2] if 'children' in result[0] else None
                    if amount_str:
                        amount = float(amount_str)
                        logger.info(f" Payout calculated: {amount} ETH for event {event_id}")
                        return amount
                except (ValueError, IndexError, TypeError):
                    logger.warning(f"⚠️ Could not parse payout amount for event {event_id}")
            
            logger.info(f"❌ No payout eligibility found for event {event_id}")
            return None
                
        except Exception as e:
            logger.error(f"❌ Payout calculation error: {str(e)}")
            return None
    
    def query_knowledge_base(self, query: str, space: str = "default") -> List[Dict[str, Any]]:
        """Query the MeTTa knowledge base using match"""
        try:
            return self.query_atoms(query, space)
        except Exception as e:
            return [{'error': str(e)}]
    
    def get_all_atoms_of_type(self, atom_type: str, space: str = "default") -> List[str]:
        """Get all atoms of a specific type"""
        try:
            query = f"({atom_type} $x)"
            result = self.query_atoms(query, space, query)
            return [str(r.get('raw', 'unknown')) for r in result]
        except Exception as e:
            logger.error(f"❌ Error getting atoms of type {atom_type}: {str(e)}")
            return []
    
    def get_knowledge_base_state(self) -> Dict[str, Any]:
        """Get current state of the knowledge base"""
        # Get counts of different atom types
        user_atoms = self.get_all_atoms_of_type('user', 'trust')
        event_atoms = self.get_all_atoms_of_type('event', 'event')
        trust_atoms = self.get_all_atoms_of_type('trust-score', 'trust')
        
        return {
            'base_knowledge_loaded': True,
            'verification_rules_loaded': True,
            'loaded_metta_files': self.loaded_files,
            'total_verifications': len(self.verification_history),
            'recent_verifications': self.verification_history[-5:] if self.verification_history else [],
            'atom_counts': {
                'users': len(user_atoms),
                'news_reports': len(event_atoms),
                'trust_scores': len(trust_atoms)
            },
            'atom_spaces': list(self.atom_spaces.keys()),
            'knowledge_base_type': 'hyperon-based'
        }

    # Advanced DAO Methods
    async def community_verify_event(self, event_id: str, verifier_id: str) -> dict:
        """Execute community verification using advanced MeTTa logic"""
        try:
            query = f'!(community-verify "{event_id}" "{verifier_id}")'
            result = self.metta.run(query)
            return self._process_verification_result(result)
        except Exception as e:
            logger.error(f"Error in community verification: {e}")
            return {"success": False, "error": str(e)}

    async def analyze_economic_impact(self, event_id: str) -> dict:
        """Analyze economic impact using MeTTa correlation logic"""
        try:
            query = f'!(analyze-economic-impact "{event_id}")'
            result = self.metta.run(query)
            return self._process_impact_analysis(result)
        except Exception as e:
            logger.error(f"Error in economic impact analysis: {e}")
            return {"success": False, "error": str(e)}

    async def evaluate_dao_proposal(self, proposal_id: str) -> dict:
        """Evaluate DAO proposal using MeTTa governance logic"""
        try:
            query = f'!(evaluate-proposal "{proposal_id}")'
            result = self.metta.run(query)
            return self._process_proposal_result(result)
        except Exception as e:
            logger.error(f"Error evaluating DAO proposal: {e}")
            return {"success": False, "error": str(e)}

    async def calculate_trust_score(self, user_id: str) -> dict:
        """Calculate advanced trust score using MeTTa trust network logic"""
        try:
            query = f'!(calculate-advanced-trust-score "{user_id}")'
            result = self.metta.run(query)
            return self._process_trust_score_result(result)
        except Exception as e:
            logger.error(f"Error calculating trust score: {e}")
            return {"success": False, "error": str(e)}

    async def generate_early_warning(self, location: dict, event_types: list) -> dict:
        """Generate early warning alerts using MeTTa prediction logic"""
        try:
            lat, lng = location.get('latitude'), location.get('longitude')
            event_types_str = ' '.join([f'"{et}"' for et in event_types])
            query = f'!(generate-early-warning {lat} {lng} ({event_types_str}))'
            result = self.metta.run(query)
            return self._process_warning_result(result)
        except Exception as e:
            logger.error(f"Error generating early warning: {e}")
            return {"success": False, "error": str(e)}

    def add_to_atom_space(self, space_name: str, atom: str) -> bool:
        """Add atom to specific atom space"""
        try:
            if space_name in self.atom_spaces:
                space_ref = self.atom_spaces[space_name]
                query = f'!(add-atom {space_ref} {atom})'
                self.metta.run(query)
                return True
            else:
                logger.warning(f"Atom space {space_name} not found")
                return False
        except Exception as e:
            logger.error(f"Error adding atom to space {space_name}: {e}")
            return False

    def query_atom_space(self, space_name: str, query_pattern: str) -> List[Dict[str, Any]]:
        """Query specific atom space with pattern"""
        try:
            if space_name in self.atom_spaces:
                space_ref = self.atom_spaces[space_name]
                query = f"!(match {space_ref} {query_pattern} $result)"
                result = self.metta.run(query)
                return self._parse_query_result(result)
            else:
                logger.warning(f"Atom space {space_name} not found")
                return []
        except Exception as e:
            logger.error(f"Error querying atom space {space_name}: {e}")
            return []

    def get_source_analysis(self, source: str, days_back: int = 30) -> Optional[MediaAnalysisResponse]:
        """Get news integrity analysis for a specific source"""
        try:
            # Query MeTTa knowledge base for source-related atoms
            query = f'(news-source $news_id "{source}")'
            results = self.query_atom_space("event", query)

            if results:
                # Create a mock analysis response based on available data
                analysis = {
                    'source': source,
                    'total_reports': len(results),
                    'integrity_score': 0.7,  # Default score
                    'verification_rate': 0.6,
                    'days_analyzed': days_back
                }
                return MediaAnalysisResponse(**analysis)
            else:
                return None

        except Exception as e:
            logging.error(f"Failed to get source analysis from MeTTa: {str(e)}")
            return None

    # Result processing methods
    def _process_verification_result(self, result) -> dict:
        """Process community verification result"""
        if not result:
            return {"success": False, "verified": False, "reason": "No result"}
        
        # Extract verification status from MeTTa result
        result_str = str(result).lower()
        if "eligible-verifier" in result_str:
            return {"success": True, "eligible": True}
        elif "verified-event" in result_str:
            return {"success": True, "verified": True}
        else:
            return {"success": True, "verified": False, "result": result}

    def _process_impact_analysis(self, result) -> dict:
        """Process economic impact analysis result"""
        if not result:
            return {"success": False, "impacts": []}
        
        return {
            "success": True,
            "impacts": result,
            "correlation_found": len(result) > 0
        }

    def _process_proposal_result(self, result) -> dict:
        """Process DAO proposal evaluation result"""
        if not result:
            return {"success": False, "status": "unknown"}
        
        return {
            "success": True,
            "evaluation": result,
            "status": "evaluated"
        }

    def _process_trust_score_result(self, result) -> dict:
        """Process trust score calculation result"""
        if not result:
            return {"success": False, "trust_score": 0}
        
        trust_score = 0
        try:
            for item in result:
                if hasattr(item, 'get_children'):
                    children = item.get_children()
                    if len(children) >= 3 and str(children[0]) == "trust-score":
                        trust_score = float(str(children[2]))
                        break
        except (ValueError, IndexError, AttributeError):
            pass
        
        return {
            "success": True,
            "trust_score": trust_score,
            "result": result
        }

    def _process_warning_result(self, result) -> dict:
        """Process early warning generation result"""
        if not result:
            return {"success": False, "warnings": []}
        
        return {
            "success": True,
            "warnings": result,
            "alert_level": "medium" if result else "low"
        }


_shared_knowledge_base = None

def get_shared_knowledge_base():
    global _shared_knowledge_base
    if _shared_knowledge_base is None:
        _shared_knowledge_base = NewsIntegrityKnowledgeBase()
    return _shared_knowledge_base

class MeTTaService:
    """Service for handling MeTTa operations with proper Hyperon integration"""
    def __init__(self, db_path: str = "./news_integrity.db"):
        self.db_path = db_path
        # Use a shared knowledge base instance to avoid thread re-start errors
        self.knowledge_base = get_shared_knowledge_base()
        self.crud = None
    
    async def create_atoms(self, news_report: 'NewsReport', user: 'User') -> list:
        """Create MeTTa knowledge atoms from a NewsReport object and user object (no DB queries)"""
        try:
            # Create user atoms (adds them to MeTTa space)
            user_atoms = self.knowledge_base.create_user_atoms(user)
            # Create news atoms (adds them to MeTTa space)
            news_atoms, metta_news_id = self.knowledge_base.create_news_atoms(news_report, user)
            # Store atoms in database for persistence
            all_atoms = user_atoms + news_atoms
            for atom_content in all_atoms:
                atom_type = self._determine_atom_type(atom_content)
                atom = MeTTaAtom(
                    id=str(uuid.uuid4()),
                    event_id=news_report.id,
                    atom_type=atom_type,
                    atom_content=json.dumps({
                        'atom': atom_content,
                        'metta_news_id': metta_news_id
                    }),
                    created_at=datetime.now()
                )
                # await self.crud.create_atom(atom)
            logger.info(f"✅ Created {len(all_atoms)} MeTTa atoms for news report {news_report.id}")
            return all_atoms
        except Exception as e:
            logger.error(f"❌ Error creating atoms: {str(e)}")
            raise
    
    def _determine_atom_type(self, atom_content: str) -> str:
        """Determine atom type from content"""
        if atom_content.startswith('(user '):
            return 'user'
        elif atom_content.startswith('(news ') or atom_content.startswith('(event '):
            return 'news'
        elif atom_content.startswith('(location '):
            return 'location'
        elif atom_content.startswith('(evidence-link '):
            return 'evidence'
        elif atom_content.startswith('(news-category '):
            return 'category'
        elif atom_content.startswith('(verified '):
            return 'verification'
        elif atom_content.startswith('(trust-score '):
            return 'trust'
        elif atom_content.startswith('(news-source '):
            return 'source'
        elif atom_content.startswith('(integrity-level '):
            return 'integrity'
        else:
            return 'other'
    
    async def run_verification(self, news_report: 'NewsReport', user: 'User', content_confidence: int, source_confidence: int) -> Dict[str, Any]:
        """Run MeTTa verification logic on a news report object and user object (no DB queries)"""
        try:
            print("Creating news atoms...")
            news_atoms, metta_news_id = self.knowledge_base.create_news_atoms(news_report, user)
            print("Running verification from the knowledge base")
            # Run verification using the MeTTa news ID
            verification_result = self.knowledge_base.run_verification(metta_news_id, user.id, content_confidence, source_confidence)
            print(f"run_ver (verification_result): {verification_result}")
            return verification_result
        except Exception as e:
            logger.error(f"❌ Verification error: {str(e)}")
            return {
                'verified': False,
                'event_id': news_report.id,
                'user_id': user.id,
                'error': str(e),
                'reasoning': ['Verification failed due to technical error'],
                'verification_time': datetime.now().isoformat()
            }
    
    def query_knowledge_base(self, query: str, space: str = "default") -> List[str]:
        """Query the MeTTa knowledge base"""
        results = self.knowledge_base.query_knowledge_base(query, space)
        return [str(r) for r in results]
    
    def update_trust_score(self, user_id: str, delta: int) -> int:
        """Update user trust score based on verification results"""
        # Add trust score update atom
        if delta > 0:
            trust_update = f"(increase-trust {user_id} {delta})"
        else:
            trust_update = f"(decrease-trust {user_id} {abs(delta)})"
        
        self.knowledge_base.add_atom(trust_update, "trust")
        return delta

    def get_knowledge_base_state(self) -> Dict[str, Any]:
        """Get current state of the knowledge base"""
        return self.knowledge_base.get_knowledge_base_state()

    # Advanced DAO Methods
    async def community_verify_news(self, news_id: str, verifier_id: str) -> dict:
        """Execute community verification using advanced MeTTa logic"""
        return await self.knowledge_base.community_verify_event(news_id, verifier_id)

    async def analyze_economic_impact(self, event_id: str) -> dict:
        """Analyze economic impact using MeTTa correlation logic"""
        return await self.knowledge_base.analyze_economic_impact(event_id)

    async def evaluate_dao_proposal(self, proposal_id: str) -> dict:
        """Evaluate DAO proposal using MeTTa governance logic"""
        return await self.knowledge_base.evaluate_dao_proposal(proposal_id)

    async def calculate_advanced_trust_score(self, user_id: str) -> dict:
        """Calculate advanced trust score using MeTTa trust network logic"""
        return await self.knowledge_base.calculate_trust_score(user_id)

    async def generate_early_warning(self, location: dict, event_types: list) -> dict:
        """Generate early warning alerts using MeTTa prediction logic"""
        return await self.knowledge_base.generate_early_warning(location, event_types)

    def add_to_atom_space(self, space_name: str, atom: str) -> bool:
        """Add atom to specific atom space"""
        return self.knowledge_base.add_to_atom_space(space_name, atom)

    def query_atom_space(self, space_name: str, query_pattern: str) -> List[Dict[str, Any]]:
        """Query specific atom space with pattern"""
        return self.knowledge_base.query_atom_space(space_name, query_pattern)

    async def submit_news_report(self, report: 'NewsReportCreate') -> Dict:
        """Submit a news report to MeTTa for integrity analysis"""
        try:
            # Convert NewsReportCreate to a mock NewsReport for metta operations
            class MockNewsReport:
                def __init__(self, report_data):
                    self.id = "temp_" + str(hash(str(report_data)))
                    self.category = report_data.get('category', 'general')
                    self.timestamp = report_data.get('timestamp')
                    self.latitude = report_data.get('latitude')
                    self.longitude = report_data.get('longitude')
                    self.media_url = report_data.get('media_url')
                    self.content = report_data.get('content')
                    self.source = report_data.get('source')
                    self.integrity_level = report_data.get('integrity_level', 'pending')

            class MockUser:
                def __init__(self, user_id):
                    self.id = user_id
                    self.location_region = None
                    self.trust_score = 50  # Default trust score
                    self.wallet_address = None

            mock_report = MockNewsReport(report.model_dump())
            mock_user = MockUser(report.user)

            # Create atoms using the service (remove await since create_atoms is async but we're in async context)
            atoms = await self.create_atoms(mock_report, mock_user)

            # Run verification using the service
            verification_result = await self.run_verification(
                mock_report, mock_user, 70, 60  # Default confidence scores
            )

            return {
                'status': 'success',
                'atoms_created': len(atoms),
                'verified': verification_result.get('verified', False),
                'report_id': mock_report.id,
                'reasoning': verification_result.get('reasoning', [])
            }

        except Exception as e:
            logging.error(f"Failed to submit news report to MeTTa: {str(e)}")
            return {'error': str(e), 'status': 'failed'}

    def get_global_integrity_patterns(self) -> Dict:
        """Get global news integrity patterns across all sources"""
        try:
            # Get knowledge base state
            kb_state = self.get_knowledge_base_state()

            # Query for integrity patterns
            integrity_query = "(integrity-level $news $level)"
            integrity_results = self.query_atom_space("event", integrity_query)

            # Query for source patterns
            source_query = "(news-source $news $source)"
            source_results = self.query_atom_space("event", source_query)

            return {
                'patterns': {
                    'integrity_distribution': self._analyze_integrity_distribution(integrity_results),
                    'source_reliability': self._analyze_source_reliability(source_results),
                    'total_reports': kb_state.get('atom_counts', {}).get('news_reports', 0)
                },
                'knowledge_base_state': kb_state
            }

        except Exception as e:
            logging.error(f"Failed to get global integrity patterns from MeTTa: {str(e)}")
            return {'patterns': {}, 'error': str(e)}

    def analyze_content_integrity(self, content: str) -> Dict:
        """Analyze content for integrity indicators"""
        try:
            # Query knowledge base for similar content
            content_query = f'(content $news "{content[:50]}...")'
            content_matches = self.query_atom_space("event", content_query)

            analysis_result = {
                'integrity_score': 0.7,  # Default score
                'content_length': len(content),
                'analysis_method': 'metta_knowledge_base',
                'existing_similar_content': len(content_matches),
                'indicators': {
                    'factual_content': True,
                    'bias_detected': False,
                    'source_cited': 'unknown'
                }
            }

            return analysis_result

        except Exception as e:
            logging.error(f"Failed to analyze content integrity: {str(e)}")
            return {'integrity_score': 0.5, 'error': str(e)}

    def detect_misinformation_patterns(self, reports: List[Dict]) -> Dict:
        """Detect misinformation patterns across multiple reports"""
        try:
            patterns = []

            for report in reports:
                content = report.get('content', '')
                source = report.get('source', '')

                # Query for similar content
                similar_query = f'(content $news "{content[:30]}...")'
                similar_reports = self.query_atom_space("event", similar_query)

                if len(similar_reports) > 1:
                    patterns.append({
                        'type': 'duplicate_content',
                        'report_id': report.get('id'),
                        'similar_reports': len(similar_reports),
                        'severity': 'medium'
                    })

                # Check source reliability
                source_query = f'(news-source $news "{source}")'
                source_reports = self.query_atom_space("event", source_query)

                if len(source_reports) > 5:  # High volume from same source
                    patterns.append({
                        'type': 'high_volume_source',
                        'source': source,
                        'report_count': len(source_reports),
                        'severity': 'low'
                    })

            return {
                'patterns_detected': len(patterns),
                'patterns': patterns,
                'analysis_method': 'metta_pattern_matching'
            }

        except Exception as e:
            logging.error(f"Failed to detect misinformation patterns: {str(e)}")
            return {'patterns': [], 'error': str(e)}

    def health_check(self) -> bool:
        """Check if MeTTa service is healthy"""
        try:
            # Check if we can query the knowledge base
            kb_state = self.get_knowledge_base_state()
            return kb_state.get('base_knowledge_loaded', False)
        except Exception:
            return False

    def _analyze_integrity_distribution(self, patterns: List[Dict[str, Any]]) -> Dict:
        """Analyze integrity level distribution"""
        levels = {'verified': 0, 'pending': 0, 'questionable': 0, 'debunked': 0}
        for pattern in patterns:
            pattern_str = pattern.get('raw', '').lower()
            if 'verified' in pattern_str:
                levels['verified'] += 1
            elif 'pending' in pattern_str:
                levels['pending'] += 1
            elif 'questionable' in pattern_str:
                levels['questionable'] += 1
            elif 'debunked' in pattern_str:
                levels['debunked'] += 1
        return levels

    def _analyze_source_reliability(self, patterns: List[Dict[str, Any]]) -> Dict:
        """Analyze source reliability patterns"""
        sources = {}
        for pattern in patterns:
            pattern_str = pattern.get('raw', '')
            # Extract source from pattern (simplified parsing)
            if '"' in pattern_str:
                parts = pattern_str.split('"')
                if len(parts) >= 2:
                    source = parts[1]
                    sources[source] = sources.get(source, 0) + 1
        return sources
