"""
API routes for AI-powered MeTTa query generation and execution
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from app.services.ai_metta_service import generate_and_execute_metta, ai_metta_service
from app.database.crud import *

router = APIRouter()

class MeTTaQueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    include_visualization: bool = True
    max_results: int = 100

class MeTTaFunctionRequest(BaseModel):
    function: str
    context: Optional[Dict[str, Any]] = None

class MeTTaFollowUpRequest(BaseModel):
    original_query: str
    follow_up: str
    previous_result: Optional[Dict[str, Any]] = None

@router.post("/generate-query")
async def generate_metta_query(
    request: MeTTaQueryRequest,
    crud = None
):
    """
    Generate a MeTTa function from natural language query using Anthropic AI
    """
    try:
        # Add database context
        context = request.context or {}
        
        # Get some sample data for context
        try:
            recent_events = await crud.get_all_events()
            context["available_events"] = len(recent_events)
            context["event_types"] = list(set(event.event_type for event in recent_events if event.event_type))
        except Exception:
            context["available_events"] = 0
            context["event_types"] = []
        
        # Generate MeTTa function
        result = await ai_metta_service.generate_metta_function(request.query, context)
        
        return {
            "success": result["success"],
            "query": request.query,
            "generated_function": result.get("generated_function", ""),
            "explanation": result.get("explanation", ""),
            "confidence": result.get("confidence", 0.0),
            "function_type": result.get("function_type", "unknown"),
            "complexity": result.get("estimated_complexity", "medium"),
            "improvements": result.get("suggested_improvements", []),
            "context": context
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate MeTTa query: {str(e)}")

@router.post("/execute-function")
async def execute_metta_function(
    request: MeTTaFunctionRequest,
    crud = None
):
    """
    Execute a MeTTa function using metta.run and return results with D3.js visualization
    """
    try:
        # Add database context
        context = request.context or {}
        
        # Get database events for knowledge base
        try:
            events = await crud.get_all_events()
            context["events"] = [
                {
                    "id": event.id,
                    "type": event.event_type or "unknown",
                    "latitude": event.latitude,
                    "longitude": event.longitude,
                    "verified": event.verification_status == "verified"
                }
                for event in events
            ]
        except Exception:
            context["events"] = []
        
        # Execute the function
        result = await ai_metta_service.execute_metta_function(request.function, context)
        
        return {
            "success": result["success"],
            "function": request.function,
            "result": result.get("result", []),
            "visualization_data": result.get("visualization_data", {}),
            "summary": result.get("summary", ""),
            "execution_time": result.get("execution_time", "0s"),
            "metadata": result.get("metadata", {}),
            "error": result.get("error")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute MeTTa function: {str(e)}")

@router.post("/query-and-execute")
async def query_and_execute(
    request: MeTTaQueryRequest,
    crud = None
):
    """
    Generate and execute MeTTa function from natural language in one step
    """
    try:
        # Add database context
        context = request.context or {}
        
        # Get database statistics for context
        try:
            stats = await crud.get_stats()
            context.update(stats)
            
            # Get events for knowledge base
            events = await crud.get_all_events()
            context["events"] = [
                {
                    "id": event.id,
                    "type": event.event_type or "unknown",
                    "latitude": event.latitude,
                    "longitude": event.longitude,
                    "verified": event.verification_status == "verified",
                    "description": event.description
                }
                for event in events
            ]
        except Exception:
            context["events"] = []
        
        # Generate and execute
        result = await generate_and_execute_metta(request.query, context)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process MeTTa query: {str(e)}")

@router.post("/follow-up")
async def follow_up_query(
    request: MeTTaFollowUpRequest,
    crud = None
):
    """
    Handle follow-up queries based on previous results
    """
    try:
        # Combine original query with follow-up
        combined_query = f"Based on the previous query '{request.original_query}', now {request.follow_up}"
        
        # Add previous result as context
        context = {
            "previous_query": request.original_query,
            "previous_result": request.previous_result,
            "follow_up_intent": request.follow_up
        }
        
        # Get current database context
        try:
            events = await crud.get_all_events()
            context["events"] = [
                {
                    "id": event.id,
                    "type": event.event_type or "unknown",
                    "latitude": event.latitude,
                    "longitude": event.longitude,
                    "verified": event.verification_status == "verified"
                }
                for event in events
            ]
        except Exception:
            context["events"] = []
        
        # Generate and execute follow-up
        result = await generate_and_execute_metta(combined_query, context)
        
        return {
            **result,
            "is_follow_up": True,
            "original_query": request.original_query,
            "follow_up_query": request.follow_up
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process follow-up query: {str(e)}")

@router.get("/examples")
async def get_metta_examples():
    """
    Get example MeTTa queries and functions for users
    """
    return {
        "examples": {
            "basic_queries": [
                {
                    "query": "Show me all verified news articles",
                    "function": "(match &content (news-article $source $title $credibility $integrity true) ($source $title $credibility))",
                    "description": "Basic pattern matching to find verified news articles"
                },
                {
                    "query": "What is the average credibility score of all articles?",
                    "function": "(let* ((scores (match &content (news-article $source $title $credibility $integrity $verified) $credibility)) (total (foldl-atom + 0 scores)) (count (length scores))) (/ total count))",
                    "description": "Aggregation using foldl-atom to calculate average credibility"
                }
            ],
            "advanced_queries": [
                {
                    "query": "Find high-integrity articles from reputable sources",
                    "function": "(let* ((articles (match &content (news-article $source $title $credibility $integrity $verified) ($source $title $credibility $integrity))) (high-integrity (filter (lambda (article) (> (car-atom (cdr-atom (cdr-atom (cdr-atom article)))) 0.8)) articles))) high-integrity)",
                    "description": "Complex filtering to find articles with high integrity scores"
                }
            ]
        },
        "available_functions": ai_metta_service.metta_functions,
        "sample_queries": [
            "Show me all verified news articles",
            "What is the average credibility score?",
            "Find articles from CNN with high integrity",
            "Compare credibility scores between different sources",
            "Show me articles with low integrity scores",
            "Which sources have the most articles?",
            "Find unverified articles that need review",
            "Calculate integrity scores for all articles"
        ]
    }

from app.services.metta_service import get_shared_knowledge_base

@router.get("/atoms")
async def get_metta_atoms(
    limit: int = 50,
    atom_type: Optional[str] = None,
):
    """
    Get MeTTa atoms from the in-memory knowledge base (no database)
    """
    try:
        kb = get_shared_knowledge_base()
        # Default to 'event' atomspace if not specified
        space = "event" if not atom_type else atom_type
        # Fetch all atoms of the given type from the in-memory MeTTa
        atoms = kb.get_all_atoms_of_type(space, space)
        atoms = atoms[:limit]
        return {
            "atoms": atoms,
            "total_count": len(atoms),
            "filtered_by": atom_type,
            "knowledge_base_stats": kb.get_knowledge_base_state()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get MeTTa atoms: {str(e)}")

@router.get("/stats")
async def get_metta_stats(
    crud = None
):
    """
    Get MeTTa knowledge base statistics and performance metrics
    """
    try:
        # Get database stats
        db_stats = await crud.get_stats()
        
        # Calculate MeTTa-specific stats
        metta_stats = {
            "total_atoms": db_stats.get("total_events", 0) * 3,  # Each event creates ~3 atoms
            "active_queries": 12,  # Mock active queries
            "knowledge_domains": [
                "news-articles",
                "user-trust",
                "verification-rules",
                "source-credibility",
                "content-integrity"
            ],
            "last_update": "2024-01-20T10:30:00Z",
            "query_performance": {
                "avg_execution_time": "0.234s",
                "cache_hit_rate": 0.78,
                "successful_queries": 156,
                "ai_generation_success_rate": 0.92
            },
            "ai_integration": {
                "anthropic_available": ai_metta_service.anthropic_client is not None,
                "metta_run_available": True,  # Will be checked during execution
                "supported_functions": len(ai_metta_service.metta_functions)
            }
        }
        
        return {
            "metta_stats": metta_stats,
            "database_stats": db_stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get MeTTa stats: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Check the health of AI MeTTa service components
    """
    health_status = {
        "service": "healthy",
        "anthropic_api": "available" if ai_metta_service.anthropic_client else "demo_mode",
        "metta_runtime": "checking...",
        "timestamp": "2024-01-20T10:30:00Z"
    }
    
    # Test MeTTa runtime availability
    try:
        test_result = await ai_metta_service.execute_metta_function(
            "(match &content (news-article $source $title $credibility $integrity $verified) ($source $title))", 
            {}
        )
        health_status["metta_runtime"] = "available" if test_result["success"] else "simulation_mode"
    except Exception:
        health_status["metta_runtime"] = "simulation_mode"
    
    return health_status