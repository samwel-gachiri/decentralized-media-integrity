from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional, List
from app.services.blockchain_service import BlockchainService
import threading
import atexit

router = APIRouter()

# Global blockchain service instance
blockchain_service = BlockchainService()

# Thread safety lock
_listener_lock = threading.Lock()
_listener_started = False

# Global event callback for API integration
def blockchain_event_callback(event):
    """Callback function for blockchain events"""
    print(f" Blockchain Event: {event['type']} - {event.get('data', {})}")

def initialize_blockchain_listener():
    """Initialize the blockchain event listener safely"""
    global _listener_started
    
    with _listener_lock:
        if not _listener_started:
            try:
                # Check if the service has a method to check if listener is already running
                if hasattr(blockchain_service, 'is_listening') and not blockchain_service.is_listening:
                    blockchain_service.start_event_listener(blockchain_event_callback)
                    _listener_started = True
                    print("✅ Blockchain event listener started successfully")
                elif not hasattr(blockchain_service, 'is_listening'):
                    # Fallback for services without is_listening attribute
                    blockchain_service.start_event_listener(blockchain_event_callback)
                    _listener_started = True
                    print("✅ Blockchain event listener started successfully")
                else:
                    print("ℹ️ Blockchain event listener already running")
            except Exception as e:
                print(f"⚠️ Failed to start blockchain event listener: {str(e)}")
                # Don't raise the exception to prevent blocking the entire API

def cleanup_blockchain_listener():
    """Clean up the blockchain event listener on shutdown"""
    try:
        if hasattr(blockchain_service, 'stop_event_listener'):
            blockchain_service.stop_event_listener()
            print(" Blockchain event listener stopped")
    except Exception as e:
        print(f"⚠️ Error stopping blockchain event listener: {str(e)}")

# Register cleanup function
atexit.register(cleanup_blockchain_listener)

# Initialize listener when the module loads (but safely)
initialize_blockchain_listener()

