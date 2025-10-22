import httpx
import asyncio
from typing import Dict, Optional, List
import logging
import os
from app.models.newsmodels import NewsReportCreate, MediaAnalysisResponse

class MeTTaNewsClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv('METTA_SERVICE_URL', 'http://localhost:8001')
        self.timeout = 30.0

    async def submit_news_report(self, report: NewsReportCreate) -> Dict:
        """Submit a news report to MeTTa for integrity analysis"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Convert enums to strings for JSON serialization
                report_data = report.model_dump()
                report_data['category'] = report_data['category'].value
                report_data['media_type'] = report_data['media_type'].value

                response = await client.post(
                    f"{self.base_url}/news/report",
                    json=report_data
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            logging.error(f"MeTTa service returned error: {e.response.status_code} - {e.response.text}")
            return {'error': f"Service error: {e.response.status_code}", 'status': 'failed'}
        except httpx.RequestError as e:
            logging.error(f"Failed to submit news report to MeTTa: {str(e)}")
            return {'error': 'Service unavailable', 'status': 'failed'}

    async def get_source_analysis(self, source: str, days_back: int = 30) -> Optional[MediaAnalysisResponse]:
        """Get news integrity analysis for a specific source"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/news/analyze/{source}",
                    params={'days_back': days_back}
                )
                response.raise_for_status()
                data = response.json()
                return MediaAnalysisResponse(**data)

        except httpx.RequestError as e:
            logging.error(f"Failed to get source analysis from MeTTa: {str(e)}")
            return None

    async def get_global_integrity_patterns(self) -> Dict:
        """Get global news integrity patterns across all sources"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/news/patterns/global")
                response.raise_for_status()
                return response.json()

        except httpx.RequestError as e:
            logging.error(f"Failed to get global integrity patterns from MeTTa: {str(e)}")
            return {'patterns': {}, 'error': str(e)}

    async def analyze_content_integrity(self, content: str) -> Dict:
        """Analyze content for integrity indicators"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/news/analyze-content",
                    json={'content': content}
                )
                response.raise_for_status()
                return response.json()

        except httpx.RequestError as e:
            logging.error(f"Failed to analyze content integrity: {str(e)}")
            return {'integrity_score': 0.5, 'error': str(e)}

    async def detect_misinformation_patterns(self, reports: List[Dict]) -> Dict:
        """Detect misinformation patterns across multiple reports"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/news/detect-patterns",
                    json={'reports': reports}
                )
                response.raise_for_status()
                return response.json()

        except httpx.RequestError as e:
            logging.error(f"Failed to detect misinformation patterns: {str(e)}")
            return {'patterns': [], 'error': str(e)}

    async def health_check(self) -> bool:
        """Check if MeTTa service is healthy"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200

        except httpx.RequestError:
            return False
