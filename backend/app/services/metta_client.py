import asyncio
import logging
from typing import Dict, Optional, List
from app.services.metta_service import MeTTaService
from app.models.newsmodels import NewsReportCreate, MediaAnalysisResponse

class MeTTaNewsClient:
    def __init__(self):
        self.metta_service = MeTTaService()
        self.knowledge_base = self.metta_service.knowledge_base

    async def submit_news_report(self, report: NewsReportCreate) -> Dict:
        """Submit a news report to MeTTa for integrity analysis"""
        try:
            # Convert NewsReportCreate to a mock NewsReport for metta operations
            class MockNewsReport:
                def __init__(self, report_data):
                    self.id = "temp_" + str(hash(str(report_data)))
                    self.category = report_data.get('category', 'general')
                    self.timestamp = report_data.get('timestamp')
                    self.latitude = report_data.get('latitude')
                    self.longitude = report_data.get('longitude')
                    self.media_url = report_data.get('media_url')
                    self.content = report_data.get('content')
                    self.source = report_data.get('source')
                    self.integrity_level = report_data.get('integrity_level', 'pending')

            class MockUser:
                def __init__(self, user_id):
                    self.id = user_id
                    self.location_region = None
                    self.trust_score = 50  # Default trust score
                    self.wallet_address = None

            mock_report = MockNewsReport(report.model_dump())
            mock_user = MockUser(report.user)

            # Create atoms using the service
            atoms = await self.metta_service.create_atoms(mock_report, mock_user)

            # Run verification using knowledge base directly
            verification_result = self.knowledge_base.run_verification(
                mock_report.id, mock_user.id, 70, 60  # Default confidence scores
            )

            return {
                'status': 'success',
                'atoms_created': len(atoms),
                'verified': verification_result.get('verified', False),
                'report_id': mock_report.id,
                'reasoning': verification_result.get('reasoning', [])
            }

        except Exception as e:
            logging.error(f"Failed to submit news report to MeTTa: {str(e)}")
            return {'error': str(e), 'status': 'failed'}

    async def get_source_analysis(self, source: str, days_back: int = 30) -> Optional[MediaAnalysisResponse]:
        """Get news integrity analysis for a specific source"""
        try:
            # Query MeTTa knowledge base for source-related atoms
            query = f'(news-source $news_id "{source}")'
            results = self.metta_service.query_knowledge_base(query, "event")

            if results:
                # Create a mock analysis response based on available data
                analysis = {
                    'source': source,
                    'total_reports': len(results),
                    'integrity_score': 0.7,  # Default score
                    'verification_rate': 0.6,
                    'days_analyzed': days_back
                }
                return MediaAnalysisResponse(**analysis)
            else:
                return None

        except Exception as e:
            logging.error(f"Failed to get source analysis from MeTTa: {str(e)}")
            return None

    async def get_global_integrity_patterns(self) -> Dict:
        """Get global news integrity patterns across all sources"""
        try:
            # Get knowledge base state
            kb_state = self.metta_service.get_knowledge_base_state()

            # Query for integrity patterns
            integrity_query = "(integrity-level $news $level)"
            integrity_results = self.knowledge_base.query_atoms(integrity_query, "event")

            # Query for source patterns
            source_query = "(news-source $news $source)"
            source_results = self.knowledge_base.query_atoms(source_query, "event")

            return {
                'patterns': {
                    'integrity_distribution': self._analyze_integrity_distribution(integrity_results),
                    'source_reliability': self._analyze_source_reliability(source_results),
                    'total_reports': kb_state.get('atom_counts', {}).get('news_reports', 0)
                },
                'knowledge_base_state': kb_state
            }

        except Exception as e:
            logging.error(f"Failed to get global integrity patterns from MeTTa: {str(e)}")
            return {'patterns': {}, 'error': str(e)}

    def _analyze_integrity_distribution(self, patterns: List[str]) -> Dict:
        """Analyze integrity level distribution"""
        levels = {'verified': 0, 'pending': 0, 'questionable': 0, 'debunked': 0}
        for pattern in patterns:
            if 'verified' in pattern.lower():
                levels['verified'] += 1
            elif 'pending' in pattern.lower():
                levels['pending'] += 1
            elif 'questionable' in pattern.lower():
                levels['questionable'] += 1
            elif 'debunked' in pattern.lower():
                levels['debunked'] += 1
        return levels

    def _analyze_source_reliability(self, patterns: List[str]) -> Dict:
        """Analyze source reliability patterns"""
        sources = {}
        for pattern in patterns:
            # Extract source from pattern (simplified parsing)
            if '"' in pattern:
                parts = pattern.split('"')
                if len(parts) >= 2:
                    source = parts[1]
                    sources[source] = sources.get(source, 0) + 1
        return sources

    async def analyze_content_integrity(self, content: str) -> Dict:
        """Analyze content for integrity indicators"""
        try:
            # Query knowledge base for similar content
            content_query = f'(content $news "{content[:50]}...")'
            content_matches = self.knowledge_base.query_atoms(content_query, "event")

            analysis_result = {
                'integrity_score': 0.7,  # Default score
                'content_length': len(content),
                'analysis_method': 'metta_knowledge_base',
                'existing_similar_content': len(content_matches),
                'indicators': {
                    'factual_content': True,
                    'bias_detected': False,
                    'source_cited': 'unknown'
                }
            }

            return analysis_result

        except Exception as e:
            logging.error(f"Failed to analyze content integrity: {str(e)}")
            return {'integrity_score': 0.5, 'error': str(e)}

    async def detect_misinformation_patterns(self, reports: List[Dict]) -> Dict:
        """Detect misinformation patterns across multiple reports"""
        try:
            patterns = []

            for report in reports:
                content = report.get('content', '')
                source = report.get('source', '')

                # Query for similar content
                similar_query = f'(content $news "{content[:30]}...")'
                similar_reports = self.knowledge_base.query_atoms(similar_query, "event")

                if len(similar_reports) > 1:
                    patterns.append({
                        'type': 'duplicate_content',
                        'report_id': report.get('id'),
                        'similar_reports': len(similar_reports),
                        'severity': 'medium'
                    })

                # Check source reliability
                source_query = f'(news-source $news "{source}")'
                source_reports = self.knowledge_base.query_atoms(source_query, "event")

                if len(source_reports) > 5:  # High volume from same source
                    patterns.append({
                        'type': 'high_volume_source',
                        'source': source,
                        'report_count': len(source_reports),
                        'severity': 'low'
                    })

            return {
                'patterns_detected': len(patterns),
                'patterns': patterns,
                'analysis_method': 'metta_pattern_matching'
            }

        except Exception as e:
            logging.error(f"Failed to detect misinformation patterns: {str(e)}")
            return {'patterns': [], 'error': str(e)}

    async def health_check(self) -> bool:
        """Check if MeTTa service is healthy"""
        try:
            # Check if we can query the knowledge base
            kb_state = self.metta_service.get_knowledge_base_state()
            return kb_state.get('base_knowledge_loaded', False)
        except Exception:
            return False
