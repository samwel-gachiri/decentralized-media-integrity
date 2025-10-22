from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class NewsCategory(str, Enum):
    politics = "politics"
    economy = "economy"
    technology = "technology"
    health = "health"
    environment = "environment"
    social = "social"
    international = "international"
    local = "local"

class IntegrityLevel(str, Enum):
    verified = "verified"
    questionable = "questionable"
    debunked = "debunked"
    pending = "pending"

class MediaType(str, Enum):
    article = "article"
    video = "video"
    image = "image"
    social_media = "social_media"
    broadcast = "broadcast"

class NewsReportCreate(BaseModel):
    user: str = Field(..., min_length=2, max_length=100)
    source: str = Field(..., min_length=2, max_length=100)
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=10000)
    category: NewsCategory
    media_type: MediaType
    url: Optional[str] = None
    media_url: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

class NewsReportResponse(BaseModel):
    id: int
    user: str
    source: str
    title: str
    content: str
    category: NewsCategory
    media_type: MediaType
    url: Optional[str]
    media_url: Optional[str]
    tags: List[str]
    latitude: Optional[float]
    longitude: Optional[float]
    timestamp: datetime
    integrity_level: IntegrityLevel = IntegrityLevel.pending
    verification_score: float = Field(0.0, ge=0, le=1)
    deepfake_probability: Optional[float] = Field(None, ge=0, le=1)
    fact_check_links: Optional[List[str]] = Field(default_factory=list)

class VerificationResponse(BaseModel):
    report_id: int
    integrity_level: IntegrityLevel
    verification_score: float
    reasoning: str
    confidence_factors: List[str]
    recommended_actions: List[str]

class SourceCredibilityResponse(BaseModel):
    source: str
    credibility_score: float = Field(..., ge=0, le=1)
    total_reports: int
    verified_reports: int
    debunked_reports: int
    average_verification_score: float

class MediaAnalysisResponse(BaseModel):
    source: str
    recent_reports: List[str]
    detected_patterns: List[Dict]
    credibility_score: SourceCredibilityResponse
    integrity_predictions: List[VerificationResponse]
    timestamp: datetime

class IntegrityAlertResponse(BaseModel):
    id: int
    source: str
    alert_type: str
    message: str
    severity: str
    created_at: datetime
    active: bool = True

class ReportStatsResponse(BaseModel):
    total_reports: int
    verified_reports: int
    verification_rate: float
    integrity_distribution: Dict[str, int]
    category_distribution: Dict[str, int]