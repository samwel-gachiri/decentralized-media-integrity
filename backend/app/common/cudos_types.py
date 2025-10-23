"""
Common data structures and classes shared across services
"""
from dataclasses import dataclass
from typing import List, Dict, Any
import uuid

@dataclass
class CUDOSInferenceRequest:
    """CUDOS ASI Cloud inference request"""
    model: str
    prompt: str
    max_tokens: int = 1000
    temperature: float = 0.7
    top_p: float = 0.9
    stream: bool = False

@dataclass
class CUDOSInferenceResponse:
    """CUDOS ASI Cloud inference response"""
    id: str
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]
    created: int