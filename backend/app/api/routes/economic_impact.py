"""
Economic Impact API Routes
Handles economic impact analysis and prediction endpoints for the Climate Witness DAO
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.services.economic_impact_service import EconomicImpactService

router = APIRouter()

# Global economic impact service instance
economic_impact_service = EconomicImpactService()

# Request/Response Models
class ImpactAnalysisRequest(BaseModel):
    event_id: str

class ImpactPredictionRequest(BaseModel):
    event_id: str
    impact_type: str  # crop_failure, livestock_death, infrastructure_damage, water_scarcity

class ImpactAnalyticsRequest(BaseModel):
    region: Optional[str] = None
    timeframe_days: int = 365

class ImpactReportRequest(BaseModel):
    event_id: str

@router.post("/analyze")
async def analyze_economic_impact(
    request: ImpactAnalysisRequest,
    crud = None
):
    """Analyze economic impact for an event using MeTTa correlation logic"""
    try:
        result = await economic_impact_service.analyze_economic_impact(request.event_id)
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('error', 'Analysis failed'))
        
        return {
            "message": "Economic impact analysis completed successfully",
            "event_id": result['event_id'],
            "correlations": result['correlations'],
            "predictions": result['predictions'],
            "comprehensive_assessment": result['comprehensive_assessment'],
            "analysis_timestamp": result['analysis_timestamp']
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze economic impact: {str(e)}")

@router.post("/predict")
async def predict_impact_probability(
    request: ImpactPredictionRequest,
    crud = None
):
    """Predict probability of specific economic impact"""
    try:
        result = await economic_impact_service.predict_impact_probability(
            request.event_id,
            request.impact_type
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('error', 'Prediction failed'))
        
        return {
            "message": "Impact probability prediction completed",
            "event_id": request.event_id,
            "impact_type": request.impact_type,
            "prediction": result['prediction']
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict impact probability: {str(e)}")

@router.post("/analytics")
async def get_impact_analytics(
    request: ImpactAnalyticsRequest,
    crud = None
):
    """Get comprehensive impact analytics for a region or globally"""
    try:
        result = await economic_impact_service.get_impact_analytics(
            request.region,
            request.timeframe_days
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('error', 'Analytics failed'))
        
        return {
            "message": "Impact analytics retrieved successfully",
            "analytics": result['analytics']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get impact analytics: {str(e)}")

@router.post("/report")
async def generate_impact_report(
    request: ImpactReportRequest,
    crud = None
):
    """Generate comprehensive impact report for an event"""
    try:
        result = await economic_impact_service.generate_impact_report(request.event_id)
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('error', 'Report generation failed'))
        
        return {
            "message": "Impact report generated successfully",
            "report": result['report']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate impact report: {str(e)}")

@router.get("/event/{event_id}/impacts")
async def get_event_impacts(
    event_id: str,
    crud = None
):
    """Get all impact analyses for a specific event"""
    try:
        # Get stored analysis results
        atoms = await crud.get_atoms_by_event(event_id)
        impact_analyses = []
        
        for atom in atoms:
            if atom.atom_type == 'economic_analysis':
                import json
                analysis_data = json.loads(atom.atom_content)
                impact_analyses.append(analysis_data)
        
        return {
            "event_id": event_id,
            "total_analyses": len(impact_analyses),
            "analyses": impact_analyses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get event impacts: {str(e)}")

@router.get("/types")
async def get_impact_types():
    """Get available impact types for prediction"""
    return {
        "impact_types": [
            {
                "id": "crop_failure",
                "name": "Crop Failure",
                "description": "Damage or loss of agricultural crops"
            },
            {
                "id": "livestock_death",
                "name": "Livestock Death",
                "description": "Death or injury of livestock animals"
            },
            {
                "id": "infrastructure_damage",
                "name": "Infrastructure Damage",
                "description": "Damage to roads, buildings, and utilities"
            },
            {
                "id": "water_scarcity",
                "name": "Water Scarcity",
                "description": "Shortage of clean water supply"
            },
            {
                "id": "economic_loss",
                "name": "Economic Loss",
                "description": "General economic impact and financial losses"
            }
        ]
    }

@router.get("/correlations/{event_type}")
async def get_event_type_correlations(
    event_type: str,
    crud = None
):
    """Get historical correlations for a specific event type"""
    try:
        # Get all events of this type
        all_events = await crud.get_all_events()
        events_of_type = [e for e in all_events if e.event_type == event_type]
        
        # Calculate basic statistics
        total_events = len(events_of_type)
        verified_events = len([e for e in events_of_type if e.verification_status == 'verified'])
        
        # Get impact mappings
        impact_mappings = economic_impact_service.event_impact_mappings.get(event_type, [])
        
        return {
            "event_type": event_type,
            "total_events": total_events,
            "verified_events": verified_events,
            "verification_rate": verified_events / total_events if total_events > 0 else 0,
            "common_impacts": impact_mappings,
            "historical_data": {
                "sample_size": verified_events,
                "data_quality": "medium" if verified_events > 10 else "low"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get correlations: {str(e)}")

@router.get("/dashboard/overview")
async def get_impact_dashboard_overview(
    timeframe_days: int = 30,
    crud = None
):
    """Get overview data for impact dashboard"""
    try:
        # Get analytics for the timeframe
        analytics_result = await economic_impact_service.get_impact_analytics(
            region=None,
            timeframe_days=timeframe_days
        )
        
        if not analytics_result.get('success', False):
            raise HTTPException(status_code=500, detail="Failed to get analytics")
        
        analytics = analytics_result['analytics']
        
        # Calculate additional metrics
        high_risk_events = 0
        total_predictions = 0
        
        for impact_data in analytics.get('impact_data', []):
            prediction = impact_data.get('predictions', {})
            if prediction.get('probability', 0) > 0.7:
                high_risk_events += 1
            total_predictions += 1
        
        return {
            "timeframe_days": timeframe_days,
            "summary": {
                "total_events": analytics['total_events'],
                "verified_events": analytics['verified_events'],
                "verification_rate": analytics['verification_rate'],
                "total_economic_loss": analytics['total_economic_loss'],
                "average_loss_per_event": analytics['average_loss_per_event'],
                "high_risk_events": high_risk_events,
                "risk_rate": high_risk_events / total_predictions if total_predictions > 0 else 0
            },
            "event_distribution": analytics['event_type_distribution'],
            "recent_impacts": analytics['impact_data']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard overview: {str(e)}")

@router.get("/trends/{event_type}")
async def get_impact_trends(
    event_type: str,
    timeframe_days: int = 365,
    crud = None
):
    """Get impact trends for a specific event type"""
    try:
        from datetime import datetime, timedelta
        
        # Get events of this type in the timeframe
        cutoff_date = datetime.now() - timedelta(days=timeframe_days)
        all_events = await crud.get_all_events()
        
        events_of_type = [
            e for e in all_events 
            if (e.event_type == event_type and 
                e.timestamp and e.timestamp >= cutoff_date)
        ]
        
        # Group events by month
        monthly_data = {}
        for event in events_of_type:
            month_key = event.timestamp.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'count': 0,
                    'verified': 0,
                    'estimated_loss': 0
                }
            
            monthly_data[month_key]['count'] += 1
            if event.verification_status == 'verified':
                monthly_data[month_key]['verified'] += 1
                # Add estimated loss (simplified calculation)
                monthly_data[month_key]['estimated_loss'] += 10000  # Placeholder
        
        # Convert to list format
        trends = []
        for month, data in sorted(monthly_data.items()):
            trends.append({
                'month': month,
                'event_count': data['count'],
                'verified_count': data['verified'],
                'verification_rate': data['verified'] / data['count'] if data['count'] > 0 else 0,
                'estimated_loss': data['estimated_loss']
            })
        
        return {
            "event_type": event_type,
            "timeframe_days": timeframe_days,
            "total_events": len(events_of_type),
            "trends": trends
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get impact trends: {str(e)}")

@router.post("/batch-analyze")
async def batch_analyze_events(
    event_ids: List[str],
    crud = None
):
    """Analyze economic impact for multiple events"""
    try:
        results = []
        
        for event_id in event_ids:
            try:
                result = await economic_impact_service.analyze_economic_impact(event_id)
                results.append({
                    'event_id': event_id,
                    'success': result.get('success', False),
                    'analysis': result if result.get('success') else None,
                    'error': result.get('error') if not result.get('success') else None
                })
            except Exception as e:
                results.append({
                    'event_id': event_id,
                    'success': False,
                    'analysis': None,
                    'error': str(e)
                })
        
        successful_analyses = len([r for r in results if r['success']])
        
        return {
            "message": f"Batch analysis completed: {successful_analyses}/{len(event_ids)} successful",
            "total_events": len(event_ids),
            "successful_analyses": successful_analyses,
            "failed_analyses": len(event_ids) - successful_analyses,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform batch analysis: {str(e)}")