#!/usr/bin/env python3
"""
Climate Witness Chain Demo Script
Interactive demonstration script for hackathon presentations
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.event_service import EventService
from app.services.user_service import UserService
from app.services.metta_service import MeTTaService
from app.services.blockchain_service import BlockchainService

class DemoPresentation:
    """Interactive demo presentation for Climate Witness Chain"""
    
    def __init__(self):
        self.event_service = EventService()
        self.user_service = UserService()
        self.metta_service = MeTTaService()
        self.blockchain_service = BlockchainService()
        
        # Demo scenario data
        self.demo_scenarios = [
            {
                "title": "Drought Emergency in Malawi",
                "description": "Farmer reports severe drought affecting crop yields",
                "event_type": "drought",
                "location": {"lat": -15.7975, "lng": 35.0184, "name": "Central Malawi"},
                "severity": "high",
                "expected_payout": 0.05,
                "story": "John, a local farmer, has been experiencing no rainfall for 3 months. His maize crops are failing and his family's livelihood is at risk."
            },
            {
                "title": "Flash Floods in Bangladesh",
                "description": "Urban flooding displacing families in Dhaka",
                "event_type": "flood",
                "location": {"lat": 23.6978, "lng": 90.3732, "name": "Dhaka, Bangladesh"},
                "severity": "high",
                "expected_payout": 0.05,
                "story": "Monsoon flooding has affected thousands of families, with roads impassable and homes evacuated."
            },
            {
                "title": "Locust Swarm in Kenya",
                "description": "Desert locusts destroying crops across farming regions",
                "event_type": "locust",
                "location": {"lat": -0.0236, "lng": 37.9062, "name": "Central Kenya"},
                "severity": "medium",
                "expected_payout": 0.03,
                "story": "A massive locust swarm is consuming crops and threatening food security for local communities."
            }
        ]
    
    def print_header(self, title: str):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f" {title}")
        print("=" * 80)
    
    def print_step(self, step: int, title: str, description: str = ""):
        """Print formatted step"""
        print(f"\n Step {step}: {title}")
        if description:
            print(f"   {description}")
        print("-" * 50)
    
    def wait_for_enter(self, message: str = "Press Enter to continue..."):
        """Wait for user input"""
        input(f"\n⏸️  {message}")
    
    async def demo_scenario_1_event_submission(self):
        """Demo Scenario 1: Complete event submission workflow"""
        self.print_header("Demo Scenario 1: Event Submission & Verification")
        
        scenario = self.demo_scenarios[0]  # Drought in Malawi
        
        print(f" Scenario: {scenario['title']}")
        print(f" Story: {scenario['story']}")
        
        self.wait_for_enter("Ready to start the demo?")
        
        # Step 1: Create demo user
        self.print_step(1, "Create Demo User", "Generating farmer profile with wallet address")
        
        wallet_info = self.blockchain_service.generate_wallet_address()
        user_data = {
            "name": "John Farmer Demo",
            "email": "john.demo@climatewintess.org",
            "trust_score": 0.85,
            "wallet_address": wallet_info["address"],
            "metadata": json.dumps({
                "role": "farmer",
                "location": scenario["location"]["name"],
                "experience_years": 15,
                "crops": ["maize", "tobacco", "beans"]
            })
        }
        
        user = await self.user_service.create_user(user_data)
        print(f"✅ User created: {user['name']}")
        print(f"   Wallet: {user['wallet_address']}")
        print(f"   Trust Score: {user['trust_score']}")
        
        self.wait_for_enter()
        
        # Step 2: Submit climate event
        self.print_step(2, "Submit Climate Event", "Farmer reports drought conditions")
        
        event_data = {
            "user_id": user["id"],
            "event_type": scenario["event_type"],
            "description": scenario["description"],
            "latitude": scenario["location"]["lat"],
            "longitude": scenario["location"]["lng"],
            "location_name": scenario["location"]["name"],
            "timestamp": datetime.now().isoformat(),
            "photo_path": "demo_drought_malawi.jpg",
            "impact_assessment": "crop_failure",
            "severity": scenario["severity"],
            "metadata": json.dumps({
                "temperature_c": 38,
                "humidity_percent": 15,
                "days_without_rain": 90,
                "affected_area_hectares": 150
            })
        }
        
        print(" Event Details:")
        print(f"   Type: {event_data['event_type']}")
        print(f"   Location: {event_data['location_name']}")
        print(f"   Severity: {event_data['severity']}")
        print(f"   Impact: {event_data['impact_assessment']}")
        
        event = await self.event_service.submit_event(event_data)
        print(f"✅ Event submitted with ID: {event['id']}")
        
        self.wait_for_enter()
        
        # Step 3: MeTTa Verification
        self.print_step(3, "MeTTa Knowledge Verification", "AI agent analyzes event credibility")
        
        print(" MeTTa Analysis in progress...")
        print("   - Checking user trust score...")
        print("   - Verifying location coordinates...")
        print("   - Analyzing temporal consistency...")
        print("   - Cross-referencing weather data...")
        
        # Simulate processing time
        for i in range(3):
            time.sleep(1)
            print("   " + "." * (i + 1))
        
        verification_result = await self.metta_service.verify_event_with_metta(
            event["id"], event_data
        )
        
        print(f"✅ MeTTa Verification Complete!")
        print(f"   Result: {'VERIFIED' if verification_result['verified'] else 'REJECTED'}")
        print(f"   Confidence: {verification_result.get('confidence', 0.85):.2f}")
        print(f"   Trust Score: {verification_result.get('trust_score', user['trust_score']):.2f}")
        
        self.wait_for_enter()
        
        # Step 4: Blockchain Registration
        if verification_result["verified"]:
            self.print_step(4, "Blockchain Registration", "Register verified event on Polygon Mumbai")
            
            print("⛓️ Connecting to Polygon Mumbai testnet...")
            print(" Creating transaction...")
            
            blockchain_result = await self.blockchain_service.register_event_on_blockchain({
                **event_data,
                "user_address": user["wallet_address"]
            })
            
            print(f"✅ Event registered on blockchain!")
            print(f"   Transaction Hash: {blockchain_result.get('transaction_hash', 'N/A')}")
            print(f"   Contract Address: {self.blockchain_service.contract_address or 'Demo Mode'}")
            print(f"   Gas Used: {blockchain_result.get('gas_used', 150000):,}")
            
            self.wait_for_enter()
            
            # Step 5: Smart Contract Payout
            self.print_step(5, "Smart Contract Payout", "Automated insurance payout processing")
            
            print(" Calculating payout amount...")
            print(f"   Severity: {scenario['severity']} → Expected: {scenario['expected_payout']} MATIC")
            print("⚡ Triggering smart contract execution...")
            
            payout_result = await self.blockchain_service.process_payout(
                blockchain_result.get("event_id", ""),
                user["wallet_address"]
            )
            
            if payout_result.get("success"):
                print(f"✅ Payout processed successfully!")
                print(f"   Amount: {payout_result['payout_amount']} MATIC")
                print(f"   Recipient: {user['wallet_address']}")
                print(f"   Transaction: {payout_result['transaction_hash']}")
                print(f"   Status: CONFIRMED")
            
        return {
            "user": user,
            "event": event,
            "verification": verification_result,
            "blockchain": blockchain_result if verification_result["verified"] else None,
            "payout": payout_result if verification_result["verified"] else None
        }
    
    async def demo_scenario_2_multiple_events(self):
        """Demo Scenario 2: Multiple events and real-time updates"""
        self.print_header("Demo Scenario 2: Multiple Events & Real-time Map Updates")
        
        print(" Scenario: Multiple climate events reported simultaneously")
        print(" Story: Various users report different climate events across regions")
        
        self.wait_for_enter("Ready to simulate multiple events?")
        
        # Create multiple users
        users = []
        for i, scenario in enumerate(self.demo_scenarios):
            wallet_info = self.blockchain_service.generate_wallet_address()
            user_data = {
                "name": f"Reporter {i+1}",
                "email": f"reporter{i+1}@demo.org",
                "trust_score": 0.7 + (i * 0.1),
                "wallet_address": wallet_info["address"],
                "metadata": json.dumps({"role": "citizen_reporter", "scenario": scenario["title"]})
            }
            user = await self.user_service.create_user(user_data)
            users.append(user)
        
        print(f"✅ Created {len(users)} demo users")
        
        # Submit multiple events
        events = []
        for i, (user, scenario) in enumerate(zip(users, self.demo_scenarios)):
            print(f"\n Submitting Event {i+1}: {scenario['title']}")
            
            event_data = {
                "user_id": user["id"],
                "event_type": scenario["event_type"],
                "description": scenario["description"],
                "latitude": scenario["location"]["lat"],
                "longitude": scenario["location"]["lng"],
                "location_name": scenario["location"]["name"],
                "timestamp": datetime.now().isoformat(),
                "photo_path": f"demo_{scenario['event_type']}_{i+1}.jpg",
                "severity": scenario["severity"]
            }
            
            event = await self.event_service.submit_event(event_data)
            events.append(event)
            print(f"   ✅ Event {event['id']} submitted")
            
            # Quick verification
            verification = await self.metta_service.verify_event_with_metta(
                event["id"], event_data
            )
            print(f"    Verification: {'VERIFIED' if verification['verified'] else 'PENDING'}")
        
        print(f"\n✅ All {len(events)} events processed")
        print("️ Events now visible on real-time map")
        print(" Statistics updated automatically")
        
        return {"users": users, "events": events}
    
    async def demo_scenario_3_blockchain_features(self):
        """Demo Scenario 3: Advanced blockchain features"""
        self.print_header("Demo Scenario 3: Advanced Blockchain Integration")
        
        print(" Scenario: Demonstrating full blockchain capabilities")
        print(" Story: Insurance policies, event listeners, and transaction tracking")
        
        self.wait_for_enter("Ready to explore blockchain features?")
        
        # Create user with insurance policy
        self.print_step(1, "Create Insurance Policy", "Setting up micro-insurance for farmer")
        
        wallet_info = self.blockchain_service.generate_wallet_address()
        user_data = {
            "name": "Insured Farmer Demo",
            "email": "insured@demo.org",
            "trust_score": 0.90,
            "wallet_address": wallet_info["address"],
            "metadata": json.dumps({"role": "insured_farmer"})
        }
        
        user = await self.user_service.create_user(user_data)
        print(f"✅ User created: {user['name']}")
        
        # Create insurance policy
        policy_result = await self.blockchain_service.create_insurance_policy(
            user["wallet_address"], 0.02
        )
        
        print(f"✅ Insurance Policy Created!")
        print(f"   Premium: {policy_result.get('premium_matic', 0.02)} MATIC")
        print(f"   Coverage: {policy_result.get('coverage_matic', 0.2)} MATIC")
        print(f"   Duration: 365 days")
        
        self.wait_for_enter()
        
        # Start event listener
        self.print_step(2, "Event Listener Demo", "Real-time blockchain event monitoring")
        
        print(" Starting blockchain event listener...")
        self.blockchain_service.start_event_listener()
        print("✅ Event listener active")
        print(" Listening for: EventRegistered, EventVerified, PayoutProcessed")
        
        self.wait_for_enter("Event listener is now active. Continue to see events?")
        
        # Simulate events being triggered
        self.print_step(3, "Live Event Simulation", "Watch events appear in real-time")
        
        # Create and verify an event to trigger blockchain events
        event_data = {
            "user_id": user["id"],
            "event_type": "drought",
            "description": "Live demo drought event for blockchain testing",
            "latitude": -15.7975,
            "longitude": 35.0184,
            "location_name": "Demo Location",
            "timestamp": datetime.now().isoformat(),
            "severity": "high"
        }
        
        event = await self.event_service.submit_event(event_data)
        print(f" Event submitted: {event['id']}")
        
        verification = await self.metta_service.verify_event_with_metta(event["id"], event_data)
        print(f" Event verified: {verification['verified']}")
        
        if verification["verified"]:
            blockchain_result = await self.blockchain_service.register_event_on_blockchain({
                **event_data,
                "user_address": user["wallet_address"]
            })
            print(f"⛓️ Blockchain registration: {blockchain_result.get('transaction_hash', 'N/A')}")
            
            payout_result = await self.blockchain_service.process_payout(
                blockchain_result.get("event_id", ""),
                user["wallet_address"]
            )
            print(f" Payout processed: {payout_result.get('payout_amount', 0)} MATIC")
        
        # Show recent events
        print("\n Recent Blockchain Events:")
        recent_events = self.blockchain_service.get_recent_events(5)
        for i, event in enumerate(recent_events[-3:], 1):
            print(f"   {i}. {event['type']} - {event.get('data', {}).get('transaction_hash', 'N/A')[:10]}...")
        
        return {"user": user, "policy": policy_result, "events": recent_events}
    
    async def run_complete_demo(self):
        """Run the complete demo presentation"""
        self.print_header("Climate Witness Chain - Complete Demo Presentation")
        
        print(" Welcome to the Climate Witness Chain Demo!")
        print(" This demo showcases the complete workflow from event submission to payout")
        print("\n What you'll see:")
        print("   1. Event submission with MeTTa verification")
        print("   2. Multiple events and real-time updates")
        print("   3. Advanced blockchain features")
        
        self.wait_for_enter("Ready to start the demo presentation?")
        
        results = {}
        
        try:
            # Scenario 1
            results["scenario_1"] = await self.demo_scenario_1_event_submission()
            
            self.wait_for_enter("Continue to Scenario 2?")
            
            # Scenario 2
            results["scenario_2"] = await self.demo_scenario_2_multiple_events()
            
            self.wait_for_enter("Continue to Scenario 3?")
            
            # Scenario 3
            results["scenario_3"] = await self.demo_scenario_3_blockchain_features()
            
            # Final summary
            self.print_header("Demo Complete! ")
            
            print(" Demo Summary:")
            print(f"   ✅ Events submitted: {len(results['scenario_2']['events']) + 1}")
            print(f"   ✅ Users created: {len(results['scenario_2']['users']) + 2}")
            print(f"   ✅ Verifications processed: Multiple")
            print(f"   ✅ Blockchain transactions: Multiple")
            print(f"   ✅ Payouts processed: Multiple")
            
            print("\n Climate Witness Chain Features Demonstrated:")
            print("    PWA event submission with GPS")
            print("    MeTTa knowledge verification")
            print("   ⛓️ Blockchain integration (Polygon Mumbai)")
            print("    Automated smart contract payouts")
            print("   ️ Real-time map visualization")
            print("    Live statistics and monitoring")
            
            print("\n Ready for production deployment!")
            
            # Save demo results
            with open("demo_presentation_results.json", "w") as f:
                json.dump({
                    "demo_time": datetime.now().isoformat(),
                    "scenarios_completed": 3,
                    "total_events": len(results['scenario_2']['events']) + 1,
                    "total_users": len(results['scenario_2']['users']) + 2,
                    "blockchain_transactions": "multiple",
                    "demo_status": "completed_successfully"
                }, f, indent=2)
            
        except Exception as e:
            print(f"❌ Demo error: {str(e)}")
            results["error"] = str(e)
        
        return results

def main():
    """Main function for interactive demo"""
    print(" Climate Witness Chain - Interactive Demo")
    print("Choose demo mode:")
    print("1. Complete presentation (all scenarios)")
    print("2. Quick workflow test")
    print("3. Blockchain features only")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    demo = DemoPresentation()
    
    if choice == "1":
        asyncio.run(demo.run_complete_demo())
    elif choice == "2":
        asyncio.run(demo.demo_scenario_1_event_submission())
    elif choice == "3":
        asyncio.run(demo.demo_scenario_3_blockchain_features())
    else:
        print("Invalid choice. Running complete demo...")
        asyncio.run(demo.run_complete_demo())

if __name__ == "__main__":
    main()
