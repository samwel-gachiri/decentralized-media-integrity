"""
Economic Impact Service for Climate Witness DAO
Handles economic impact analysis, correlation, and prediction using MeTTa logic
"""

import uuid
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from app.services.metta_service import MeTTaService
from app.database.crud import *
from app.database.models import Event, User, MeTTaAtom

@dataclass
class EconomicImpact:
    """Economic impact data model"""
    id: str
    event_id: str
    impact_type: str  # crop_failure, livestock_death, infrastructure_damage, water_scarcity, economic_loss
    severity_level: int  # 1-10 scale
    affected_population: int
    estimated_cost: float
    recovery_time_days: int
    correlation_confidence: float
    created_at: datetime
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'event_id': self.event_id,
            'impact_type': self.impact_type,
            'severity_level': self.severity_level,
            'affected_population': self.affected_population,
            'estimated_cost': self.estimated_cost,
            'recovery_time_days': self.recovery_time_days,
            'correlation_confidence': self.correlation_confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

@dataclass
class ImpactCorrelation:
    """Impact correlation analysis result"""
    event_type: str
    impact_type: str
    correlation_strength: float
    confidence_interval: Tuple[float, float]
    sample_size: int
    p_value: float
    
    def to_dict(self) -> dict:
        return {
            'event_type': self.event_type,
            'impact_type': self.impact_type,
            'correlation_strength': self.correlation_strength,
            'confidence_interval': list(self.confidence_interval),
            'sample_size': self.sample_size,
            'p_value': self.p_value
        }

@dataclass
class ImpactPrediction:
    """Impact prediction result"""
    event_id: str
    impact_type: str
    probability: float
    confidence_score: float
    estimated_cost: float
    estimated_recovery_time: int
    factors: List[Dict[str, Any]]
    
    def to_dict(self) -> dict:
        return {
            'event_id': self.event_id,
            'impact_type': self.impact_type,
            'probability': self.probability,
            'confidence_score': self.confidence_score,
            'estimated_cost': self.estimated_cost,
            'estimated_recovery_time': self.estimated_recovery_time,
            'factors': self.factors
        }

