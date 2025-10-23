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


from app.api.routes import events, metta, users, auth, community_verification, economic_impact, dao_governance, alerts, ai_metta, news, decentralized_storage

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
app.include_router(decentralized_storage.router, prefix="/api/decentralized", tags=["decentralized-storage"])
app.include_router(news.router, prefix="/api/news", tags=["news"])


if BLOCKCHAIN_AVAILABLE:
    app.include_router(blockchain.router, prefix="/api/blockchain", tags=["blockchain"])
    print("Blockchain service enabled")
else:
    print("Blockchain service disabled - install 'setuptools' to enable")


os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Decentralized News Integrity API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)