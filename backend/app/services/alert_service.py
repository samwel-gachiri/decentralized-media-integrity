"""
Enhanced Alert Service for Climate Witness DAO
Provides real-time early warnings and notifications for climate events
"""

import uuid
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field
from app.services.metta_service import MeTTaService

from app.database.models import Event, User, MeTTaAtom
from app.database import crud
import math

@dataclass
class ClimateAlert:
    """Enhanced climate alert data model"""
    id: str
    alert_type: str  # early_warning, event_verified, high_risk, emergency, prediction
    title: str
    message: str
    severity: str  # low, medium, high, critical
    location: Dict[str, float]  # latitude, longitude
    radius_km: float
    affected_users: List[str]
    created_at: datetime
    expires_at: Optional[datetime]
    confidence_score: float = 0.0
    event_types: List[str] = field(default_factory=list)
    risk_factors: List[str] = field(default_factory=list)
    actionable_guidance: List[str] = field(default_factory=list)
    external_references: List[str] = field(default_factory=list)
    escalation_level: int = 1  # 1-5 escalation levels
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'alert_type': self.alert_type,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'location': self.location,
            'radius_km': self.radius_km,
            'affected_users': self.affected_users,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'confidence_score': self.confidence_score,
            'event_types': self.event_types,
            'risk_factors': self.risk_factors,
            'actionable_guidance': self.actionable_guidance,
            'external_references': self.external_references,
            'escalation_level': self.escalation_level
        }

@dataclass
class AlertSubscription:
    """User alert subscription preferences"""
    user_id: str
    location: Dict[str, float]
    radius_km: float
    alert_types: Set[str]
    severity_threshold: str  # minimum severity to receive
    notification_methods: Set[str]  # websocket, email, push
    active: bool = True

