"""
Alert System API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict

from app.services.alert_service import EnhancedAlertService, AlertSubscription
from fastapi import WebSocket, WebSocketDisconnect

router = APIRouter()
alert_service = EnhancedAlertService()
websocket_manager = alert_service.websocket_manager

class CreateEarlyWarningRequest(BaseModel):
    latitude: float
    longitude: float
    event_types: List[str]
    confidence: float

class CreateEmergencyAlertRequest(BaseModel):
    event_id: str
    emergency_level: int  # 1-5

class AlertSubscriptionRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    radius_km: float = 50.0
    alert_types: List[str] = ["early_warning", "event_verified", "high_risk"]
    severity_threshold: str = "medium"
    notification_methods: List[str] = ["websocket"]

@router.get("/user/{user_id}")
async def get_user_alerts(user_id: str, include_expired: bool = False, crud = None):
    """Get alerts for a user"""
    alerts = await alert_service.get_user_alerts(user_id, include_expired)
    return {"alerts": alerts, "total": len(alerts)}

@router.get("/location")
async def get_location_alerts(latitude: float, longitude: float, radius: float = 50.0, crud = None):
    """Get alerts for a location"""
    alerts = await alert_service.get_active_alerts_by_location(latitude, longitude, radius)
    return {"alerts": alerts, "total": len(alerts)}

@router.post("/early-warning")
async def create_early_warning(request: CreateEarlyWarningRequest, crud = None):
    """Create early warning alert"""
    result = await alert_service.create_early_warning_alert(
        {"latitude": request.latitude, "longitude": request.longitude},
        request.event_types,
        request.confidence
    )
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    return result

@router.post("/event-verified/{event_id}")
async def create_event_alert(event_id: str, crud = None):
    """Create alert for verified event"""
    result = await alert_service.create_event_verified_alert(event_id)
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    return result

@router.get("/stats")
async def get_alert_stats(crud = None):
    """Get alert system statistics"""
    return await alert_service.get_alert_stats()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time alerts"""
    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back for testing
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id)

@router.post("/subscribe")
async def subscribe_to_alerts(
    request: AlertSubscriptionRequest,
    crud = None
):
    """Subscribe user to real-time alerts"""
    try:
        subscription = AlertSubscription(
            user_id=request.user_id,
            location={"latitude": request.latitude, "longitude": request.longitude},
            radius_km=request.radius_km,
            alert_types=set(request.alert_types),
            severity_threshold=request.severity_threshold,
            notification_methods=set(request.notification_methods)
        )
        
        result = await alert_service.subscribe_user_to_alerts(request.user_id, subscription)
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/metta-prediction")
async def create_metta_prediction_alert(
    latitude: float,
    longitude: float,
    timeframe_hours: int = 24,
    crud = None
):
    """Create prediction alert using MeTTa AI logic"""
    try:
        result = await alert_service.generate_metta_prediction_alert(
            {"latitude": latitude, "longitude": longitude},
            timeframe_hours
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emergency")
async def create_emergency_alert(
    request: CreateEmergencyAlertRequest,
    crud = None
):
    """Create emergency response alert"""
    try:
        result = await alert_service.create_emergency_response_alert(
            request.event_id,
            request.emergency_level
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/effectiveness")
async def get_alert_effectiveness(crud = None):
    """Get alert system effectiveness metrics"""
    try:
        metrics = await alert_service.get_alert_effectiveness_metrics()
        return {
            "message": "Alert system effectiveness metrics",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/demo/create-sample-alerts")
async def demo_create_sample_alerts(crud = None):
    """Demo: Create sample alerts with enhanced features"""
    try:
        results = []
        
        # Create MeTTa prediction alert
        metta_prediction = await alert_service.generate_metta_prediction_alert(
            {"latitude": -1.2921, "longitude": 36.8219},  # Nairobi coordinates
            24
        )
        results.append(metta_prediction)
        
        # Create early warning alert
        early_warning = await alert_service.create_early_warning_alert(
            {"latitude": -1.2921, "longitude": 36.8219},
            ["drought", "extreme_heat"],
            0.85
        )
        results.append(early_warning)
        
        # Create high risk alert
        high_risk = await alert_service.create_high_risk_alert(
            {"latitude": -1.2921, "longitude": 36.8219},
            ["Water scarcity", "Crop failure risk", "Livestock stress"]
        )
        results.append(high_risk)
        
        successful = len([r for r in results if r.get('success', False)])
        
        return {
            "message": f"Created {successful} enhanced sample alerts",
            "results": results,
            "features_demonstrated": [
                "MeTTa AI prediction alerts",
                "Real-time WebSocket notifications",
                "Enhanced actionable guidance",
                "Escalation level management"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))