class EconomicImpactService:
    """Service for managing economic impact analysis and prediction"""
    
    def __init__(self, db_path: str = "./news_integrity.db"):
        self.db_path = db_path
        self.metta_service = MeTTaService(db_path)
        # Impact type mappings
        self.impact_types = {
            'crop_failure': 'Crop_Failure',
            'livestock_death': 'Livestock_Risk',
            'infrastructure_damage': 'Infrastructure_Damage',
            'water_scarcity': 'Water_Scarcity',
            'economic_loss': 'Economic_Loss'
        }
        
        # Event type to impact type mappings
        self.event_impact_mappings = {
            'drought': ['crop_failure', 'livestock_death', 'water_scarcity'],
            'flood': ['infrastructure_damage', 'crop_failure', 'economic_loss'],
            'locust': ['crop_failure', 'economic_loss'],
            'extreme_heat': ['livestock_death', 'water_scarcity', 'infrastructure_damage']
        } 
   
    async def analyze_economic_impact(self, event_id: str) -> dict:
        """Analyze economic impact for an event using MeTTa correlation logic"""
        try:
            # Get event details
            event = await get_event_by_id(event_id, db_path=self.db_path)
            if not event:
                raise ValueError("Event not found")

            # Add event data to MeTTa economic space
            await self._add_event_to_economic_space(event)

            # Run MeTTa economic correlation analysis
            metta_query = f'!(correlate-event-economic-impact "{event_id}")'
            metta_result = self.metta_service.knowledge_base.metta.run(metta_query)

            # Parse MeTTa result
            correlation_data = self._parse_metta_correlation_result(metta_result, event)

            if not correlation_data:
                return {
                    'success': False,
                    'error': 'MeTTa correlation analysis failed'
                }

            # Extract impact correlations from MeTTa result
            correlations = self._extract_correlations(correlation_data)

            # Generate impact predictions
            predictions = await self._generate_impact_predictions(event, correlations)

            # Calculate comprehensive impact assessment
            comprehensive_assessment = await self._calculate_comprehensive_assessment(event, predictions)

            # Store analysis results
            await self._store_analysis_results(event_id, correlations, predictions, comprehensive_assessment)
            
            return {
                'success': True,
                'event_id': event_id,
                'correlations': [c.to_dict() for c in correlations],
                'predictions': [p.to_dict() for p in predictions],
                'comprehensive_assessment': comprehensive_assessment,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error analyzing economic impact: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def predict_impact_probability(self, event_id: str, impact_type: str) -> dict:
        """Predict probability of specific economic impact"""
        try:
            # Validate impact type
            if impact_type not in self.impact_types:
                raise ValueError(f"Invalid impact type: {impact_type}")
            
            # Get event details
            event = await get_event_by_id(event_id, db_path=self.db_path)
            if not event:
                raise ValueError("Event not found")
            
            # Add event to MeTTa spaces if not already there
            await self._add_event_to_economic_space(event)
            
            # Use MeTTa to predict impact probability
            metta_impact_type = self.impact_types[impact_type]
            
            # Add prediction query to MeTTa
            prediction_atom = f'(predict-impact-probability "{event_id}" "{metta_impact_type}")'
            self.metta_service.add_to_atom_space('economic', prediction_atom)
            
            # Query for prediction result
            result = self.metta_service.query_atom_space('economic', f'(impact-probability "{event_id}" "{metta_impact_type}" $probability)')
            
            # Extract probability from result
            probability = self._extract_probability_from_result(result)
            
            # Calculate confidence score
            confidence_score = await self._calculate_confidence_score(event_id, impact_type)
            
            # Estimate economic cost
            estimated_cost = await self._estimate_economic_cost(event, impact_type, probability)
            
            # Estimate recovery time
            recovery_time = await self._estimate_recovery_time(event, impact_type, probability)
            
            # Get contributing factors
            factors = await self._get_contributing_factors(event, impact_type)
            
            prediction = ImpactPrediction(
                event_id=event_id,
                impact_type=impact_type,
                probability=probability,
                confidence_score=confidence_score,
                estimated_cost=estimated_cost,
                estimated_recovery_time=recovery_time,
                factors=factors
            )
            
            return {
                'success': True,
                'prediction': prediction.to_dict()
            }
            
        except Exception as e:
            print(f"Error predicting impact probability: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_impact_analytics(self, region: str = None, timeframe_days: int = 365) -> dict:
        """Get comprehensive impact analytics for a region or globally"""
        try:
            # Get all events in timeframe
            cutoff_date = datetime.now() - timedelta(days=timeframe_days)
            # TODO: Replace with get_all_events from crud if implemented
            all_events = []  # Placeholder, implement get_all_events in crud.py if needed
            
            # Filter by timeframe and region if specified
            filtered_events = [
                e for e in all_events 
                if e.timestamp and e.timestamp >= cutoff_date
            ]
            
            if region:
                # In a real implementation, you'd filter by geographic region
                pass
            
            # Calculate analytics
            total_events = len(filtered_events)
            verified_events = len([e for e in filtered_events if e.verification_status == 'verified'])
            
            # Get impact data for verified events
            impact_data = []
            total_economic_loss = 0.0
            
            for event in filtered_events:
                if event.verification_status == 'verified':
                    # Get impact predictions
                    predictions = await self.predict_impact_probability(event.id, 'crop_failure')
                    if predictions.get('success'):
                        impact_data.append({
                            'event_id': event.id,
                            'event_type': event.event_type,
                            'predictions': predictions.get('prediction', {}),
                            'estimated_loss': predictions.get('prediction', {}).get('estimated_cost', 0)
                        })
                        total_economic_loss += predictions.get('prediction', {}).get('estimated_cost', 0)
            
            # Calculate event type distribution
            event_type_counts = {}
            for event in filtered_events:
                event_type_counts[event.event_type] = event_type_counts.get(event.event_type, 0) + 1
            
            return {
                'success': True,
                'analytics': {
                    'timeframe_days': timeframe_days,
                    'region': region or 'global',
                    'total_events': total_events,
                    'verified_events': verified_events,
                    'verification_rate': verified_events / total_events if total_events > 0 else 0,
                    'total_economic_loss': total_economic_loss,
                    'average_loss_per_event': total_economic_loss / verified_events if verified_events > 0 else 0,
                    'event_type_distribution': event_type_counts,
                    'impact_data': impact_data[:10]  # Return top 10 for summary
                }
            }
            
        except Exception as e:
            print(f"Error getting impact analytics: {e}")
            return {'success': False, 'error': str(e)}

    async def generate_impact_report(self, event_id: str) -> dict:
        """Generate comprehensive impact report for an event"""
        try:
            # Get event details
            event = await get_event_by_id(event_id, db_path=self.db_path)
            if not event:
                return {'success': False, 'error': 'Event not found'}
            
            # Run MeTTa correlation analysis
            correlation_result = await self.metta_service.analyze_economic_impact(event_id)
            
            # Get impact predictions for different categories
            impact_categories = ['crop_failure', 'livestock_death', 'infrastructure_damage', 'water_scarcity']
            impact_predictions = {}
            
            for category in impact_categories:
                prediction = await self.predict_impact_probability(event_id, category)
                if prediction.get('success'):
                    impact_predictions[category] = prediction.get('prediction', {})
            
            # Generate risk assessment
            risk_level = self._calculate_risk_level(impact_predictions)
            
            # Get historical context
            historical_context = await self._get_historical_context(event)
            
            return {
                'success': True,
                'report': {
                    'event_id': event_id,
                    'event_details': {
                        'type': event.event_type,
                        'location': {'latitude': event.latitude, 'longitude': event.longitude},
                        'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                        'verification_status': event.verification_status
                    },
                    'correlation_analysis': correlation_result,
                    'impact_predictions': impact_predictions,
                    'risk_assessment': {
                        'overall_risk_level': risk_level,
                        'risk_factors': self._identify_risk_factors(event, impact_predictions),
                        'mitigation_recommendations': self._generate_mitigation_recommendations(risk_level, impact_predictions)
                    },
                    'historical_context': historical_context,
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            print(f"Error generating impact report: {e}")
            return {'success': False, 'error': str(e)}

    # Private helper methods
    
    async def _add_event_to_economic_space(self, event: Event):
        """Add event data to MeTTa economic space"""
        try:
            # Add basic event atoms to economic space
            event_atom = f'(economic-event "{event.id}" "{event.event_type}" {event.latitude} {event.longitude})'
            self.metta_service.add_to_atom_space('economic', event_atom)
            
            # Add timestamp atom
            if event.timestamp:
                timestamp_atom = f'(event-timestamp "{event.id}" "{event.timestamp.isoformat()}")'
                self.metta_service.add_to_atom_space('economic', timestamp_atom)
            
            # Add severity estimation
            severity = self._determine_severity(event.event_type, event.description or "")
            severity_atom = f'(event-severity "{event.id}" "{severity}")'
            self.metta_service.add_to_atom_space('economic', severity_atom)
            
            # Add affected population estimation
            affected_population = self._estimate_affected_population(event.event_type, event.latitude, event.longitude)
            population_atom = f'(affected-population "{event.id}" {affected_population})'
            self.metta_service.add_to_atom_space('economic', population_atom)
            
        except Exception as e:
            print(f"Error adding event to economic space: {e}")
    
    def _parse_metta_correlation_result(self, metta_result, event) -> dict:
        """Parse MeTTa correlation result into usable data"""
        try:
            # Extract correlation data from MeTTa result
            correlation_data = {
                'event_id': event.id,
                'event_type': event.event_type,
                'correlations': [],
                'total_impact': 0,
                'correlation_strength': 0.5
            }
            
            # Parse MeTTa result (simplified parsing)
            if metta_result and len(metta_result) > 0:
                # Extract correlation strength from result
                result_str = str(metta_result[0]) if metta_result else ""
                if "economic-correlation" in result_str:
                    # Try to extract numeric values
                    import re
                    numbers = re.findall(r'\d+\.?\d*', result_str)
                    if len(numbers) >= 2:
                        correlation_data['total_impact'] = float(numbers[0]) if numbers[0] else 1000
                        correlation_data['correlation_strength'] = min(float(numbers[1]) if numbers[1] else 0.5, 1.0)
            
            return correlation_data
            
        except Exception as e:
            print(f"Error parsing MeTTa correlation result: {e}")
            return None
    
    def _extract_correlations(self, correlation_data: dict) -> List[ImpactCorrelation]:
        """Extract correlations from parsed MeTTa data"""
        correlations = []
        
        if not correlation_data:
            return correlations
        
        event_type = correlation_data.get('event_type', 'unknown')
        correlation_strength = correlation_data.get('correlation_strength', 0.5)
        
        # Get relevant impact types for this event type
        relevant_impacts = self.event_impact_mappings.get(event_type, ['crop_failure'])
        
        for impact_type in relevant_impacts:
            correlation = ImpactCorrelation(
                event_type=event_type,
                impact_type=impact_type,
                correlation_strength=correlation_strength,
                confidence_interval=(max(0, correlation_strength - 0.1), min(1.0, correlation_strength + 0.1)),
                sample_size=50,  # Simplified
                p_value=0.05 if correlation_strength > 0.6 else 0.1
            )
            correlations.append(correlation)
        
        return correlations
    
    async def _generate_impact_predictions(self, event: Event, correlations: List[ImpactCorrelation]) -> List[ImpactPrediction]:
        """Generate impact predictions based on correlations"""
        predictions = []
        
        # Get relevant impact types for this event type
        relevant_impacts = self.event_impact_mappings.get(event.event_type, [])
        
        for impact_type in relevant_impacts:
            prediction_result = await self.predict_impact_probability(event.id, impact_type)
            if prediction_result.get('success'):
                prediction_data = prediction_result.get('prediction', {})
                prediction = ImpactPrediction(
                    event_id=event.id,
                    impact_type=impact_type,
                    probability=prediction_data.get('probability', 0.5),
                    confidence_score=prediction_data.get('confidence_score', 0.5),
                    estimated_cost=prediction_data.get('estimated_cost', 0),
                    estimated_recovery_time=prediction_data.get('estimated_recovery_time', 30),
                    factors=prediction_data.get('factors', [])
                )
                predictions.append(prediction)
        
        return predictions
    
    async def _calculate_comprehensive_assessment(self, event: Event, predictions: List[ImpactPrediction]) -> dict:
        """Calculate comprehensive impact assessment"""
        if not predictions:
            return {
                'overall_risk': 'low',
                'total_estimated_cost': 0,
                'max_recovery_time': 0,
                'high_risk_impacts': []
            }
        
        total_cost = sum(p.estimated_cost for p in predictions)
        max_recovery_time = max(p.estimated_recovery_time for p in predictions)
        high_risk_impacts = [p.impact_type for p in predictions if p.probability > 0.7]
        
        # Determine overall risk level
        avg_probability = sum(p.probability for p in predictions) / len(predictions)
        if avg_probability > 0.7:
            overall_risk = 'high'
        elif avg_probability > 0.4:
            overall_risk = 'medium'
        else:
            overall_risk = 'low'
        
        return {
            'overall_risk': overall_risk,
            'total_estimated_cost': total_cost,
            'max_recovery_time': max_recovery_time,
            'high_risk_impacts': high_risk_impacts,
            'average_probability': avg_probability
        }
    
    async def _store_analysis_results(self, event_id: str, correlations: List[ImpactCorrelation], 
                                    predictions: List[ImpactPrediction], assessment: dict):
        """Store analysis results in database"""
        try:
            # Create analysis result atom
            analysis_data = {
                'event_id': event_id,
                'correlations': [c.to_dict() for c in correlations],
                'predictions': [p.to_dict() for p in predictions],
                'assessment': assessment,
                'timestamp': datetime.now().isoformat()
            }
            
            atom = MeTTaAtom(
                id=str(uuid.uuid4()),
                event_id=event_id,
                atom_type='economic_analysis',
                atom_content=json.dumps(analysis_data),
                created_at=datetime.now()
            )
            
            await create_atom(atom, db_path=self.db_path)
            
        except Exception as e:
            print(f"Error storing analysis results: {e}")
    
    def _extract_probability_from_result(self, result) -> float:
        """Extract probability from MeTTa query result"""
        # This is a simplified extraction
        # In practice, you'd parse the MeTTa result structure
        if result and len(result) > 0:
            return 0.75  # Placeholder
        return 0.5  # Default probability
    
    async def _calculate_confidence_score(self, event_id: str, impact_type: str) -> float:
        """Calculate confidence score for prediction"""
        # Factors that affect confidence:
        # - Historical data availability
        # - Event verification status
        # - Data quality

        base_confidence = 0.6

        # Get event details
        event = await get_event_by_id(event_id, db_path=self.db_path)
        if event:
            # Increase confidence if event is verified
            if event.verification_status == 'verified':
                base_confidence += 0.2

            # Increase confidence if photo evidence exists
            if event.photo_path:
                base_confidence += 0.1

            # Increase confidence if description is detailed
            if event.description and len(event.description) > 50:
                base_confidence += 0.1

        return min(base_confidence, 1.0)
    
    async def _estimate_economic_cost(self, event: Event, impact_type: str, probability: float) -> float:
        """Estimate economic cost of impact"""
        # Base costs per impact type (in USD)
        base_costs = {
            'crop_failure': 10000,
            'livestock_death': 5000,
            'infrastructure_damage': 25000,
            'water_scarcity': 8000,
            'economic_loss': 15000
        }
        
        base_cost = base_costs.get(impact_type, 10000)
        
        # Adjust based on event severity
        severity = self._determine_severity(event.event_type, event.description or "")
        severity_multipliers = {'low': 0.5, 'medium': 1.0, 'high': 2.0}
        severity_multiplier = severity_multipliers.get(severity, 1.0)
        
        # Adjust based on affected population
        affected_population = self._estimate_affected_population(event.event_type, event.latitude, event.longitude)
        population_factor = min(affected_population / 1000, 5.0)  # Cap at 5x multiplier
        
        # Final cost calculation
        estimated_cost = base_cost * severity_multiplier * population_factor * probability
        
        return round(estimated_cost, 2)
    
    async def _estimate_recovery_time(self, event: Event, impact_type: str, probability: float) -> int:
        """Estimate recovery time in days"""
        # Base recovery times per impact type (in days)
        base_recovery_times = {
            'crop_failure': 120,  # One growing season
            'livestock_death': 365,  # One year to rebuild herd
            'infrastructure_damage': 90,  # 3 months for repairs
            'water_scarcity': 60,  # 2 months to find alternatives
            'economic_loss': 180  # 6 months for economic recovery
        }
        
        base_time = base_recovery_times.get(impact_type, 90)
        
        # Adjust based on severity
        severity = self._determine_severity(event.event_type, event.description or "")
        severity_multipliers = {'low': 0.7, 'medium': 1.0, 'high': 1.5}
        severity_multiplier = severity_multipliers.get(severity, 1.0)
        
        # Adjust based on probability
        probability_multiplier = 0.5 + (probability * 0.5)  # Range: 0.5 to 1.0
        
        recovery_time = int(base_time * severity_multiplier * probability_multiplier)
        
        return recovery_time
    
    async def _get_contributing_factors(self, event: Event, impact_type: str) -> List[Dict[str, Any]]:
        """Get factors contributing to impact probability"""
        factors = []
        
        # Event type specific factors
        event_factors = {
            'drought': [
                {'factor': 'Seasonal timing', 'weight': 0.3, 'description': 'Drought during growing season'},
                {'factor': 'Duration', 'weight': 0.4, 'description': 'Extended dry period'},
                {'factor': 'Geographic location', 'weight': 0.3, 'description': 'Agricultural region'}
            ],
            'flood': [
                {'factor': 'Water level', 'weight': 0.4, 'description': 'Flood water depth and extent'},
                {'factor': 'Infrastructure proximity', 'weight': 0.3, 'description': 'Distance to critical infrastructure'},
                {'factor': 'Population density', 'weight': 0.3, 'description': 'Number of people affected'}
            ]
        }
        
        factors.extend(event_factors.get(event.event_type, []))
        
        # Impact type specific factors
        impact_factors = {
            'crop_failure': [
                {'factor': 'Crop season', 'weight': 0.5, 'description': 'Timing relative to planting/harvest'},
                {'factor': 'Crop type vulnerability', 'weight': 0.3, 'description': 'Susceptibility of local crops'}
            ],
            'livestock_death': [
                {'factor': 'Animal density', 'weight': 0.4, 'description': 'Livestock concentration in area'},
                {'factor': 'Shelter availability', 'weight': 0.3, 'description': 'Protection from elements'}
            ]
        }
        
        factors.extend(impact_factors.get(impact_type, []))
        
        return factors
    
    def _calculate_risk_level(self, impact_predictions: dict) -> str:
        """Calculate overall risk level from impact predictions"""
        if not impact_predictions:
            return 'low'
        
        high_risk_count = 0
        total_predictions = len(impact_predictions)
        
        for category, prediction in impact_predictions.items():
            if prediction.get('probability', 0) > 0.7:
                high_risk_count += 1
        
        if total_predictions == 0:
            return 'low'
        
        risk_ratio = high_risk_count / total_predictions
        
        if risk_ratio > 0.6:
            return 'high'
        elif risk_ratio > 0.3:
            return 'medium'
        else:
            return 'low'
    
    def _identify_risk_factors(self, event, impact_predictions: dict) -> List[str]:
        """Identify key risk factors for the event"""
        risk_factors = []
        
        # Event type specific risks
        event_risks = {
            'drought': ['Water scarcity', 'Crop failure', 'Livestock stress'],
            'flood': ['Infrastructure damage', 'Disease outbreak', 'Displacement'],
            'locust': ['Crop destruction', 'Food insecurity', 'Economic loss'],
            'extreme_heat': ['Health risks', 'Energy demand spike', 'Agricultural stress']
        }
        
        risk_factors.extend(event_risks.get(event.event_type, []))
        
        # Add prediction-based risks
        for category, prediction in impact_predictions.items():
            if prediction.get('probability', 0) > 0.6:
                risk_factors.append(f"High probability of {category.replace('_', ' ')}")
        
        return risk_factors
    
    def _generate_mitigation_recommendations(self, risk_level: str, impact_predictions: dict) -> List[str]:
        """Generate mitigation recommendations based on risk assessment"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.extend([
                'Immediate emergency response activation',
                'Resource mobilization for affected areas',
                'Community evacuation planning if necessary'
            ])
        elif risk_level == 'medium':
            recommendations.extend([
                'Enhanced monitoring and early warning systems',
                'Preparation of emergency resources',
                'Community awareness and preparedness programs'
            ])
        else:
            recommendations.extend([
                'Continued monitoring of conditions',
                'Preventive measures implementation',
                'Community education and preparedness'
            ])
        
        # Add specific recommendations based on impact predictions
        for category, prediction in impact_predictions.items():
            if prediction.get('probability', 0) > 0.5:
                category_recommendations = {
                    'crop_failure': 'Implement crop protection measures and alternative farming strategies',
                    'livestock_death': 'Ensure livestock shelter and emergency feed supplies',
                    'infrastructure_damage': 'Strengthen critical infrastructure and prepare repair resources',
                    'water_scarcity': 'Implement water conservation measures and secure alternative sources'
                }
                rec = category_recommendations.get(category)
                if rec and rec not in recommendations:
                    recommendations.append(rec)
        
        return recommendations
    
    async def _get_historical_context(self, event) -> dict:
        """Get historical context for similar events in the region"""
        try:
            # Get similar events in the past 5 years
            cutoff_date = datetime.now() - timedelta(days=5*365)
            # TODO: Replace with get_all_events from crud if implemented
            all_events = []  # Placeholder, implement get_all_events in crud.py if needed
            
            similar_events = [
                e for e in all_events
                if (e.event_type == event.event_type and 
                    e.timestamp and e.timestamp >= cutoff_date and
                    e.id != event.id)
            ]
            
            # Calculate statistics
            total_similar = len(similar_events)
            verified_similar = len([e for e in similar_events if e.verification_status == 'verified'])
            
            return {
                'total_similar_events': total_similar,
                'verified_similar_events': verified_similar,
                'verification_rate': verified_similar / total_similar if total_similar > 0 else 0,
                'time_period': '5 years',
                'event_frequency': total_similar / 5 if total_similar > 0 else 0  # events per year
            }
            
        except Exception as e:
            print(f"Error getting historical context: {e}")
            return {
                'total_similar_events': 0,
                'verified_similar_events': 0,
                'verification_rate': 0,
                'time_period': '5 years',
                'event_frequency': 0
            }
    
    def _calculate_economic_loss(self, event_type: str, severity: str, affected_population: int) -> float:
        """Calculate estimated economic loss based on event parameters"""
        base_loss_per_person = {
            'drought': {'low': 50, 'medium': 200, 'high': 500},
            'flood': {'low': 100, 'medium': 400, 'high': 1000},
            'locust': {'low': 75, 'medium': 300, 'high': 750},
            'extreme_heat': {'low': 30, 'medium': 150, 'high': 400}
        }
        
        loss_per_person = base_loss_per_person.get(event_type, {}).get(severity, 100)
        return loss_per_person * affected_population
    
    def _estimate_affected_population(self, event_type: str, latitude: float, longitude: float) -> int:
        """Estimate affected population based on event type and location"""
        # This is a simplified estimation
        # In practice, you'd use population density data and event impact radius
        base_population = {
            'drought': 5000,
            'flood': 2000,
            'locust': 3000,
            'extreme_heat': 1500
        }
        
        return base_population.get(event_type, 2000)
    
    def _determine_severity(self, event_type: str, description: str) -> str:
        """Determine event severity from description and type"""
        description_lower = description.lower() if description else ""
        
        high_severity_keywords = ['severe', 'extreme', 'devastating', 'massive', 'widespread']
        medium_severity_keywords = ['moderate', 'significant', 'considerable', 'notable']
        
        if any(keyword in description_lower for keyword in high_severity_keywords):
            return 'high'
        elif any(keyword in description_lower for keyword in medium_severity_keywords):
            return 'medium'
        else:
            return 'low'