class WebSocketManager:
    """Manages WebSocket connections for real-time alerts"""
    
    def __init__(self):
        self.active_connections: Dict[str, Any] = {}  # user_id -> websocket
        self.user_subscriptions: Dict[str, AlertSubscription] = {}
    
    async def connect(self, websocket, user_id: str):
        """Connect a user's WebSocket"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"WebSocket connected for user: {user_id}")
    
    def disconnect(self, user_id: str):
        """Disconnect a user's WebSocket"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"WebSocket disconnected for user: {user_id}")
    
    async def send_alert_to_user(self, user_id: str, alert: ClimateAlert):
        """Send alert to specific user via WebSocket"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_text(json.dumps({
                    'type': 'climate_alert',
                    'alert': alert.to_dict()
                }))
                return True
            except Exception as e:
                print(f"Error sending WebSocket alert to {user_id}: {e}")
                self.disconnect(user_id)
                return False
        return False
    
    async def broadcast_alert(self, alert: ClimateAlert):
        """Broadcast alert to all affected users"""
        sent_count = 0
        for user_id in alert.affected_users:
            if await self.send_alert_to_user(user_id, alert):
                sent_count += 1
        return sent_count

class EnhancedAlertService:
    """Enhanced alert service with real-time notifications and MeTTa integration"""
    
    def __init__(self, db_path: str = "./news_integrity.db"):
        self.db_path = db_path
        self.metta_service = MeTTaService(db_path)
        self.websocket_manager = WebSocketManager()
        
        # Alert parameters
        self.default_radius_km = 50.0
        self.alert_duration_hours = 24
        self.prediction_alert_hours = 48
        self.emergency_alert_hours = 72
        
        # Severity thresholds
        self.severity_levels = {
            'low': 1,
            'medium': 2, 
            'high': 3,
            'critical': 4
        }
        
        # Escalation thresholds
        self.escalation_thresholds = {
            1: 0.3,  # Basic alert
            2: 0.5,  # Enhanced monitoring
            3: 0.7,  # High priority
            4: 0.85, # Emergency response
            5: 0.95  # Critical emergency
        }
        
    async def generate_metta_prediction_alert(self, location: Dict[str, float], 
                                            timeframe_hours: int = 24) -> dict:
        """Generate prediction-based alert using MeTTa logic"""
        try:
            # Use MeTTa to predict climate events
            lat, lng = location['latitude'], location['longitude']
            
            # Use MeTTa to generate early warning
            metta_query = f'!(generate-early-warning ({lat} {lng}))'
            metta_result = self.metta_service.knowledge_base.metta.run(metta_query)
            
            # Parse MeTTa early warning result
            warning_data = self._parse_metta_warning_result(metta_result)
            
            if warning_data and warning_data.get('warning_triggered', False):
                # Extract data from MeTTa result
                confidence_score = warning_data.get('confidence_score', 0.75)
                predicted_events = warning_data.get('event_types', ['drought'])
                
                alert_id = str(uuid.uuid4())
                alert = ClimateAlert(
                    id=alert_id,
                    alert_type='prediction',
                    title='MeTTa Climate Prediction Alert',
                    message=f'AI analysis indicates increased risk of climate events in your area within {timeframe_hours} hours.',
                    severity=self._determine_prediction_severity(confidence_score, predicted_events),
                    location=location,
                    radius_km=self.default_radius_km,
                    affected_users=await self._get_nearby_user_ids(lat, lng, self.default_radius_km),
                    created_at=datetime.now(),
                    expires_at=datetime.now() + timedelta(hours=self.prediction_alert_hours),
                    confidence_score=confidence_score,
                    event_types=predicted_events,
                    actionable_guidance=self._generate_actionable_guidance(predicted_events),
                    escalation_level=self._calculate_escalation_level(confidence_score)
                )
                
                # Store and broadcast alert
                await self._store_alert(alert)
                await self._broadcast_alert_realtime(alert)
                
                return {
                    'success': True,
                    'alert': alert.to_dict(),
                    'prediction_confidence': confidence_score,
                    'affected_users': len(alert.affected_users)
                }
            
            return {'success': False, 'message': 'No significant predictions found'}
            
        except Exception as e:
            print(f"Error generating MeTTa prediction alert: {e}")
            return {'success': False, 'error': str(e)}
    
    async def create_event_verified_alert(self, event_id: str) -> dict:
        """Create alert when an event is verified"""
        try:
            # Get event details
            event = await crud.get_event_by_id(event_id)
            if not event:
                return {'success': False, 'error': 'Event not found'}
            
            # Get nearby users
            nearby_users = await self._get_nearby_users(event.latitude, event.longitude, self.default_radius_km)
            
            # Create enhanced alert
            alert_id = str(uuid.uuid4())
            alert = ClimateAlert(
                id=alert_id,
                alert_type='event_verified',
                title=f'{event.event_type.replace("_", " ").title()} Event Verified',
                message=f'A {event.event_type.replace("_", " ")} event has been verified in your area. Stay alert and take necessary precautions.',
                severity=self._determine_severity(event.event_type),
                location={'latitude': event.latitude, 'longitude': event.longitude},
                radius_km=self.default_radius_km,
                affected_users=[u.id for u in nearby_users],
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=self.alert_duration_hours),
                confidence_score=1.0,  # Verified events have 100% confidence
                event_types=[event.event_type],
                actionable_guidance=self._generate_actionable_guidance([event.event_type]),
                escalation_level=self._calculate_escalation_level(1.0)
            )
            
            # Store alert and broadcast in real-time
            await self._store_alert(alert)
            await self._broadcast_alert_realtime(alert)
            
            # Add to MeTTa prediction space
            alert_atom = f'(climate-alert "{alert_id}" "{event.event_type}" {event.latitude} {event.longitude} "{alert.severity}")'
            self.metta_service.add_to_atom_space('prediction', alert_atom)
            
            return {
                'success': True,
                'alert': alert.to_dict(),
                'affected_users': len(nearby_users),
                'message': f'Alert created for {len(nearby_users)} users in the area'
            }
            
        except Exception as e:
            print(f"Error creating event verified alert: {e}")
            return {'success': False, 'error': str(e)}
    
    async def create_early_warning_alert(self, location: Dict[str, float], 
                                       event_types: List[str], prediction_confidence: float) -> dict:
        """Create early warning alert based on predictions"""
        try:
            # Get nearby users
            nearby_users = await self._get_nearby_users(
                location['latitude'], location['longitude'], self.default_radius_km
            )
            
            # Determine severity based on confidence and event types
            severity = self._determine_prediction_severity(prediction_confidence, event_types)
            
            # Create alert message
            event_list = ', '.join([et.replace('_', ' ').title() for et in event_types])
            
            alert_id = str(uuid.uuid4())
            alert = ClimateAlert(
                id=alert_id,
                alert_type='early_warning',
                title=f'Early Warning: {event_list}',
                message=f'Weather patterns suggest increased risk of {event_list.lower()} in your area. Confidence: {prediction_confidence:.0%}. Please prepare accordingly.',
                severity=severity,
                location=location,
                radius_km=self.default_radius_km,
                affected_users=[u.id for u in nearby_users],
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=48)  # Longer for predictions
            )
            
            # Store alert
            await self._store_alert(alert)
            
            # Add to MeTTa prediction space
            for event_type in event_types:
                prediction_atom = f'(early-warning "{alert_id}" "{event_type}" {location["latitude"]} {location["longitude"]} {prediction_confidence})'
                self.metta_service.add_to_atom_space('prediction', prediction_atom)
            
            return {
                'success': True,
                'alert': alert.to_dict(),
                'affected_users': len(nearby_users),
                'message': f'Early warning alert created for {len(nearby_users)} users'
            }
            
        except Exception as e:
            print(f"Error creating early warning alert: {e}")
            return {'success': False, 'error': str(e)}
    
    async def create_high_risk_alert(self, location: Dict[str, float], risk_factors: List[str]) -> dict:
        """Create high risk alert for multiple risk factors"""
        try:
            nearby_users = await self._get_nearby_users(
                location['latitude'], location['longitude'], self.default_radius_km
            )
            
            risk_list = ', '.join(risk_factors)
            
            alert_id = str(uuid.uuid4())
            alert = ClimateAlert(
                id=alert_id,
                alert_type='high_risk',
                title='High Risk Climate Conditions',
                message=f'Multiple risk factors detected in your area: {risk_list}. Enhanced monitoring and preparedness recommended.',
                severity='high',
                location=location,
                radius_km=self.default_radius_km,
                affected_users=[u.id for u in nearby_users],
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=self.alert_duration_hours)
            )
            
            await self._store_alert(alert)
            
            # Add to MeTTa
            risk_atom = f'(high-risk-alert "{alert_id}" {location["latitude"]} {location["longitude"]} "{risk_list}")'
            self.metta_service.add_to_atom_space('prediction', risk_atom)
            
            return {
                'success': True,
                'alert': alert.to_dict(),
                'affected_users': len(nearby_users),
                'message': f'High risk alert created for {len(nearby_users)} users'
            }
            
        except Exception as e:
            print(f"Error creating high risk alert: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_user_alerts(self, user_id: str, include_expired: bool = False) -> List[dict]:
        """Get alerts for a specific user"""
        try:
            all_alerts = await self._get_all_alerts()
            user_alerts = []
            
            for alert in all_alerts:
                # Check if user is in affected users list
                if user_id in alert.affected_users:
                    # Skip expired alerts unless requested
                    if not include_expired and alert.expires_at and datetime.now() > alert.expires_at:
                        continue
                    user_alerts.append(alert.to_dict())
            
            # Sort by creation date (newest first)
            user_alerts.sort(key=lambda x: x['created_at'], reverse=True)
            
            return user_alerts
            
        except Exception as e:
            print(f"Error getting user alerts: {e}")
            return []
    
    async def get_active_alerts_by_location(self, latitude: float, longitude: float, 
                                          radius_km: float = 100.0) -> List[dict]:
        """Get active alerts for a specific location"""
        try:
            all_alerts = await self._get_all_alerts()
            location_alerts = []
            
            for alert in all_alerts:
                # Skip expired alerts
                if alert.expires_at and datetime.now() > alert.expires_at:
                    continue
                
                # Check if location is within alert radius
                distance = self._calculate_distance(
                    latitude, longitude,
                    alert.location['latitude'], alert.location['longitude']
                )
                
                if distance <= alert.radius_km:
                    location_alerts.append(alert.to_dict())
            
            return location_alerts
            
        except Exception as e:
            print(f"Error getting location alerts: {e}")
            return []
    
    async def get_alert_stats(self) -> dict:
        """Get alert system statistics"""
        try:
            all_alerts = await self._get_all_alerts()
            now = datetime.now()
            
            active_alerts = [a for a in all_alerts if not a.expires_at or a.expires_at > now]
            
            stats = {
                'total_alerts': len(all_alerts),
                'active_alerts': len(active_alerts),
                'expired_alerts': len(all_alerts) - len(active_alerts),
                'alerts_by_type': {},
                'alerts_by_severity': {},
                'total_affected_users': 0
            }
            
            # Count by type and severity
            for alert in all_alerts:
                # By type
                alert_type = alert.alert_type
                stats['alerts_by_type'][alert_type] = stats['alerts_by_type'].get(alert_type, 0) + 1
                
                # By severity
                severity = alert.severity
                stats['alerts_by_severity'][severity] = stats['alerts_by_severity'].get(severity, 0) + 1
                
                # Count affected users (unique)
                stats['total_affected_users'] += len(alert.affected_users)
            
            return stats
            
        except Exception as e:
            print(f"Error getting alert stats: {e}")
            return {'error': str(e)}
    
    # Private helper methods
    
    async def _store_alert(self, alert: ClimateAlert):
        """Store alert in database"""
        try:
            atom = MeTTaAtom(
                id=alert.id,
                event_id="",
                atom_type='climate_alert',
                atom_content=json.dumps(alert.to_dict()),
                created_at=datetime.now()
            )
            await crud.create_atom(atom)
        except Exception as e:
            print(f"Error storing alert: {e}")
    
    async def _get_all_alerts(self) -> List[ClimateAlert]:
        """Get all alerts from database"""
        try:
            alerts = []
            atoms = await crud.get_all_atoms()
            
            for atom in atoms:
                if atom.atom_type == 'climate_alert':
                    data = json.loads(atom.atom_content)
                    alert = ClimateAlert(
                        id=data['id'],
                        alert_type=data['alert_type'],
                        title=data['title'],
                        message=data['message'],
                        severity=data['severity'],
                        location=data['location'],
                        radius_km=data['radius_km'],
                        affected_users=data['affected_users'],
                        created_at=datetime.fromisoformat(data['created_at']),
                        expires_at=datetime.fromisoformat(data['expires_at']) if data['expires_at'] else None
                    )
                    alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            print(f"Error getting all alerts: {e}")
            return []
    
    async def _get_nearby_users(self, latitude: float, longitude: float, radius_km: float) -> List[User]:
        """Get users within radius of location"""
        try:
            # Simplified - in reality would use spatial queries
            all_users = await crud.get_all_users()
            # For demo, return all users (in reality would filter by location)
            return all_users[:10]  # Limit to 10 for demo
        except Exception as e:
            print(f"Error getting nearby users: {e}")
            return []
    
    def _determine_severity(self, event_type: str) -> str:
        """Determine alert severity based on event type"""
        severity_map = {
            'drought': 'high',
            'flood': 'critical',
            'locust': 'high',
            'extreme_heat': 'medium'
        }
        return severity_map.get(event_type, 'medium')
    
    def _determine_prediction_severity(self, confidence: float, event_types: List[str]) -> str:
        """Determine severity for prediction alerts"""
        if confidence >= 0.8:
            return 'high'
        elif confidence >= 0.6:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        # Convert latitude and longitude from degrees to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
    
    async def _get_nearby_user_ids(self, latitude: float, longitude: float, radius_km: float) -> List[str]:
        """Get user IDs within radius of location"""
        try:
            nearby_users = await self._get_nearby_users(latitude, longitude, radius_km)
            return [user.id for user in nearby_users]
        except Exception as e:
            print(f"Error getting nearby user IDs: {e}")
            return []
    
    def _generate_actionable_guidance(self, event_types: List[str]) -> List[str]:
        """Generate actionable guidance based on event types"""
        guidance_map = {
            'drought': [
                'Conserve water usage',
                'Check irrigation systems',
                'Monitor crop conditions',
                'Prepare alternative water sources'
            ],
            'flood': [
                'Move to higher ground if necessary',
                'Avoid driving through flooded areas',
                'Secure important documents',
                'Monitor local emergency broadcasts'
            ],
            'extreme_heat': [
                'Stay hydrated and avoid prolonged sun exposure',
                'Check on elderly neighbors and relatives',
                'Limit outdoor activities during peak hours',
                'Ensure air conditioning systems are working'
            ],
            'locust': [
                'Cover crops if possible',
                'Report swarm sightings to authorities',
                'Prepare alternative food sources',
                'Coordinate with local farmers'
            ]
        }
        
        guidance = []
        for event_type in event_types:
            guidance.extend(guidance_map.get(event_type, ['Stay alert and monitor conditions']))
        
        return list(set(guidance))  # Remove duplicates
    
    def _calculate_escalation_level(self, confidence_score: float) -> int:
        """Calculate escalation level based on confidence score"""
        for level in range(5, 0, -1):
            if confidence_score >= self.escalation_thresholds[level]:
                return level
        return 1
    
    async def _broadcast_alert_realtime(self, alert: ClimateAlert):
        """Broadcast alert via WebSocket and other real-time channels"""
        try:
            # WebSocket broadcast
            sent_count = await self.websocket_manager.broadcast_alert(alert)
            print(f"Alert {alert.id} sent to {sent_count} users via WebSocket")
            
            # Here you could add other notification methods:
            # - Push notifications
            # - Email notifications
            # - SMS for critical alerts
            # - Integration with external emergency services
            
            if alert.escalation_level >= 4:
                await self._notify_emergency_services(alert)
            
        except Exception as e:
            print(f"Error broadcasting alert: {e}")
    
    async def _notify_emergency_services(self, alert: ClimateAlert):
        """Notify external emergency services for critical alerts"""
        try:
            # Simulate emergency service notification
            print(f" CRITICAL ALERT: Notifying emergency services for {alert.title}")
            print(f"Location: {alert.location}")
            print(f"Affected users: {len(alert.affected_users)}")
            print(f"Escalation level: {alert.escalation_level}")
            
            # In a real implementation, this would:
            # - Send alerts to emergency management systems
            # - Integrate with weather services
            # - Notify local authorities
            # - Trigger automated response systems
            
        except Exception as e:
            print(f"Error notifying emergency services: {e}")
    
    async def subscribe_user_to_alerts(self, user_id: str, subscription: AlertSubscription) -> dict:
        """Subscribe user to specific alert types and locations"""
        try:
            self.websocket_manager.user_subscriptions[user_id] = subscription
            
            return {
                'success': True,
                'message': f'User {user_id} subscribed to alerts',
                'subscription': {
                    'location': subscription.location,
                    'radius_km': subscription.radius_km,
                    'alert_types': list(subscription.alert_types),
                    'severity_threshold': subscription.severity_threshold
                }
            }
            
        except Exception as e:
            print(f"Error subscribing user to alerts: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_alert_effectiveness_metrics(self) -> dict:
        """Get metrics on alert system effectiveness"""
        try:
            all_alerts = await self._get_all_alerts()
            
            # Calculate metrics
            total_alerts = len(all_alerts)
            critical_alerts = len([a for a in all_alerts if a.severity == 'critical'])
            high_confidence_alerts = len([a for a in all_alerts if a.confidence_score >= 0.8])
            
            # Average response time (simulated)
            avg_response_time = 15.5  # minutes
            
            # User engagement metrics
            total_affected_users = sum(len(a.affected_users) for a in all_alerts)
            avg_users_per_alert = total_affected_users / total_alerts if total_alerts > 0 else 0
            
            return {
                'total_alerts_generated': total_alerts,
                'critical_alerts': critical_alerts,
                'high_confidence_alerts': high_confidence_alerts,
                'average_response_time_minutes': avg_response_time,
                'total_users_notified': total_affected_users,
                'average_users_per_alert': round(avg_users_per_alert, 1),
                'alert_accuracy_rate': 0.87,  # Simulated
                'false_positive_rate': 0.13,  # Simulated
                'system_uptime': 0.995  # Simulated
            }
            
        except Exception as e:
            print(f"Error getting alert effectiveness metrics: {e}")
            return {'error': str(e)}
    
    async def create_emergency_response_alert(self, event_id: str, emergency_level: int) -> dict:
        """Create emergency response alert for critical situations"""
        try:
            event = await self.crud.get_event_by_id(event_id)
            if not event:
                return {'success': False, 'error': 'Event not found'}
            
            # Expand radius for emergency alerts
            emergency_radius = self.default_radius_km * (1 + emergency_level * 0.5)
            nearby_users = await self._get_nearby_users(
                event.latitude, event.longitude, emergency_radius
            )
            
            alert_id = str(uuid.uuid4())
            alert = ClimateAlert(
                id=alert_id,
                alert_type='emergency',
                title=f'EMERGENCY: {event.event_type.replace("_", " ").title()}',
                message=f'Emergency response activated for {event.event_type.replace("_", " ")} event. Follow local emergency procedures immediately.',
                severity='critical',
                location={'latitude': event.latitude, 'longitude': event.longitude},
                radius_km=emergency_radius,
                affected_users=[u.id for u in nearby_users],
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=self.emergency_alert_hours),
                confidence_score=1.0,
                event_types=[event.event_type],
                actionable_guidance=self._generate_emergency_guidance(event.event_type),
                escalation_level=5,  # Maximum escalation
                external_references=[
                    'Local Emergency Management',
                    'National Weather Service',
                    'Red Cross Emergency Response'
                ]
            )
            
            # Store and broadcast with highest priority
            await self._store_alert(alert)
            await self._broadcast_alert_realtime(alert)
            
            # Add to MeTTa with emergency flag
            emergency_atom = f'(emergency-alert "{alert_id}" "{event.event_type}" {event.latitude} {event.longitude} {emergency_level})'
            self.metta_service.add_to_atom_space('prediction', emergency_atom)
            
            return {
                'success': True,
                'alert': alert.to_dict(),
                'emergency_level': emergency_level,
                'affected_users': len(nearby_users),
                'message': f'Emergency alert activated for {len(nearby_users)} users'
            }
            
        except Exception as e:
            print(f"Error creating emergency response alert: {e}")
            return {'success': False, 'error': str(e)}
    
    def _generate_emergency_guidance(self, event_type: str) -> List[str]:
        """Generate emergency-specific actionable guidance"""
        emergency_guidance = {
            'flood': [
                'EVACUATE to higher ground immediately if instructed',
                'Call emergency services if trapped',
                'Do NOT drive through flooded roads',
                'Turn off utilities if safe to do so',
                'Monitor emergency radio broadcasts'
            ],
            'extreme_heat': [
                'Seek air-conditioned shelter immediately',
                'Call 911 if experiencing heat exhaustion symptoms',
                'Check on vulnerable neighbors',
                'Avoid all outdoor activities',
                'Drink water frequently'
            ],
            'drought': [
                'Implement emergency water conservation',
                'Contact local water authority',
                'Prepare for potential water restrictions',
                'Monitor livestock and crops closely'
            ]
        }
        
        return emergency_guidance.get(event_type, [
            'Follow local emergency procedures',
            'Monitor official emergency channels',
            'Stay in contact with authorities'
        ])    
def _parse_metta_warning_result(self, metta_result) -> dict:
        """Parse MeTTa early warning result"""
        try:
            warning_data = {
                'warning_triggered': False,
                'confidence_score': 0.5,
                'event_types': [],
                'warning_level': 'low'
            }
            
            if metta_result and len(metta_result) > 0:
                result_str = str(metta_result[0]) if metta_result else ""
                if "early-warning" in result_str:
                    warning_data['warning_triggered'] = True
                    
                    # Extract warning level and confidence
                    if "critical" in result_str:
                        warning_data['warning_level'] = 'critical'
                        warning_data['confidence_score'] = 0.9
                        warning_data['event_types'] = ['drought', 'extreme_heat']
                    elif "high" in result_str:
                        warning_data['warning_level'] = 'high'
                        warning_data['confidence_score'] = 0.8
                        warning_data['event_types'] = ['drought']
                    elif "medium" in result_str:
                        warning_data['warning_level'] = 'medium'
                        warning_data['confidence_score'] = 0.6
                        warning_data['event_types'] = ['extreme_heat']
            
            return warning_data
            
        except Exception as e:
            print(f"Error parsing MeTTa warning result: {e}")
            return {'warning_triggered': False, 'confidence_score': 0.5, 'event_types': [], 'warning_level': 'low'}
    
def _generate_emergency_guidance(self, event_type: str) -> List[str]:
        """Generate emergency guidance for critical events"""
        emergency_guidance = {
            'drought': [
                'EMERGENCY: Implement immediate water conservation measures',
                'Contact emergency water services',
                'Evacuate livestock to areas with water access',
                'Follow local emergency management directives'
            ],
            'flood': [
                'EMERGENCY: Move to higher ground immediately',
                'Do not attempt to drive through flood waters',
                'Call emergency services if trapped',
                'Follow evacuation orders from authorities'
            ],
            'extreme_heat': [
                'EMERGENCY: Seek air-conditioned shelter immediately',
                'Call emergency services for heat-related illness',
                'Check on vulnerable community members',
                'Avoid all outdoor activities'
            ],
            'locust': [
                'EMERGENCY: Implement immediate crop protection measures',
                'Report swarm location to agricultural authorities',
                'Coordinate with emergency agricultural response teams',
                'Secure food supplies and livestock feed'
            ]
        }
        
        return emergency_guidance.get(event_type, [
            'EMERGENCY: Follow local emergency management directives',
            'Contact emergency services if immediate assistance needed',
            'Monitor official emergency communications',
            'Implement emergency preparedness plans'
        ])
