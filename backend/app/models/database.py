from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Enum, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import enum
from datetime import datetime
from typing import Generator

Base = declarative_base()

class NewsCategoryEnum(enum.Enum):
    politics = "politics"
    economy = "economy"
    technology = "technology"
    health = "health"
    environment = "environment"
    social = "social"
    international = "international"
    local = "local"

class IntegrityLevelEnum(enum.Enum):
    verified = "verified"
    questionable = "questionable"
    debunked = "debunked"
    pending = "pending"

class MediaTypeEnum(enum.Enum):
    article = "article"
    video = "video"
    image = "image"
    social_media = "social_media"
    broadcast = "broadcast"

class NewsReport(Base):
    __tablename__ = "news_reports"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String(100), nullable=False)
    source = Column(String(100), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(Enum(NewsCategoryEnum), nullable=False)
    media_type = Column(Enum(MediaTypeEnum), nullable=False)
    url = Column(String(500))
    media_url = Column(String(500))
    tags = Column(Text)  # JSON array
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    integrity_level = Column(Enum(IntegrityLevelEnum), default=IntegrityLevelEnum.pending)
    verification_score = Column(Float, default=0.0)
    deepfake_probability = Column(Float)
    fact_check_links = Column(Text)  # JSON array

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.user,
            'source': self.source,
            'title': self.title,
            'content': self.content,
            'category': self.category.value,
            'media_type': self.media_type.value,
            'url': self.url,
            'media_url': self.media_url,
            'tags': self.tags,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'timestamp': self.timestamp,
            'integrity_level': self.integrity_level.value,
            'verification_score': self.verification_score,
            'deepfake_probability': self.deepfake_probability,
            'fact_check_links': self.fact_check_links
        }

class IntegrityAlert(Base):
    __tablename__ = "integrity_alerts"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    active = Column(Boolean, default=True)

class PatternCache(Base):
    __tablename__ = "pattern_cache"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(100), nullable=False, index=True)
    analysis_data = Column(Text, nullable=False)  # JSON data
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

class DecentralizedStorage(Base):
    __tablename__ = "decentralized_storage"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False, index=True)
    cudos_cid = Column(String(100), nullable=False)  # Content Identifier
    storage_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=True)

# Database setup
def get_database_url():
    return "sqlite:///./news_integrity.db"

def create_database_engine():
    return create_engine(get_database_url(), connect_args={"check_same_thread": False})

def create_tables():
    engine = create_database_engine()
    Base.metadata.create_all(bind=engine)

def get_session():
    engine = create_database_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def get_db() -> Generator:
    """Get database session with context manager"""
    db = get_session()
    try:
        yield db
    finally:
        db.close()