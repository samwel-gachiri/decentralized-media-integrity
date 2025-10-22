from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import threading
from contextlib import asynccontextmanager
from typing import List

# Global thread safety
_initialized = False
_init_lock = threading.Lock()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global _initialized
    with _init_lock:
        if not _initialized:
            print(" Starting Decentralized News Integrity API...")
            
            # Initialize database tables for news models
            from app.models.database import create_tables
            create_tables()
            print("News database tables initialized")
            
            # Start background cleanup task
            from app.services.news_service import NewsService
            news_service = NewsService()
            await news_service.cleanup_old_data()
            print("News data cleanup scheduled")
            
            _initialized = True
        else:
            print("API already initialized, skipping startup...")
    yield
    # Shutdown
    print("Shutting down Decentralized News Integrity API...")

# Create FastAPI app ONCE
app = FastAPI(
    title="Decentralized News Integrity API",
    description="Backend API for community-driven news verification and media integrity using MeTTa knowledge atoms and CUDOS blockchain",
    version="1.0.0",
    lifespan=lifespan
)

# frontend port
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.api.routes import events, metta, users, auth, community_verification, economic_impact, dao_governance, alerts, ai_metta, news

try:
    from app.api.routes import blockchain
    BLOCKCHAIN_AVAILABLE = True
except ImportError as e:
    print(f"Blockchain service disabled: {e}")
    BLOCKCHAIN_AVAILABLE = False

# Import the news models and services we created
from app.models.database import get_db
from app.services.news_service import NewsService
from app.models.newsmodels import (
    NewsReportCreate, 
    NewsReportResponse,
    MediaAnalysisResponse,
    IntegrityAlertResponse,
    ReportStatsResponse
)

# Initialize news service
news_service = NewsService()

# handle endpoints
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(metta.router, prefix="/api/metta", tags=["metta"])
app.include_router(ai_metta.router, prefix="/api/ai-metta", tags=["ai-metta"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(community_verification.router, prefix="/api/community-verification", tags=["community-verification"])
app.include_router(economic_impact.router, prefix="/api/economic-impact", tags=["economic-impact"])
app.include_router(dao_governance.router, prefix="/api/dao", tags=["dao-governance"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(news.router, prefix="/api/news", tags=["news"])


if BLOCKCHAIN_AVAILABLE:
    app.include_router(blockchain.router, prefix="/api/blockchain", tags=["blockchain"])
    print("Blockchain service enabled")
else:
    print("Blockchain service disabled - install 'setuptools' to enable")


os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/api/news/reports", response_model=NewsReportResponse, tags=["news"])
async def create_news_report(report: NewsReportCreate):
    """Create a new news report"""
    try:
        return await news_service.create_news_report(report)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error creating news report: {str(e)}")

@app.get("/api/news/reports/{source}", response_model=List[NewsReportResponse], tags=["news"])
async def get_news_reports(source: str, limit: int = 10):
    """Get recent news reports for a source"""
    reports = await news_service.get_recent_reports(source, limit)
    if not reports:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No news reports found for this source")
    return reports

@app.get("/api/news/analysis/{source}", response_model=dict, tags=["news"])
async def get_news_analysis(source: str):
    """Get news analysis for a source"""
    analysis = await news_service.get_source_analysis(source)
    if not analysis:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="News analysis not available for this source")
    return analysis

@app.get("/api/news/alerts/{source}", response_model=List[IntegrityAlertResponse], tags=["news"])
async def get_news_alerts(source: str):
    """Get active news integrity alerts for a source"""
    alerts = await news_service.get_news_alerts(source)
    return alerts

@app.get("/api/news/stats/{source}", response_model=ReportStatsResponse, tags=["news"])
async def get_news_stats(source: str):
    """Get statistics for news reports from a source"""
    stats = await news_service.get_report_stats(source)
    return stats

@app.get("/api/news/sources", tags=["news"])
async def get_news_sources():
    """Get all sources with news reports"""
    sources = await news_service.get_all_sources()
    return {"sources": sources}

@app.get("/api/news/stats", tags=["news"])
async def get_global_news_stats():
    """Get global news statistics"""
    stats = await news_service.get_global_stats()
    return stats

@app.get("/api/news/reports/recent", response_model=List[NewsReportResponse], tags=["news"])
async def get_recent_news_reports(limit: int = 10):
    """Get recent news reports from all sources"""
    reports = await news_service.get_recent_reports_all_sources(limit)
    return reports

@app.post("/api/news/reports/{report_id}/verify", tags=["news"])
async def verify_news_report(report_id: int, verified: bool = True):
    """Verify or unverify a news report"""
    success = await news_service.verify_report(report_id, verified)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="News report not found")
    return {"status": "success", "verified": verified}

@app.get("/api/news/health", tags=["news"])
async def news_health_check():
    """News service health check"""
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": "news_integrity_service"
    }

@app.get("/")
async def root():
    return {"message": "Decentralized News Integrity API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)