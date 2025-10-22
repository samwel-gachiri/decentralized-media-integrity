from typing import Dict, Any, Optional, List, Callable
import json
import os
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from datetime import datetime
import uuid
import hashlib
import threading
import time
import logging
from concurrent.futures import ThreadPoolExecutor, Future
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BlockchainService:
    """Service for blockchain and smart contract interactions with improved thread management"""
    
    def __init__(self, simulation_mode: bool = False):
        # Polygon Mumbai testnet configuration
        self.rpc_url = "https://rpc-mumbai.maticvigil.com"  # Public RPC
        self.chain_id = 80001
        self.simulation_mode = simulation_mode
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Add PoA middleware for Polygon
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Contract configuration
        self.contract_address = None
        self.contract_abi = self._load_contract_abi()
        self.contract = None
        
        # Event listener configuration
        self.event_listeners: List[Callable] = []
        self.recent_events: List[Dict] = []
        self.max_recent_events = 50
        
        # Thread management
        self.listener_thread: Optional[threading.Thread] = None
        self.is_listening = False
        self._stop_event = threading.Event()
        self.thread_lock = threading.RLock()
        
        # Thread pool for async operations
        self.thread_pool = ThreadPoolExecutor(max_workers=5, thread_name_prefix="blockchain_")
        
        # Account configuration
        self.deployer_private_key = self._get_or_create_private_key()
        self.deployer_account = Account.from_key(self.deployer_private_key)
        
        logger.info(f" Blockchain service initialized")
        logger.info(f"   Network: Polygon Mumbai Testnet")
        logger.info(f"   Chain ID: {self.chain_id}")
        logger.info(f"   Deployer address: {self.deployer_account.address}")
        logger.info(f"   Connected: {self.w3.is_connected()}")
    
    def __del__(self):
        """Cleanup resources when object is destroyed"""
        self.stop_event_listener()
        self.thread_pool.shutdown(wait=False)
    
    def _get_or_create_private_key(self) -> str:
        """Get or create a private key for demo purposes"""
        private_key_file = "demo_private_key.txt"
        
        if os.path.exists(private_key_file):
            with open(private_key_file, 'r') as f:
                return f.read().strip()
        else:
            # Create new account for demo
            account = Account.create()
            with open(private_key_file, 'w') as f:
                f.write(account.key.hex())
            logger.warning(f"⚠️ Created new demo account: {account.address}")
            logger.warning(f"⚠️ Please fund this account with Mumbai testnet MATIC")
            logger.warning(f"   Get testnet MATIC from: https://faucet.polygon.technology/")
            return account.key.hex()
    
    def _load_contract_abi(self) -> List[Dict]:
        """Load the contract ABI"""
        # Fixed ABI with proper string termination
        return [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "eventId", "type": "bytes32"},
                    {"indexed": True, "name": "reporter", "type": "address"},
                    {"indexed": False, "name": "eventType", "type": "string"}
                ],
                "name": "EventRegistered",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "eventId", "type": "bytes32"},
                    {"indexed": True, "name": "verifier", "type": "address"}
                ],
                "name": "EventVerified",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "eventId", "type": "bytes32"},
                    {"indexed": True, "name": "recipient", "type": "address"},
                    {"indexed": False, "name": "amount", "type": "uint256"}
                ],
                "name": "PayoutProcessed",
                "type": "event"
            },
            {
                "inputs": [
                    {"name": "eventId", "type": "bytes32"},
                    {"name": "eventType", "type": "string"},
                    {"name": "metaData", "type": "string"}
                ],
                "name": "registerEvent",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "eventId", "type": "bytes32"},
                    {"name": "severity", "type": "string"}
                ],
                "name": "verifyEvent",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "eventId", "type": "bytes32"}
                ],
                "name": "processPayout",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "createPolicy",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "addFunds",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "eventId", "type": "bytes32"}
                ],
                "name": "getEvent",
                "outputs": [
                    {"name": "reporter", "type": "address"},
                    {"name": "eventType", "type": "string"},
                    {"name": "timestamp", "type": "uint256"},
                    {"name": "verified", "type": "bool"},
                    {"name": "payoutProcessed", "type": "bool"},
                    {"name": "payoutAmount", "type": "uint256"},
                    {"name": "metaData", "type": "string"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "user", "type": "address"}
                ],
                "name": "getPolicy",
                "outputs": [
                    {"name": "premium", "type": "uint256"},
                    {"name": "coverage", "type": "uint256"},
                    {"name": "startDate", "type": "uint256"},
                    {"name": "endDate", "type": "uint256"},
                    {"name": "active", "type": "bool"},
                    {"name": "claimsCount", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getContractStats",
                "outputs": [
                    {"name": "contractBalance", "type": "uint256"},
                    {"name": "totalPool", "type": "uint256"},
                    {"name": "activeEvents", "type": "uint256"},
                    {"name": "totalPayouts", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "user", "type": "address"}
                ],
                "name": "hasActivePolicy",
                "outputs": [
                    {"name": "", "type": "bool"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "eventType", "type": "string"},
                    {"name": "severity", "type": "string"}
                ],
                "name": "getPayoutAmount",
                "outputs": [
                    {"name": "", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3.is_connected()
    
    def get_balance(self, address: str) -> float:
        """Get ETH balance for an address"""
        try:
            balance_wei = self.w3.eth.get_balance(address)
            return self.w3.from_wei(balance_wei, 'ether')
        except Exception as e:
            logger.error(f"❌ Error getting balance: {str(e)}")
            return 0.0
    
    def generate_event_id(self, event_data: Dict) -> str:
        """Generate a unique event ID for blockchain"""
        content = f"{event_data.get('user_id')}{event_data.get('event_type')}{event_data.get('timestamp')}{event_data.get('latitude')}{event_data.get('longitude')}"
        return '0x' + hashlib.sha256(content.encode()).hexdigest()
    
    async def deploy_contract(self) -> Dict[str, Any]:
        """Deploy the ClimateInsurance smart contract"""
        try:
            if not self.is_connected():
                raise Exception("Not connected to blockchain")
            
            # Check deployer balance
            balance = self.get_balance(self.deployer_account.address)
            if balance < 0.01:
                return {
                    "success": False,
                    "error": f"Insufficient balance. Current: {balance} MATIC. Need at least 0.01 MATIC for deployment.",
                    "funding_info": {
                        "address": self.deployer_account.address,
                        "faucet_url": "https://faucet.polygon.technology/",
                        "instructions": "Please fund this address with Mumbai testnet MATIC"
                    }
                }
            
            # Simulate contract deployment
            simulated_contract_address = "0x" + hashlib.sha256(f"ClimateInsurance_{datetime.now().isoformat()}".encode()).hexdigest()[:40]
            
            self.contract_address = simulated_contract_address
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.contract_abi)
            
            # Save contract address for future use
            with open("deployed_contract_address.txt", "w") as f:
                f.write(self.contract_address)
            
            return {
                "success": True,
                "contract_address": self.contract_address,
                "deployer": self.deployer_account.address,
                "transaction_hash": "0x" + str(uuid.uuid4()).replace("-", ""),
                "gas_used": 2500000,
                "deployment_cost": "0.01 MATIC",
                "note": "This is a simulated deployment for demo purposes"
            }
            
        except Exception as e:
            logger.error(f"Contract deployment failed: {str(e)}")
            return {
                "success": False,
                "error": f"Contract deployment failed: {str(e)}"
            }
    
    def load_deployed_contract(self) -> bool:
        """Load previously deployed contract"""
        try:
            if os.path.exists("deployed_contract_address.txt"):
                with open("deployed_contract_address.txt", "r") as f:
                    self.contract_address = f.read().strip()
                    self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.contract_abi)
                    return True
            return False
        except Exception as e:
            logger.error(f"❌ Error loading contract: {str(e)}")
            return False
    
    async def register_event_on_blockchain(self, event_data: Dict) -> Dict[str, Any]:
        """Register a climate event on the blockchain"""
        try:
            if not self.contract:
                return {"success": False, "error": "Contract not deployed"}
            
            event_id = self.generate_event_id(event_data)
            event_type = event_data.get('event_type', '')
            
            # Create metadata JSON
            metadata = {
                "latitude": event_data.get('latitude'),
                "longitude": event_data.get('longitude'),
                "description": event_data.get('description', ''),
                "photo_path": event_data.get('photo_path', ''),
                "timestamp": event_data.get('timestamp', datetime.now().isoformat())
            }
            
            # For demo purposes, simulate the transaction
            tx_hash = "0x" + str(uuid.uuid4()).replace("-", "")
            
            # Only trigger event if not in simulation mode or if explicitly requested
            if not self.simulation_mode:
                # Real blockchain interaction would go here
                logger.info(f"Blockchain Event: EventRegistered - {{'event_id': '{event_id}', 'reporter': '{event_data.get('user_address', self.deployer_account.address)}', 'event_type': '{event_type}'}}")
            else:
                # Trigger simulated EventRegistered event
                self.simulate_blockchain_event("EventRegistered", {
                    "event_id": event_id,
                    "reporter": event_data.get('user_address', self.deployer_account.address),
                    "event_type": event_type,
                    "location": f"{event_data.get('latitude', 0)},{event_data.get('longitude', 0)}",
                    "transaction_hash": tx_hash
                })
            
            return {
                "success": True,
                "event_id": event_id,
                "transaction_hash": tx_hash,
                "contract_address": self.contract_address,
                "gas_used": 150000,
                "metadata": metadata,
                "note": "Simulated blockchain transaction for demo"
            }
            
        except Exception as e:
            logger.error(f"Failed to register event: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to register event: {str(e)}"
            }
    
    async def verify_event_on_blockchain(self, event_id: str, severity: str = "medium") -> Dict[str, Any]:
        """Verify an event on the blockchain"""
        try:
            if not self.contract:
                return {"success": False, "error": "Contract not deployed"}
            
            # For demo purposes, simulate the transaction
            tx_hash = "0x" + str(uuid.uuid4()).replace("-", "")
            
            # Only trigger event if not in simulation mode or if explicitly requested
            if not self.simulation_mode:
                # Real blockchain interaction would go here
                logger.info(f"Blockchain Event: EventVerified - {{'event_id': '{event_id}', 'verifier': '{self.deployer_account.address}', 'verification_result': 'verified', 'severity': '{severity}'}}")
            else:
                # Trigger simulated EventVerified event
                self.simulate_blockchain_event("EventVerified", {
                    "event_id": event_id,
                    "verifier": self.deployer_account.address,
                    "verification_result": "verified",
                    "severity": severity,
                    "transaction_hash": tx_hash
                })
            
            return {
                "success": True,
                "event_id": event_id,
                "severity": severity,
                "transaction_hash": tx_hash,
                "gas_used": 120000,
                "verifier": self.deployer_account.address,
                "note": "Simulated verification transaction for demo"
            }
            
        except Exception as e:
            logger.error(f"Failed to verify event: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to verify event: {str(e)}"
            }
    
    async def process_payout(self, event_id: str, recipient_address: str) -> Dict[str, Any]:
        """Process insurance payout for verified event"""
        try:
            if not self.contract:
                return {"success": False, "error": "Contract not deployed"}
            
            # Calculate payout amount
            payout_amount_wei = self.w3.to_wei(0.01, 'ether')
            payout_amount_matic = 0.01
            
            # For demo purposes, simulate the transaction
            tx_hash = "0x" + str(uuid.uuid4()).replace("-", "")
            
            # Only trigger event if not in simulation mode or if explicitly requested
            if not self.simulation_mode:
                # Real blockchain interaction would go here
                logger.info(f"Blockchain Event: PayoutProcessed - {{'event_id': '{event_id}', 'recipient': '{recipient_address}', 'amount': {payout_amount_matic}, 'currency': 'MATIC'}}")
            else:
                # Trigger simulated PayoutProcessed event
                self.simulate_blockchain_event("PayoutProcessed", {
                    "event_id": event_id,
                    "recipient": recipient_address,
                    "amount": payout_amount_matic,
                    "currency": "MATIC",
                    "transaction_hash": tx_hash
                })
            
            return {
                "success": True,
                "event_id": event_id,
                "recipient": recipient_address,
                "payout_amount": payout_amount_matic,
                "payout_amount_wei": str(payout_amount_wei),
                "transaction_hash": tx_hash,
                "gas_used": 100000,
                "note": "Simulated payout transaction for demo"
            }
            
        except Exception as e:
            logger.error(f"Failed to process payout: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to process payout: {str(e)}"
            }
    
    async def create_insurance_policy(self, user_address: str, premium_matic: float = 0.01) -> Dict[str, Any]:
        """Create an insurance policy for a user"""
        try:
            if not self.contract:
                return {"success": False, "error": "Contract not deployed"}
            
            premium_wei = self.w3.to_wei(premium_matic, 'ether')
            coverage_amount = premium_matic * 10
            
            # For demo purposes, simulate the transaction
            tx_hash = "0x" + str(uuid.uuid4()).replace("-", "")
            
            return {
                "success": True,
                "user_address": user_address,
                "premium_matic": premium_matic,
                "coverage_matic": coverage_amount,
                "start_date": datetime.now().isoformat(),
                "end_date": datetime.fromtimestamp(datetime.now().timestamp() + 365*24*3600).isoformat(),
                "transaction_hash": tx_hash,
                "gas_used": 180000,
                "note": "Simulated policy creation for demo"
            }
            
        except Exception as e:
            logger.error(f"Failed to create policy: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to create policy: {str(e)}"
            }
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get the status of a blockchain transaction"""
        try:
            return {
                "transaction_hash": tx_hash,
                "status": "confirmed",
                "block_number": 12345678,
                "gas_used": 150000,
                "gas_price": "20000000000",
                "confirmation_count": 12,
                "timestamp": datetime.now().isoformat(),
                "note": "Simulated transaction status for demo"
            }
            
        except Exception as e:
            logger.error(f"Failed to get transaction status: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to get transaction status: {str(e)}"
            }
    
    async def get_contract_info(self) -> Dict[str, Any]:
        """Get information about the deployed contract"""
        try:
            balance = 0.0
            if self.contract_address:
                balance = self.get_balance(self.contract_address)
            
            return {
                "contract_address": self.contract_address,
                "network": "Polygon Mumbai Testnet",
                "chain_id": self.chain_id,
                "contract_balance": balance,
                "deployer": self.deployer_account.address,
                "deployer_balance": self.get_balance(self.deployer_account.address),
                "is_connected": self.is_connected(),
                "rpc_url": self.rpc_url,
                "funding_info": {
                    "faucet_url": "https://faucet.polygon.technology/",
                    "instructions": "Get testnet MATIC to interact with the contract"
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get contract info: {str(e)}")
            return {
                "success": False,
                "error": "Failed to get contract info: {str(e)}"
            }
    
    def generate_wallet_address(self) -> Dict[str, str]:
        """Generate a new wallet address for user registration"""
        try:
            account = Account.create()
            
            return {
                "address": account.address,
                "private_key": account.key.hex(),
                "note": "Store private key securely - this is for demo purposes only"
            }
            
        except Exception as e:
            logger.error(f"Failed to generate wallet: {str(e)}")
            return {
                "error": f"Failed to generate wallet: {str(e)}"
            }
    
    def validate_address(self, address: str) -> bool:
        """Validate Ethereum address format"""
        try:
            return self.w3.is_address(address)
        except:
            return False
    
    # Event Listener Methods with improved thread management
    def add_event_to_recent(self, event: Dict[str, Any]):
        """Add event to recent events list"""
        event['id'] = str(uuid.uuid4())
        event['timestamp'] = datetime.now().isoformat()
        self.recent_events.append(event)
        
        if len(self.recent_events) > self.max_recent_events:
            self.recent_events.pop(0)
    
    def simulate_blockchain_event(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate a blockchain event for demo purposes"""
        event = {
            "type": event_type,
            "block_number": 12345678 + len(self.recent_events),
            "transaction_hash": "0x" + str(uuid.uuid4()).replace("-", ""),
            "gas_used": 150000,
            "data": data,
            "contract_address": self.contract_address or "0x" + "0" * 40
        }
        
        self.add_event_to_recent(event)
        
        # Notify all listeners
        for callback in self.event_listeners:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"❌ Error in event callback: {str(e)}")
        
        return event
    
    def start_event_listener(self, callback=None):
        """Start listening for blockchain events with proper thread management"""
        with self.thread_lock:
            if callback and callback not in self.event_listeners:
                self.event_listeners.append(callback)
            
            if self.is_listening:
                return {"success": True, "message": "Event listener already running"}
            
            # Clear any previous stop event
            self._stop_event.clear()
            
            def poll_events():
                """Background thread for blockchain event polling"""
                mode_text = "(simulated)" if self.simulation_mode else "(real-time)"
                logger.info(f" Blockchain event listener started {mode_text}")
                self.is_listening = True
                
                try:
                    while not self._stop_event.is_set():
                        try:
                            # Poll every 30 seconds or until stopped
                            if self._stop_event.wait(30):
                                break
                            
                            # Only simulate events if in simulation mode
                            if self.simulation_mode:
                                import random
                                event_types = ["EventRegistered", "EventVerified", "PayoutProcessed", "PolicyCreated"]
                                
                                if random.random() < 0.3:
                                    event_type = random.choice(event_types)
                                
                                if event_type == "EventRegistered":
                                    event_data = {
                                        "event_id": "0x" + uuid.uuid4().hex[:64],
                                        "reporter": "0x" + uuid.uuid4().hex[:40],
                                        "event_type": random.choice(["drought", "flood", "locust", "extreme_heat"]),
                                        "location": f"{random.uniform(-90, 90):.6f},{random.uniform(-180, 180):.6f}"
                                    }
                                elif event_type == "EventVerified":
                                    event_data = {
                                        "event_id": "0x" + uuid.uuid4().hex[:64],
                                        "verifier": self.deployer_account.address,
                                        "verification_result": random.choice(["verified", "rejected"]),
                                        "severity": random.choice(["low", "medium", "high"])
                                    }
                                elif event_type == "PayoutProcessed":
                                    event_data = {
                                        "event_id": "0x" + uuid.uuid4().hex[:64],
                                        "recipient": "0x" + uuid.uuid4().hex[:40],
                                        "amount": random.uniform(0.01, 0.1),
                                        "currency": "MATIC"
                                    }
                                else:
                                    event_data = {
                                        "policy_holder": "0x" + uuid.uuid4().hex[:40],
                                        "premium": random.uniform(0.01, 0.05),
                                        "coverage": random.uniform(0.1, 0.5),
                                        "duration": "365 days"
                                    }
                                    
                                    self.simulate_blockchain_event(event_type, event_data)
                                    logger.info(f" Simulated {event_type} event")
                            else:
                                # Real blockchain event polling would go here
                                # For now, just wait without generating fake events
                                pass
                        
                        except Exception as e:
                            logger.error(f"❌ Error in event polling: {str(e)}")
                            time.sleep(5)
                
                finally:
                    self.is_listening = False
                    logger.info(" Blockchain event listener stopped")
            
            # Create and start new thread
            self.listener_thread = threading.Thread(
                target=poll_events, 
                daemon=True,
                name="blockchain_event_listener"
            )
            self.listener_thread.start()
            
            return {"success": True, "message": "Event listener started"}
    
    def stop_event_listener(self):
        """Stop the event listener gracefully"""
        with self.thread_lock:
            if not self.is_listening:
                return {"success": True, "message": "Event listener not running"}
            
            logger.info(" Stopping event listener...")
            self._stop_event.set()
            self.is_listening = False
            
            if self.listener_thread and self.listener_thread.is_alive():
                # Wait for thread to finish with timeout
                self.listener_thread.join(timeout=5.0)
                if self.listener_thread.is_alive():
                    logger.warning("⚠️ Event listener thread did not stop gracefully")
            
            self.listener_thread = None
            return {"success": True, "message": "Event listener stopped"}
    
    def restart_event_listener(self, callback=None):
        """Restart the event listener"""
        self.stop_event_listener()
        time.sleep(1)  # Brief pause
        return self.start_event_listener(callback)
    
    def get_listener_status(self) -> Dict[str, Any]:
        """Get the current status of the event listener"""
        return {
            "is_listening": self.is_listening,
            "listener_thread_alive": self.listener_thread.is_alive() if self.listener_thread else False,
            "event_listener_count": len(self.event_listeners),
            "recent_events_count": len(self.recent_events)
        }
    
    def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent blockchain events"""
        return self.recent_events[-limit:] if self.recent_events else []
    
    def clear_recent_events(self):
        """Clear the recent events list"""
        self.recent_events.clear()
        return {"success": True, "message": "Recent events cleared"}
    
    def execute_in_thread(self, func: Callable, *args, **kwargs) -> Future:
        """Execute a function in the thread pool"""
        return self.thread_pool.submit(func, *args, **kwargs)
    
    async def execute_async(self, func: Callable, *args, **kwargs):
        """Execute a function asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.thread_pool, func, *args, **kwargs)

# Singleton instance for easy access - default to real-time mode
blockchain_service = BlockchainService(simulation_mode=False)
