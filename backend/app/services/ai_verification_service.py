"""
AI-powered verification service using Anthropic Claude for image and event validation
"""

import asyncio
import base64
import os
from typing import Dict, Any, Optional, List
import anthropic
import httpx
from datetime import datetime
import logging
import dotenv

dotenv.load_dotenv()

logger = logging.getLogger(__name__)

class AIVerificationService:
    def __init__(self, anthropic_api_key: str = None):
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Initialize Anthropic client
        if self.anthropic_api_key and self.anthropic_api_key != "demo-key":
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
        else:
            self.anthropic_client = None
            logger.warning("Anthropic API key not provided, using fallback verification")
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def verify_climate_event_image(self, image_data: bytes, event_type: str, description: str, location: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Verify if an image shows evidence of the claimed climate event using Anthropic Vision
        """
        try:
            if not self.anthropic_client:
                return await self._fallback_image_verification(event_type, description)
            
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Determine image format (assume JPEG if not specified)
            image_format = "image/jpeg"
            if image_data.startswith(b'\x89PNG'):
                image_format = "image/png"
            elif image_data.startswith(b'GIF'):
                image_format = "image/gif"
            
            # Create verification prompt
            location_info = ""
            if location:
                location_info = f" at coordinates {location.get('latitude', 'unknown')}, {location.get('longitude', 'unknown')}"
            
            prompt = f"""
            Analyze this image to verify if it shows evidence of a {event_type} event{location_info}.
            
            Event description: {description}
            
            Please assess:
            1. Does the image show clear evidence of the claimed climate event type?
            2. Are there any signs of manipulation or staging?
            3. Does the image match the description provided?
            4. What confidence level (0-100) would you assign to this verification?
            
            Respond with a JSON object containing:
            - verified: boolean (true if image supports the claim)
            - confidence: number (0-100)
            - reasoning: string (explanation of your assessment)
            - detected_elements: array of strings (what you see in the image)
            - concerns: array of strings (any red flags or concerns)
            """
            
            # Call Anthropic Vision API
            message = self.anthropic_client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=1000,
                temperature=0.1,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": image_format,
                                    "data": image_base64
                                }
                            }
                        ]
                    }
                ]
            )
            
            # Parse response
            response_text = message.content[0].text
            verification_result = self._parse_verification_response(response_text)
            
            return {
                "success": True,
                "verification": verification_result,
                "timestamp": datetime.now().isoformat(),
                "method": "anthropic_vision"
            }
            
        except Exception as e:
            logger.error(f"AI image verification failed: {e}")
            return await self._fallback_image_verification(event_type, description)
    
    def _parse_verification_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Anthropic's response into structured verification data
        """
        try:
            # Try to extract JSON from response
            import json
            import re
            
            # Look for JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            # Fallback: parse text response
            verified = "verified" in response_text.lower() or "true" in response_text.lower()
            confidence = 70  # Default confidence
            
            # Try to extract confidence number
            confidence_match = re.search(r'confidence[:\s]*(\d+)', response_text, re.IGNORECASE)
            if confidence_match:
                confidence = int(confidence_match.group(1))
            
            return {
                "verified": verified,
                "confidence": confidence,
                "reasoning": response_text[:500],  # Truncate for storage
                "detected_elements": ["climate_event_indicators"],
                "concerns": []
            }
            
        except Exception as e:
            logger.error(f"Failed to parse verification response: {e}")
            return {
                "verified": False,
                "confidence": 0,
                "reasoning": "Failed to parse AI response",
                "detected_elements": [],
                "concerns": ["parsing_error"]
            }
    
    async def _fallback_image_verification(self, event_type: str, description: str) -> Dict[str, Any]:
        """
        Fallback verification when AI is not available
        """
        # Simple heuristic-based verification
        confidence = 60
        verified = True
        
        # Basic checks
        concerns = []
        if len(description) < 10:
            concerns.append("description_too_short")
            confidence -= 20
        
        if event_type not in ["drought", "flood", "wildfire", "locust", "extreme_heat", "storm"]:
            concerns.append("unknown_event_type")
            confidence -= 15
        
        return {
            "success": True,
            "verification": {
                "verified": verified,
                "confidence": max(confidence, 30),
                "reasoning": f"Fallback verification for {event_type} event. AI verification unavailable.",
                "detected_elements": [event_type],
                "concerns": concerns
            },
            "timestamp": datetime.now().isoformat(),
            "method": "fallback_heuristic"
        }
    
    async def verify_event_description(self, description: str, event_type: str, location: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Verify if event description is consistent and realistic
        """
        try:
            if not self.anthropic_client:
                return await self._fallback_description_verification(description, event_type)
            
            location_context = ""
            if location:
                location_context = f" in the region around {location.get('latitude', 'unknown')}, {location.get('longitude', 'unknown')}"
            
            prompt = f"""
            Analyze this climate event description for consistency and realism:
            
            Event Type: {event_type}
            Description: {description}
            Location: {location_context}
            
            Please assess:
            1. Is the description consistent with the claimed event type?
            2. Does it contain realistic details for this type of climate event?
            3. Are there any inconsistencies or red flags?
            4. What confidence level (0-100) would you assign?
            
            Respond with a JSON object containing:
            - consistent: boolean
            - realistic: boolean
            - confidence: number (0-100)
            - analysis: string
            - flags: array of any concerns
            """
            
            message = self.anthropic_client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=500,
                temperature=0.1,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            response_text = message.content[0].text
            analysis = self._parse_description_analysis(response_text)
            
            return {
                "success": True,
                "analysis": analysis,
                "timestamp": datetime.now().isoformat(),
                "method": "anthropic_text"
            }
            
        except Exception as e:
            logger.error(f"Description verification failed: {e}")
            return await self._fallback_description_verification(description, event_type)
    
    def _parse_description_analysis(self, response_text: str) -> Dict[str, Any]:
        """
        Parse description analysis response
        """
        try:
            import json
            import re
            
            # Try to extract JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            # Fallback parsing
            consistent = "consistent" in response_text.lower()
            realistic = "realistic" in response_text.lower()
            confidence = 70
            
            confidence_match = re.search(r'confidence[:\s]*(\d+)', response_text, re.IGNORECASE)
            if confidence_match:
                confidence = int(confidence_match.group(1))
            
            return {
                "consistent": consistent,
                "realistic": realistic,
                "confidence": confidence,
                "analysis": response_text[:300],
                "flags": []
            }
            
        except Exception:
            return {
                "consistent": True,
                "realistic": True,
                "confidence": 50,
                "analysis": "Failed to parse analysis",
                "flags": ["parsing_error"]
            }
    
    async def _fallback_description_verification(self, description: str, event_type: str) -> Dict[str, Any]:
        """
        Fallback description verification
        """
        # Simple keyword-based analysis
        event_keywords = {
            "drought": ["dry", "water", "rain", "livestock", "crops", "arid"],
            "flood": ["water", "rain", "river", "overflow", "submerged", "flooding"],
            "wildfire": ["fire", "smoke", "burn", "flame", "forest", "vegetation"],
            "locust": ["swarm", "insects", "crops", "vegetation", "damage"],
            "extreme_heat": ["temperature", "hot", "heat", "degrees", "celsius"],
            "storm": ["wind", "rain", "thunder", "lightning", "cyclone"]
        }
        
        keywords = event_keywords.get(event_type, [])
        description_lower = description.lower()
        
        matches = sum(1 for keyword in keywords if keyword in description_lower)
        confidence = min(90, 40 + (matches * 10))
        
        flags = []
        if len(description) < 20:
            flags.append("description_too_short")
        if matches == 0:
            flags.append("no_relevant_keywords")
        
        return {
            "success": True,
            "analysis": {
                "consistent": matches > 0,
                "realistic": len(description) > 10,
                "confidence": confidence,
                "analysis": f"Keyword analysis found {matches} relevant terms",
                "flags": flags
            },
            "timestamp": datetime.now().isoformat(),
            "method": "fallback_keywords"
        }
    
    async def map_user_problem_to_event_type(self, user_problem: str) -> Dict[str, Any]:
        """
        Map user's problem description to available event types using AI
        """
        try:
            available_types = ["drought", "flood", "wildfire", "locust", "extreme_heat", "storm"]
            
            if not self.anthropic_client:
                return await self._fallback_problem_mapping(user_problem, available_types)
            
            prompt = f"""
            A user has described a climate-related problem. Map it to the most appropriate event type from our available categories.
            
            User's problem: "{user_problem}"
            
            Available event types:
            - drought: Lack of water, dry conditions, failed crops
            - flood: Excessive water, flooding, water damage
            - wildfire: Fires, burning vegetation, smoke
            - locust: Insect swarms, crop damage from locusts
            - extreme_heat: Unusually high temperatures, heat waves
            - storm: Strong winds, thunderstorms, cyclones
            
            Respond with a JSON object containing:
            - event_type: string (the best matching type)
            - confidence: number (0-100)
            - reasoning: string (why this type was chosen)
            - alternative_types: array (other possible matches)
            """
            
            message = self.anthropic_client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=300,
                temperature=0.1,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            response_text = message.content[0].text
            mapping = self._parse_mapping_response(response_text, available_types)
            
            return {
                "success": True,
                "mapping": mapping,
                "timestamp": datetime.now().isoformat(),
                "method": "anthropic_mapping"
            }
            
        except Exception as e:
            logger.error(f"Problem mapping failed: {e}")
            return await self._fallback_problem_mapping(user_problem, available_types)
    
    def _parse_mapping_response(self, response_text: str, available_types: List[str]) -> Dict[str, Any]:
        """
        Parse AI mapping response
        """
        try:
            import json
            import re
            
            # Try to extract JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                # Validate event_type is in available types
                if result.get("event_type") in available_types:
                    return result
            
            # Fallback: look for event type mentions
            for event_type in available_types:
                if event_type in response_text.lower():
                    return {
                        "event_type": event_type,
                        "confidence": 70,
                        "reasoning": f"Found mention of {event_type} in response",
                        "alternative_types": []
                    }
            
            # Default fallback
            return {
                "event_type": "drought",  # Most common
                "confidence": 30,
                "reasoning": "Could not determine specific type, defaulting to drought",
                "alternative_types": available_types
            }
            
        except Exception:
            return {
                "event_type": "drought",
                "confidence": 20,
                "reasoning": "Failed to parse mapping response",
                "alternative_types": available_types
            }
    
    async def _fallback_problem_mapping(self, user_problem: str, available_types: List[str]) -> Dict[str, Any]:
        """
        Fallback problem mapping using keywords
        """
        problem_lower = user_problem.lower()
        
        # Keyword mapping
        type_keywords = {
            "drought": ["dry", "water shortage", "no rain", "arid", "livestock dying", "crops failing"],
            "flood": ["flooding", "too much water", "river overflow", "submerged", "water damage"],
            "wildfire": ["fire", "burning", "smoke", "forest fire", "vegetation burning"],
            "locust": ["locusts", "swarm", "insects eating crops", "pest invasion"],
            "extreme_heat": ["very hot", "heat wave", "high temperature", "too hot"],
            "storm": ["strong wind", "cyclone", "hurricane", "thunderstorm", "heavy rain"]
        }
        
        scores = {}
        for event_type, keywords in type_keywords.items():
            score = sum(1 for keyword in keywords if keyword in problem_lower)
            if score > 0:
                scores[event_type] = score
        
        if scores:
            best_type = max(scores, key=scores.get)
            confidence = min(80, scores[best_type] * 20)
        else:
            best_type = "drought"  # Default
            confidence = 30
        
        return {
            "success": True,
            "mapping": {
                "event_type": best_type,
                "confidence": confidence,
                "reasoning": f"Keyword-based mapping found matches for {best_type}",
                "alternative_types": list(scores.keys()) if scores else available_types
            },
            "timestamp": datetime.now().isoformat(),
            "method": "fallback_keywords"
        }

# Global AI verification service instance
ai_verification_service = AIVerificationService()

async def verify_climate_image(image_data: bytes, event_type: str, description: str, location: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Convenience function to verify climate event image
    """
    async with AIVerificationService() as service:
        return await service.verify_climate_event_image(image_data, event_type, description, location)

async def verify_event_description(description: str, event_type: str, location: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Convenience function to verify event description
    """
    async with AIVerificationService() as service:
        return await service.verify_event_description(description, event_type, location)

async def map_problem_to_event_type(user_problem: str) -> Dict[str, Any]:
    """
    Convenience function to map user problem to event type
    """
    async with AIVerificationService() as service:
        return await service.map_user_problem_to_event_type(user_problem)
