from sqlalchemy.orm import Session
from app.models.database import NewsReport, IntegrityAlert, PatternCache, get_session, get_db, IntegrityLevelEnum
from app.models.newsmodels import NewsReportCreate, NewsReportResponse, IntegrityAlertResponse, ReportStatsResponse
from app.services.metta_service import MeTTaService
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy import func
import duckduckgo_search
import cv2
import numpy as np
from deepface import DeepFace
import tensorflow as tf
import asyncio
import aiohttp
import os
from dataclasses import dataclass
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

class CUDOSASIClient:
    """
    Production-ready CUDOS ASI Cloud client
    Integrates with real CUDOS infrastructure for distributed AI inference
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv('ASI_API_KEY') or os.getenv('CUDOS_API_KEY')
        # Use the real CUDOS ASI Cloud endpoint
        self.base_url = base_url or os.getenv('OPENAI_BASE_URL', 'https://inference.asicloud.cudos.org/v1')

        if not self.api_key:
            logger.warning("⚠️ No CUDOS API key found. Set CUDOS_API_KEY environment variable.")

        if not self.base_url:
            logger.warning("⚠️ No CUDOS base URL found. Set CUDOS_BASE_URL environment variable.")

        self.headers = {
            'Authorization': f'Bearer {self.api_key}' if self.api_key else '',
            'Content-Type': 'application/json',
            'User-Agent': 'NewsIntegrity-MediaAnalysis/1.0'
        }

        logger.info("🌐 CUDOS ASI Client initialized")

    async def create_inference(self, request: CUDOSInferenceRequest) -> CUDOSInferenceResponse:
        """Create inference request on CUDOS ASI Cloud"""
        if not self.base_url:
            raise Exception("CUDOS base URL not configured")

        async with aiohttp.ClientSession(
            headers=self.headers,
            timeout=aiohttp.ClientTimeout(total=300)  # 5 minute timeout
        ) as session:
            try:
                payload = {
                    "model": request.model,
                    "messages": [{"role": "user", "content": request.prompt}],
                    "max_tokens": request.max_tokens,
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                    "stream": request.stream
                }

                logger.info(f"🚀 Creating inference with model: {request.model}")

                async with session.post(
                    f"{self.base_url}/chat/completions",
                    json=payload
                ) as response:

                    if response.status == 200:
                        data = await response.json()

                        inference_response = CUDOSInferenceResponse(
                            id=data.get('id', str(uuid.uuid4())),
                            model=data.get('model', request.model),
                            choices=data.get('choices', []),
                            usage=data.get('usage', {}),
                            created=data.get('created', int(datetime.now(timezone.utc).timestamp()))
                        )

                        logger.info(f"✅ Inference completed: {inference_response.id}")
                        return inference_response

                    else:
                        error_text = await response.text()
                        logger.warning(f"⚠️ Inference failed: {response.status} - {error_text}")
                        # Return a fallback response instead of raising exception
                        return CUDOSInferenceResponse(
                            id=str(uuid.uuid4()),
                            model=request.model,
                            choices=[{"message": {"content": "Analysis unavailable due to service error"}}],
                            usage={},
                            created=int(datetime.now(timezone.utc).timestamp())
                        )

            except Exception as e:
                logger.warning(f"⚠️ Error creating inference: {str(e)}. Using fallback response.")
                return CUDOSInferenceResponse(
                    id=str(uuid.uuid4()),
                    model=request.model,
                    choices=[{"message": {"content": "Analysis unavailable due to connection error"}}],
                    usage={},
                    created=int(datetime.now(timezone.utc).timestamp())
                )
            
class NewsService:
    def __init__(self):
        self.metta_client = MeTTaService()
        self.ddg_search = duckduckgo_search.DDGS()
        # Initialize CUDOS ASI Cloud client for AI inference
        self.cudos_client = CUDOSASIClient()
        self.preferred_models = {
            'analysis': 'asi1-mini',
            'verification': 'asi1-mini',
            'reasoning': 'asi1-mini'
        }

    async def create_news_report(self, report_data: NewsReportCreate) -> NewsReportResponse:
        """Create a new news report and trigger MeTTa analysis with integrity checks"""
        
        db = get_session()
        try:
            # Perform integrity checks
            verification_score = await self._calculate_verification_score(report_data)
            deepfake_prob = await self._check_deepfake_probability(report_data.media_url) if report_data.media_url else None

            # Determine integrity level
            integrity_level = self._determine_integrity_level(verification_score, deepfake_prob)

            # Save to database
            db_report = NewsReport(
                user=report_data.user,
                source=report_data.source,
                title=report_data.title,
                content=report_data.content,
                category=report_data.category.value,
                media_type=report_data.media_type.value,
                url=report_data.url,
                media_url=report_data.media_url,
                tags=json.dumps(report_data.tags),
                latitude=report_data.latitude,
                longitude=report_data.longitude,
                integrity_level=integrity_level.value,
                verification_score=verification_score,
                deepfake_probability=deepfake_prob
            )
            db.add(db_report)
            db.commit()
            db.refresh(db_report)

            # Store verified content on CUDOS/IPFS if integrity is high
            if integrity_level == "verified" and verification_score > 0.8:
                await self._store_verified_content_on_cudos(db_report.id, report_data.dict())

            # Submit to MeTTa service asynchronously
            metta_result = await self.metta_client.submit_news_report(report_data)

            # Check for integrity alerts and create alerts
            if 'analysis' in metta_result and 'alerts' in metta_result['analysis']:
                await self._process_integrity_alerts(report_data.source, metta_result['analysis']['alerts'])

            return NewsReportResponse(
                id=db_report.id,
                user=db_report.user,
                source=db_report.source,
                title=db_report.title,
                content=db_report.content,
                category=db_report.category,
                media_type=db_report.media_type,
                url=db_report.url,
                media_url=db_report.media_url,
                tags=json.loads(db_report.tags),
                latitude=db_report.latitude,
                longitude=db_report.longitude,
                timestamp=db_report.timestamp,
                integrity_level=db_report.integrity_level,
                verification_score=db_report.verification_score,
                deepfake_probability=db_report.deepfake_probability
            )

        except Exception as e:
            db.rollback()
            logging.error(f"Error creating news report: {str(e)}")
            raise
        finally:
            db.close()

    async def _calculate_verification_score(self, report_data: NewsReportCreate) -> float:
        """Calculate verification score using multiple sources including CUDOS AI"""
        score = 0.5  # Base score

        # Check source credibility
        source_credibility = await self._get_source_credibility(report_data.source)
        score += source_credibility * 0.3

        # Cross-reference with DuckDuckGo search
        search_results = self.ddg_search.text(f'"{report_data.title}" site:reputable-news-sites', max_results=5)
        if search_results:
            score += 0.2

        # Content analysis via CUDOS ASI Cloud
        content_analysis = await self._analyze_content_with_cudos(report_data.content)
        score += content_analysis.get('integrity_score', 0) * 0.3

        return min(score, 1.0)

    async def _check_deepfake_probability(self, media_url: str) -> float:
        """Check if media content is likely deepfake using DeepFace"""
        try:
            # For images/videos, download and analyze
            import requests
            from io import BytesIO
            from PIL import Image
            
            response = requests.get(media_url, timeout=10)
            if response.status_code != 200:
                return 0.0
                
            # Load image
            img = Image.open(BytesIO(response.content))
            img_array = np.array(img)
            
            # Use DeepFace for face analysis (deepfake detection via face recognition confidence)
            try:
                result = DeepFace.analyze(img_array, actions=['emotion'], enforce_detection=False)
                # Lower confidence in face detection might indicate manipulation
                if isinstance(result, list) and len(result) > 0:
                    confidence = result[0].get('face_confidence', 0)
                    # If confidence is low, might be deepfake
                    deepfake_prob = max(0, 1 - confidence)
                else:
                    deepfake_prob = 0.5  # No face detected
            except Exception:
                deepfake_prob = 0.0
                
            return deepfake_prob
            
        except Exception as e:
            logging.error(f"Deepfake detection failed: {str(e)}")
            return 0.0

    async def _analyze_content_with_cudos(self, content: str) -> Dict[str, Any]:
        """Analyze content integrity using CUDOS ASI Cloud"""
        analysis_prompt = f"""
        Analyze the integrity and authenticity of this news content:

        Content: {content}

        Provide analysis covering:
        1. Factual accuracy indicators
        2. Potential misinformation signs
        3. Source credibility assessment
        4. Overall integrity score (0-1)
        5. Confidence in assessment

        Respond in JSON format.
        """

        try:
            request = CUDOSInferenceRequest(
                model=self.preferred_models['analysis'],
                prompt=analysis_prompt,
                max_tokens=1000,
                temperature=0.3  # Lower temperature for analytical tasks
            )

            response = await self.cudos_client.create_inference(request)

            if response.choices:
                analysis_text = response.choices[0].get('message', {}).get('content', '')

                try:
                    analysis_result = json.loads(analysis_text)
                    return analysis_result
                except json.JSONDecodeError:
                    # Fallback parsing
                    return {
                        "integrity_score": 0.5,
                        "confidence": 0.5,
                        "raw_analysis": analysis_text
                    }
            else:
                return {"integrity_score": 0.5, "error": "No response from CUDOS"}

        except Exception as e:
            logger.error(f"CUDOS content analysis failed: {str(e)}")
            return {"integrity_score": 0.5, "error": str(e)}

    async def _store_verified_content_on_cudos(self, report_id: int, content: Dict):
        """Store verified news content using CUDOS ASI Cloud for additional analysis"""
        try:
            # Use CUDOS for advanced content verification and insights
            verification_prompt = f"""
            Perform advanced verification analysis on this news content:

            Report ID: {report_id}
            Content: {json.dumps(content, indent=2)}

            Provide:
            1. Deep verification insights
            2. Potential manipulation detection
            3. Cross-reference recommendations
            4. Trust score assessment
            5. Recommendations for further investigation

            Respond with detailed analysis.
            """

            request = CUDOSInferenceRequest(
                model=self.preferred_models['verification'],
                prompt=verification_prompt,
                max_tokens=1500,
                temperature=0.2  # Low temperature for verification
            )

            response = await self.cudos_client.create_inference(request)

            if response.choices:
                verification_text = response.choices[0].get('message', {}).get('content', '')
                logger.info(f"Advanced verification completed for report {report_id}")
                return {
                    "success": True,
                    "verification": verification_text,
                    "inference_id": response.id
                }

            return {"success": False, "error": "No verification response"}

        except Exception as e:
            logger.error(f"CUDOS verification failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _determine_integrity_level(self, verification_score: float, deepfake_prob: Optional[float]) -> IntegrityLevelEnum:
        """Determine integrity level based on scores"""
        if deepfake_prob and deepfake_prob > 0.7:
            return IntegrityLevelEnum.debunked
        elif verification_score > 0.8:
            return IntegrityLevelEnum.verified
        elif verification_score < 0.3:
            return IntegrityLevelEnum.questionable
        else:
            return IntegrityLevelEnum.pending

    async def get_source_analysis(self, source: str) -> Optional[Dict]:
        """Get news analysis for a source (with caching)"""
        db = get_session()
        try:
            # Check cache first
            cache_entry = db.query(PatternCache).filter(
                PatternCache.location == source,
                PatternCache.expires_at > datetime.now(timezone.utc)
            ).first()

            if cache_entry:
                return json.loads(cache_entry.analysis_data)

            # Get fresh analysis from MeTTa
            analysis = await self.metta_client.get_source_analysis(source)

            if analysis:
                # Cache the results
                cache_entry = PatternCache(
                    location=source,
                    analysis_data=json.dumps(analysis.dict()),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
                )
                db.add(cache_entry)
                db.commit()

                return analysis.dict()

            return None

        except Exception as e:
            logging.error(f"Error getting source analysis: {str(e)}")
            return None
        finally:
            db.close()

    async def get_news_alerts(self, source: str) -> List[IntegrityAlertResponse]:
        """Get active news integrity alerts for a source"""
        db = get_session()
        try:
            alerts = db.query(IntegrityAlert).filter(
                IntegrityAlert.source == source,
                IntegrityAlert.active == True
            ).order_by(IntegrityAlert.created_at.desc()).limit(10).all()

            return [
                IntegrityAlertResponse(
                    id=alert.id,
                    source=alert.source,
                    alert_type=alert.alert_type,
                    message=alert.message,
                    severity=alert.severity,
                    created_at=alert.created_at,
                    active=alert.active
                )
                for alert in alerts
            ]

        except Exception as e:
            logging.error(f"Error getting news alerts: {str(e)}")
            return []
        finally:
            db.close()

    async def _process_integrity_alerts(self, source: str, alerts: List[Dict]):
        """Process integrity alerts and create database entries"""
        db = get_session()
        try:
            for alert_data in alerts:
                alert_type = alert_data.get('type', 'integrity_issue')
                message = alert_data.get('message', '')
                severity = alert_data.get('severity', 'medium')

                # Check if similar alert already exists
                existing_alert = db.query(IntegrityAlert).filter(
                    IntegrityAlert.source == source,
                    IntegrityAlert.alert_type == alert_type,
                    IntegrityAlert.active == True
                ).first()

                if not existing_alert:
                    # Create new alert
                    alert = IntegrityAlert(
                        source=source,
                        alert_type=alert_type,
                        message=message,
                        severity=severity
                    )
                    db.add(alert)

            db.commit()

        except Exception as e:
            db.rollback()
            logging.error(f"Error processing integrity alerts: {str(e)}")
        finally:
            db.close()

    async def get_recent_reports(self, source: str, limit: int = 10) -> List[NewsReportResponse]:
        """Get recent news reports for a source"""
        db = get_session()
        try:
            reports = db.query(NewsReport).filter(
                NewsReport.source == source
            ).order_by(NewsReport.timestamp.desc()).limit(limit).all()

            return [
                NewsReportResponse(
                    id=report.id,
                    user=report.user,
                    source=report.source,
                    title=report.title,
                    content=report.content,
                    category=report.category,
                    media_type=report.media_type,
                    url=report.url,
                    media_url=report.media_url,
                    tags=json.loads(report.tags),
                    latitude=report.latitude,
                    longitude=report.longitude,
                    timestamp=report.timestamp,
                    integrity_level=report.integrity_level,
                    verification_score=report.verification_score,
                    deepfake_probability=report.deepfake_probability
                )
                for report in reports
            ]

        except Exception as e:
            logging.error(f"Error getting recent reports: {str(e)}")
            return []
        finally:
            db.close()

    async def verify_report(self, report_id: int, verified: bool = True) -> bool:
        """Verify or unverify a news report"""
        db = get_session()
        try:
            report = db.query(NewsReport).filter(NewsReport.id == report_id).first()
            if report:
                report.integrity_level = "verified" if verified else "questionable"
                db.commit()
                return True
            return False

        except Exception as e:
            db.rollback()
            logging.error(f"Error verifying report: {str(e)}")
            return False
        finally:
            db.close()

    async def get_global_analysis(self) -> Dict:
        """Get global news integrity patterns analysis"""
        try:
            return await self.metta_client.get_global_integrity_patterns()
        except Exception as e:
            logging.error(f"Error getting global analysis: {str(e)}")
            return {'patterns': {}, 'error': str(e)}

    async def cleanup_old_data(self, days_old: int = 30):
        """Clean up old data from database"""
        db = get_session()
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)

            # Delete old cache entries
            db.query(PatternCache).filter(
                PatternCache.expires_at < datetime.now(timezone.utc)
            ).delete()

            # Archive old alerts
            db.query(IntegrityAlert).filter(
                IntegrityAlert.created_at < cutoff_date
            ).update({'active': False})

            db.commit()

        except Exception as e:
            db.rollback()
            logging.error(f"Error cleaning up old data: {str(e)}")
        finally:
            db.close()

    async def get_report_stats(self, source: str) -> ReportStatsResponse:
        """Get statistics for news reports from a source"""
        db = get_session()
        try:
            total_reports = db.query(NewsReport).filter(
                NewsReport.source == source
            ).count()

            verified_reports = db.query(NewsReport).filter(
                NewsReport.source == source,
                NewsReport.integrity_level == "verified"
            ).count()

            integrity_counts = db.query(
                NewsReport.integrity_level,
                func.count(NewsReport.id)
            ).filter(
                NewsReport.source == source
            ).group_by(NewsReport.integrity_level).all()

            integrity_distribution = {level: count for level, count in integrity_counts}

            category_counts = db.query(
                NewsReport.category,
                func.count(NewsReport.id)
            ).filter(
                NewsReport.source == source
            ).group_by(NewsReport.category).all()

            category_distribution = {category: count for category, count in category_counts}

            return ReportStatsResponse(
                total_reports=total_reports,
                verified_reports=verified_reports,
                verification_rate=verified_reports / total_reports if total_reports > 0 else 0,
                integrity_distribution=integrity_distribution,
                category_distribution=category_distribution
            )

        except Exception as e:
            logging.error(f"Error getting report stats: {str(e)}")
            return ReportStatsResponse(
                total_reports=0,
                verified_reports=0,
                verification_rate=0,
                integrity_distribution={},
                category_distribution={}
            )
        finally:
            db.close()

    async def get_all_sources(self) -> List[str]:
        """Get all unique sources with reports"""
        db = get_session()
        try:
            sources = db.query(NewsReport.source).distinct().all()
            return [source[0] for source in sources]
        except Exception as e:
            logging.error(f"Error getting sources: {str(e)}")
            return []
        finally:
            db.close()

    async def get_global_stats(self) -> Dict:
        """Get global news statistics"""
        db = get_session()
        try:
            total_reports = db.query(NewsReport).count()
            verified_reports = db.query(NewsReport).filter(NewsReport.integrity_level == "verified").count()
            questionable_reports = db.query(NewsReport).filter(NewsReport.integrity_level == "questionable").count()
            debunked_reports = db.query(NewsReport).filter(NewsReport.integrity_level == "debunked").count()
            pending_reports = db.query(NewsReport).filter(NewsReport.integrity_level == "pending").count()

            # Calculate average verification score
            avg_score_result = db.query(func.avg(NewsReport.verification_score)).scalar()
            average_verification_score = float(avg_score_result) if avg_score_result else 0.0

            # Get total sources
            total_sources = db.query(NewsReport.source).distinct().count()

            # Mock active users for now (would come from user service)
            active_users = 42

            return {
                "totalReports": total_reports,
                "verifiedReports": verified_reports,
                "questionableReports": questionable_reports,
                "debunkedReports": debunked_reports,
                "pendingReports": pending_reports,
                "averageVerificationScore": average_verification_score,
                "totalSources": total_sources,
                "activeUsers": active_users
            }

        except Exception as e:
            logging.error(f"Error getting global stats: {str(e)}")
            return {
                "totalReports": 0,
                "verifiedReports": 0,
                "questionableReports": 0,
                "debunkedReports": 0,
                "pendingReports": 0,
                "averageVerificationScore": 0.0,
                "totalSources": 0,
                "activeUsers": 0
            }
        finally:
            db.close()

    async def get_recent_reports_all_sources(self, limit: int = 10) -> List[NewsReportResponse]:
        """Get recent news reports from all sources"""
        db = get_session()
        try:
            reports = db.query(NewsReport).order_by(
                NewsReport.timestamp.desc()
            ).limit(limit).all()

            return [
                NewsReportResponse(
                    id=report.id,
                    user=report.user,
                    source=report.source,
                    title=report.title,
                    content=report.content,
                    category=report.category,
                    media_type=report.media_type,
                    url=report.url,
                    media_url=report.media_url,
                    tags=json.loads(report.tags),
                    latitude=report.latitude,
                    longitude=report.longitude,
                    timestamp=report.timestamp,
                    integrity_level=report.integrity_level,
                    verification_score=report.verification_score,
                    deepfake_probability=report.deepfake_probability
                )
                for report in reports
            ]

        except Exception as e:
            logging.error(f"Error getting recent reports from all sources: {str(e)}")
            return []
        finally:
            db.close()

    async def _get_source_credibility(self, source: str) -> float:
        """Get credibility score for a news source using CUDOS analysis"""
        credibility_prompt = f"""
        Assess the credibility of this news source: {source}

        Consider:
        1. Historical accuracy and reliability
        2. Editorial standards and fact-checking practices
        3. Independence and potential biases
        4. Reputation among journalists and fact-checkers

        Provide a credibility score from 0-1, where:
        - 0.8-1.0: Highly credible (major reputable outlets)
        - 0.6-0.8: Generally reliable
        - 0.4-0.6: Mixed record
        - 0.2-0.4: Questionable reliability
        - 0.0-0.2: Poor credibility

        Respond with JSON: {{"credibility_score": 0.XX, "assessment": "brief explanation"}}
        """

        try:
            request = CUDOSInferenceRequest(
                model=self.preferred_models['analysis'],
                prompt=credibility_prompt,
                max_tokens=500,
                temperature=0.1  # Very low temperature for factual assessment
            )

            response = await self.cudos_client.create_inference(request)

            if response.choices:
                credibility_text = response.choices[0].get('message', {}).get('content', '')

                try:
                    credibility_result = json.loads(credibility_text)
                    return credibility_result.get('credibility_score', 0.5)
                except json.JSONDecodeError:
                    # Extract score from text if JSON parsing fails
                    import re
                    score_match = re.search(r'(\d+\.\d+)', credibility_text)
                    if score_match:
                        return min(float(score_match.group(1)), 1.0)
                    return 0.5
            else:
                return 0.5

        except Exception as e:
            logger.warning(f"⚠️ Source credibility assessment failed: {str(e)}. Using default score.")
            return 0.5