@router.post("/deploy-contract")
async def deploy_contract():
    """Deploy ClimateInsurance smart contract to Polygon Mumbai testnet"""
    try:
        result = await blockchain_service.deploy_contract()
        
        if result["success"]:
            return {
                "message": "Smart contract deployed successfully",
                **result
            }
        else:
            return {
                "message": "Smart contract deployment failed",
                **result
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")

@router.post("/register-event")
async def register_event_on_blockchain(event_data: Dict):
    """Register a climate event on the blockchain"""
    try:
        result = await blockchain_service.register_event_on_blockchain(event_data)
        
        if result["success"]:
            return {
                "message": "Event registered on blockchain successfully",
                **result
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Event registration failed: {str(e)}")

@router.post("/verify-event")
async def verify_event_on_blockchain(verify_data: Dict):
    """Verify an event on the blockchain"""
    try:
        event_id = verify_data.get("event_id")
        severity = verify_data.get("severity", "medium")
        
        if not event_id:
            raise HTTPException(status_code=400, detail="event_id is required")
        
        result = await blockchain_service.verify_event_on_blockchain(event_id, severity)
        
        if result["success"]:
            return {
                "message": "Event verified on blockchain successfully",
                **result
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Event verification failed: {str(e)}")

@router.post("/trigger-payout")
async def trigger_payout(payout_data: Dict):
    """Trigger smart contract payout for verified event"""
    try:
        event_id = payout_data.get("event_id")
        recipient_address = payout_data.get("recipient_address")
        
        if not event_id or not recipient_address:
            raise HTTPException(status_code=400, detail="event_id and recipient_address are required")
        
        # Validate recipient address
        if not blockchain_service.validate_address(recipient_address):
            raise HTTPException(status_code=400, detail="Invalid recipient address")
        
        result = await blockchain_service.process_payout(event_id, recipient_address)
        
        if result["success"]:
            return {
                "message": "Payout processed successfully",
                **result
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payout processing failed: {str(e)}")

@router.post("/create-policy")
async def create_insurance_policy(policy_data: Dict):
    """Create an insurance policy for a user"""
    try:
        user_address = policy_data.get("user_address")
        premium = policy_data.get("premium", 0.01)
        
        if not user_address:
            raise HTTPException(status_code=400, detail="user_address is required")
        
        # Validate user address
        if not blockchain_service.validate_address(user_address):
            raise HTTPException(status_code=400, detail="Invalid user address")
        
        result = await blockchain_service.create_insurance_policy(user_address, premium)
        
        if result["success"]:
            return {
                "message": "Insurance policy created successfully",
                **result
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Policy creation failed: {str(e)}")

@router.get("/transaction/{tx_hash}")
async def get_transaction_status(tx_hash: str):
    """Get blockchain transaction status"""
    try:
        result = await blockchain_service.get_transaction_status(tx_hash)
        
        return {
            "message": "Transaction status retrieved successfully",
            **result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transaction status: {str(e)}")

@router.get("/contract-info")
async def get_contract_info():
    """Get deployed contract information and network status"""
    try:
        result = await blockchain_service.get_contract_info()
        
        return {
            "message": "Contract information retrieved successfully",
            **result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get contract info: {str(e)}")

@router.post("/generate-wallet")
async def generate_wallet():
    """Generate a new wallet address for user registration"""
    try:
        result = blockchain_service.generate_wallet_address()
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "message": "Wallet generated successfully",
            **result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wallet generation failed: {str(e)}")

@router.get("/network-status")
async def get_network_status():
    """Get blockchain network connection status"""
    try:
        is_connected = blockchain_service.is_connected()
        deployer_balance = blockchain_service.get_balance(blockchain_service.deployer_account.address)
        
        return {
            "network": "Polygon Mumbai Testnet",
            "chain_id": blockchain_service.chain_id,
            "connected": is_connected,
            "rpc_url": blockchain_service.rpc_url,
            "deployer_address": blockchain_service.deployer_account.address,
            "deployer_balance": deployer_balance,
            "contract_deployed": blockchain_service.contract_address is not None,
            "contract_address": blockchain_service.contract_address,
            "funding_info": {
                "faucet_url": "https://faucet.polygon.technology/",
                "instructions": "Get testnet MATIC to deploy and interact with contracts"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get network status: {str(e)}")

@router.post("/fund-contract")
async def fund_contract(fund_data: Dict):
    """Add funds to the contract (for testing)"""
    try:
        amount = fund_data.get("amount", 0.1)  # Default 0.1 MATIC
        
        # For demo purposes, simulate funding
        return {
            "message": f"Contract funded with {amount} MATIC (simulated)",
            "amount": amount,
            "transaction_hash": f"0x{''.join([str(i) for i in range(64)])}",
            "note": "This is a simulated transaction for demo purposes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract funding failed: {str(e)}")

@router.get("/demo/setup")
async def demo_setup():
    """Set up the blockchain demo environment"""
    try:
        # Check if contract is already loaded
        if not blockchain_service.contract_address:
            blockchain_service.load_deployed_contract()
        
        # If still no contract, suggest deployment
        if not blockchain_service.contract_address:
            return {
                "message": "Demo setup required",
                "steps": [
                    "1. Deploy contract using POST /api/blockchain/deploy-contract",
                    "2. Fund the deployer account with testnet MATIC",
                    "3. Create insurance policies for users",
                    "4. Register and verify climate events"
                ],
                "deployer_address": blockchain_service.deployer_account.address,
                "faucet_url": "https://faucet.polygon.technology/"
            }
        
        return {
            "message": "Demo environment ready",
            "contract_address": blockchain_service.contract_address,
            "network": "Polygon Mumbai Testnet",
            "deployer_balance": blockchain_service.get_balance(blockchain_service.deployer_account.address),
            "next_steps": [
                "Register climate events on blockchain",
                "Verify events and trigger payouts",
                "Create insurance policies for users"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo setup failed: {str(e)}")

# Event Listener Endpoints for Task 9
@router.get("/events")
async def get_recent_blockchain_events(limit: int = 20):
    """Get recent blockchain events"""
    try:
        events = blockchain_service.get_recent_events(limit)
        return {
            "success": True,
            "events": events,
            "total_count": len(events),
            "listening": blockchain_service.is_listening if hasattr(blockchain_service, 'is_listening') else False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get events: {str(e)}")

@router.post("/events/start-listener")
async def start_event_listener():
    """Start the blockchain event listener"""
    try:
        # Use the safe initialization function
        with _listener_lock:
            result = blockchain_service.start_event_listener(blockchain_event_callback)
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start listener: {str(e)}")

@router.post("/events/stop-listener")
async def stop_event_listener():
    """Stop the blockchain event listener"""
    try:
        global _listener_started
        with _listener_lock:
            result = blockchain_service.stop_event_listener()
            _listener_started = False
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop listener: {str(e)}")

@router.delete("/events")
async def clear_recent_events():
    """Clear recent blockchain events"""
    try:
        result = blockchain_service.clear_recent_events()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear events: {str(e)}")

@router.get("/events/status")
async def get_event_listener_status():
    """Get the status of the event listener"""
    try:
        return {
            "success": True,
            "is_listening": blockchain_service.is_listening if hasattr(blockchain_service, 'is_listening') else False,
            "active_listeners": len(blockchain_service.event_listeners) if hasattr(blockchain_service, 'event_listeners') else 0,
            "recent_events_count": len(blockchain_service.recent_events) if hasattr(blockchain_service, 'recent_events') else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")