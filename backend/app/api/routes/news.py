from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from typing import Optional, List
import uuid
import os
from datetime import datetime
import json
import logging
from hyperon import Atom

from app.models.database import get_db
from app.models.newsmodels import NewsReportCreate, NewsReportResponse, IntegrityAlertResponse, ReportStatsResponse
from app.services.news_service import NewsService
from app.services.metta_service import MeTTaService
from sqlalchemy.orm import Session

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
news_service = NewsService()
metta_client = MeTTaService()

# --- Robust serialization helpers ---
def serialize_catom(catom: Atom):
    """Convert Atom to JSON-safe format"""
    try:
        if hasattr(catom, "is_symbol") and catom.is_symbol():
            return str(catom)
        if hasattr(catom, "is_expression") and catom.is_expression():
            return [serialize_catom(c) for c in catom.get_children()]
        if hasattr(catom, "is_grounded") and catom.is_grounded():
            value = catom.get_grounded_value()
            return str(value) if value is not None else str(catom)
        if hasattr(catom, "get_children"):
            return [serialize_catom(c) for c in catom.get_children()]
        return str(catom)
    except Exception as e:
        logger.error(f"Failed to serialize Atom: {e}")
        return {"error": str(e), "type": type(catom).__name__}

def serialize_metta_result(result):
    """Recursively serialize MeTTa/AI results"""
    if isinstance(result, Atom):
        return serialize_catom(result)
    elif isinstance(result, list):
        return [serialize_metta_result(item) for item in result]
    elif isinstance(result, dict):
        return {key: serialize_metta_result(value) for key, value in result.items()}
    else:
        return result

@router.post("/reports", response_model=NewsReportResponse)
async def create_news_report(
    user: str = Form(...),
    source: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form(...),
    media_type: Optional[str] = Form(None),  # snake_case
    mediaType: Optional[str] = Form(None),   # camelCase
    url: Optional[str] = Form(None),
    media_url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    media_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new news report with optional media upload"""
    try:
        # Parse tags if provided
        parsed_tags = json.loads(tags) if tags else []

        # Handle media file upload if provided
        final_media_url = media_url
        if media_file:
            # Save uploaded file
            file_extension = os.path.splitext(media_file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)

            os.makedirs("uploads", exist_ok=True)
            with open(file_path, "wb") as buffer:
                content = await media_file.read()
                buffer.write(content)

            final_media_url = f"/uploads/{unique_filename}"

        # Handle media type (support both snake_case and camelCase)
        final_media_type = media_type or mediaType
        if not final_media_type:
            raise HTTPException(status_code=422, detail="media_type or mediaType is required")

        # Create report data
        report_data = NewsReportCreate(
            user=user,
            source=source,
            title=title,
            content=content,
            category=category,
            media_type=final_media_type,
            url=url,
            media_url=final_media_url,
            tags=parsed_tags,
            latitude=latitude,
            longitude=longitude
        )

        # Create the report
        result = await news_service.create_news_report(report_data)
        return result

    except Exception as e:
        logger.error(f"Error creating news report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating news report: {str(e)}")

@router.get("/reports", response_model=List[NewsReportResponse])
async def get_all_news_reports(limit: int = 10):
    """Get recent news reports from all sources"""
    try:
        reports = await news_service.get_recent_reports_all_sources(limit)
        return reports
    except Exception as e:
        logger.error(f"Error getting all news reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting all news reports: {str(e)}")

@router.get("/reports/{source}", response_model=List[NewsReportResponse])
async def get_news_reports(source: str, limit: int = 10):
    """Get recent news reports for a source"""
    try:
        reports = await news_service.get_recent_reports(source, limit)
        return reports
    except Exception as e:
        logger.error(f"Error getting news reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting news reports: {str(e)}")

@router.get("/reports/recent", response_model=List[NewsReportResponse])
async def get_recent_news_reports(limit: int = 10):
    """Get recent news reports from all sources"""
    try:
        reports = await news_service.get_recent_reports_all_sources(limit)
        return reports
    except Exception as e:
        logger.error(f"Error getting recent news reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting recent news reports: {str(e)}")

@router.get("/analysis/{source}")
async def get_news_analysis(source: str):
    """Get news integrity analysis for a source"""
    try:
        analysis = await news_service.get_source_analysis(source)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not available for this source")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting news analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting news analysis: {str(e)}")

@router.get("/alerts/{source}", response_model=List[IntegrityAlertResponse])
async def get_news_alerts(source: str):
    """Get active news integrity alerts for a source"""
    try:
        alerts = await news_service.get_news_alerts(source)
        return alerts
    except Exception as e:
        logger.error(f"Error getting news alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting news alerts: {str(e)}")

@router.get("/stats/{source}", response_model=ReportStatsResponse)
async def get_news_stats(source: str):
    """Get statistics for news reports from a source"""
    try:
        stats = await news_service.get_report_stats(source)
        return stats
    except Exception as e:
        logger.error(f"Error getting news stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting news stats: {str(e)}")

@router.get("/sources")
async def get_news_sources():
    """Get all sources with news reports"""
    try:
        sources = await news_service.get_all_sources()
        return {"sources": sources}
    except Exception as e:
        logger.error(f"Error getting news sources: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting news sources: {str(e)}")

@router.get("/stats")
async def get_global_news_stats():
    """Get global news statistics"""
    try:
        stats = await news_service.get_global_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting global news stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting global news stats: {str(e)}")

@router.post("/reports/{report_id}/verify")
async def verify_news_report(report_id: int, verified: bool = True):
    """Verify or unverify a news report"""
    try:
        success = await news_service.verify_report(report_id, verified)
        if not success:
            raise HTTPException(status_code=404, detail="News report not found")
        return {"status": "success", "verified": verified}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying news report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error verifying news report: {str(e)}")

@router.get("/health")
async def news_health_check():
    """News service health check"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc),
            "service": "news_integrity_service"
        }
    except Exception as e:
        logger.error(f"Error in news health check: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")

@router.post("/analyze-content")
async def analyze_content_integrity(request: Request):
    """Analyze content for integrity indicators"""
    try:
        data = await request.json()
        content = data.get('content', '')
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")

        analysis = await metta_client.analyze_content_integrity(content)
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing content: {str(e)}")

@router.get("/patterns/global")
async def get_global_integrity_patterns():
    """Get global news integrity patterns"""
    try:
        patterns = await metta_client.get_global_integrity_patterns()
        return patterns
    except Exception as e:
        logger.error(f"Error getting global patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting global patterns: {str(e)}")

@router.post("/detect-patterns")
async def detect_misinformation_patterns(request: Request):
    """Detect misinformation patterns across multiple reports"""
    try:
        data = await request.json()
        reports = data.get('reports', [])
        if not reports:
            raise HTTPException(status_code=400, detail="Reports are required")

        patterns = await metta_client.detect_misinformation_patterns(reports)
        return patterns
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting patterns: {str(e)}")