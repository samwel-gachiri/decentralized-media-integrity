from typing import Dict, Any, Optional, List
import json
import logging
import asyncio
import base64
import io
from PIL import Image
import requests
from app.common.cudos_types import CUDOSInferenceRequest

logger = logging.getLogger(__name__)

class MediaAnalysisService:
    """
    Service for AI-powered analysis of media content (images and videos) using CUDOS ASI Cloud
    """

    def __init__(self, cudos_client):
        self.cudos_client = cudos_client
        self.preferred_models = {
            'vision': 'google/gemma-3-27b-it',  # Vision-capable model for image analysis
            'video': 'meta-llama/llama-3.3-70b-instruct',   # Can handle video frames
            'content_analysis': 'openai/gpt-oss-20b'  # For content verification
        }

    async def analyze_media_content(self, media_url: str, media_type: str, context: Dict = None, uploaded_file_data: Optional[bytes] = None) -> Dict[str, Any]:
        """
        Analyze media content using CUDOS AI for comprehensive content understanding

        Args:
            media_url: URL of the media file or uploaded:// identifier
            media_type: 'image' or 'video'
            context: Additional context (title, description, etc.)
            uploaded_file_data: Binary data of uploaded file if available

        Returns:
            Comprehensive media analysis results
        """
        try:
            context = context or {}

            if media_type.lower() == 'image':
                return await self._analyze_image_content(media_url, context, uploaded_file_data)
            elif media_type.lower() == 'video':
                return await self._analyze_video_content(media_url, context, uploaded_file_data)
            else:
                return {
                    'error': f'Unsupported media type: {media_type}',
                    'supported_types': ['image', 'video']
                }

        except Exception as e:
            logger.error(f"Media analysis failed: {str(e)}")
            return {
                'error': str(e),
                'media_type': media_type,
                'analysis_performed': False
            }

    async def _analyze_image_content(self, image_url: str, context: Dict, uploaded_file_data: Optional[bytes] = None) -> Dict[str, Any]:
        """Analyze image content using CUDOS vision AI"""
        try:
            # Download and process image
            image_data = await self._download_and_process_image(image_url, uploaded_file_data)
            if not image_data:
                return {'error': 'Failed to download or process image'}

            # Create analysis prompt
            analysis_prompt = self._create_image_analysis_prompt(image_data, context)

            # Use CUDOS for comprehensive image analysis
            request = CUDOSInferenceRequest(
                model=self.preferred_models['vision'],
                prompt=analysis_prompt,
                max_tokens=2000,
                temperature=0.1  # Low temperature for factual analysis
            )

            response = await self.cudos_client.create_inference(request)

            if response.choices:
                analysis_text = response.choices[0].get('message', {}).get('content', '')

                try:
                    # Try to parse JSON response
                    analysis_result = json.loads(analysis_text)
                except json.JSONDecodeError:
                    # Extract JSON from markdown if needed
                    import re
                    json_match = re.search(r'```json\s*\n(.*?)\n```', analysis_text, re.DOTALL)
                    if json_match:
                        analysis_result = json.loads(json_match.group(1))
                    else:
                        # Fallback: create structured response from text
                        analysis_result = self._parse_image_analysis_text(analysis_text)

                # Add metadata
                analysis_result.update({
                    'media_type': 'image',
                    'analysis_method': 'cudos_vision_ai',
                    'model_used': self.preferred_models['vision'],
                    'image_processed': True,
                    'inference_id': response.id
                })

                logger.info(f"Image analysis completed: {analysis_result.get('primary_subject', 'unknown')}")
                return analysis_result

            return {'error': 'No response from CUDOS vision analysis'}

        except Exception as e:
            logger.error(f"Image analysis failed: {str(e)}")
            return {'error': str(e), 'media_type': 'image'}

    async def _analyze_video_content(self, video_url: str, context: Dict, uploaded_file_data: Optional[bytes] = None) -> Dict[str, Any]:
        """Analyze video content by extracting key frames and using CUDOS vision AI"""
        try:
            # For video analysis, we'll extract key frames and analyze them
            # This is a simplified implementation - in production, you'd use proper video processing

            video_analysis = {
                'media_type': 'video',
                'analysis_method': 'frame_extraction_cudos_vision',
                'key_frames_analyzed': 0,
                'frame_analyses': [],
                'overall_assessment': {}
            }

            # Simulate frame extraction (in production, use OpenCV or similar)
            # For now, we'll analyze the video as if it were an image
            # TODO: Implement proper video frame extraction

            logger.warning("Video analysis is simplified - implement proper frame extraction for production")

            # Create video analysis prompt
            analysis_prompt = self._create_video_analysis_prompt(video_url, context)

            request = CUDOSInferenceRequest(
                model=self.preferred_models['content_analysis'],
                prompt=analysis_prompt,
                max_tokens=1500,
                temperature=0.1
            )

            response = await self.cudos_client.create_inference(request)

            if response.choices:
                analysis_text = response.choices[0].get('message', {}).get('content', '')

                try:
                    analysis_result = json.loads(analysis_text)
                    video_analysis['overall_assessment'] = analysis_result
                except json.JSONDecodeError:
                    video_analysis['overall_assessment'] = {
                        'description': analysis_text[:500],
                        'confidence': 0.5
                    }

            return video_analysis

        except Exception as e:
            logger.error(f"Video analysis failed: {str(e)}")
            return {'error': str(e), 'media_type': 'video'}

    async def _download_and_process_image(self, image_url: str, uploaded_file_data: Optional[bytes] = None) -> Optional[str]:
        """Download image from URL, read from uploaded data, or read from local path and convert to base64 for AI analysis"""
        try:
            # Check if we have uploaded file data
            if uploaded_file_data and image_url.startswith('uploaded://'):
                image_data = uploaded_file_data
                # Determine content type from the URL identifier (could be enhanced)
                content_type = 'image/jpeg'  # Default, could be improved
            # Check if it's a URL or local file path
            elif image_url.startswith(('http://', 'https://')):
                # Handle URL
                response = requests.get(image_url, timeout=15, stream=True)
                if response.status_code != 200:
                    logger.error(f"Failed to download image: HTTP {response.status_code}")
                    return None

                # Check content type
                content_type = response.headers.get('content-type', '').lower()
                if not content_type.startswith('image/'):
                    logger.warning(f"URL does not contain image content: {content_type}")
                    return None

                # Read image data
                image_data = response.content
            else:
                # Handle local file path
                import os
                if not os.path.exists(image_url):
                    logger.error(f"Local image file not found: {image_url}")
                    return None

                # Read local file
                with open(image_url, 'rb') as f:
                    image_data = f.read()

                # Determine content type from file extension
                _, ext = os.path.splitext(image_url)
                ext = ext.lower()
                content_type_map = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.bmp': 'image/bmp',
                    '.webp': 'image/webp'
                }
                content_type = content_type_map.get(ext, 'image/jpeg')

            # Validate image can be opened
            try:
                img = Image.open(io.BytesIO(image_data))
                img.verify()  # Verify it's a valid image
            except Exception as e:
                logger.error(f"Invalid image data: {str(e)}")
                return None

            # Convert to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')

            return f"data:{content_type};base64,{base64_image}"

        except Exception as e:
            logger.error(f"Image download/processing failed: {str(e)}")
            return None

    def _create_image_analysis_prompt(self, image_data: str, context: Dict) -> str:
        """Create comprehensive image analysis prompt for CUDOS"""
        title = context.get('title', 'Unknown')
        description = context.get('description', 'No description provided')
        source = context.get('source', 'Unknown source')

        return f"""
        Analyze this image in the context of news verification. The image is associated with:
        - Title: {title}
        - Description: {description}
        - Source: {source}

        Provide a comprehensive analysis covering:

        1. VISUAL CONTENT ANALYSIS:
           - What is the primary subject/matter shown in the image?
           - Are there any people, objects, locations, or events depicted?
           - What is happening in the image?
           - Time of day, weather conditions, setting?

        2. NEWS RELEVANCE ASSESSMENT:
           - How relevant is this image to the news story?
           - Does it support or contradict the described event?
           - Are there any signs of manipulation or editing?

        3. AUTHENTICITY INDICATORS:
           - Does the image appear authentic or potentially manipulated?
           - Quality assessment (resolution, lighting, composition)
           - Any metadata clues about authenticity?

        4. CONTEXTUAL VERIFICATION:
           - Does the visual content match the described news event?
           - Are there geographical/cultural consistency indicators?
           - Time period consistency with the news event?

        5. SENSITIVITY & APPROPRIATENESS:
           - Content sensitivity level
           - Appropriateness for news reporting
           - Potential ethical concerns

        6. OVERALL ASSESSMENT:
           - Credibility score (0-1) for the image supporting the news
           - Confidence in analysis (0-1)
           - Key findings and recommendations

        IMPORTANT: Focus on visual analysis and news context. Do not make assumptions beyond what's visible in the image.

        Respond with JSON format:
        {{
            "primary_subject": "description of main content",
            "visual_elements": ["list", "of", "key", "visual", "elements"],
            "news_relevance": 0.XX,
            "authenticity_score": 0.XX,
            "contextual_consistency": 0.XX,
            "manipulation_indicators": ["any", "signs", "of", "editing"],
            "credibility_assessment": 0.XX,
            "confidence": 0.XX,
            "key_findings": ["important", "observations"],
            "recommendations": ["suggestions", "for", "verification"],
            "content_warnings": ["any", "sensitivity", "issues"]
        }}
        """

    def _create_video_analysis_prompt(self, video_url: str, context: Dict) -> str:
        """Create video analysis prompt for CUDOS"""
        title = context.get('title', 'Unknown')
        description = context.get('description', 'No description provided')
        source = context.get('source', 'Unknown source')

        return f"""
        Analyze this video content in the context of news verification. The video is associated with:
        - Title: {title}
        - Description: {description}
        - Source: {source}
        - URL: {video_url}

        Since I cannot directly view the video, provide analysis guidance based on the context and general video verification principles:

        1. CONTENT EXPECTATION:
           - What type of content would you expect to see based on the title/description?
           - Key visual elements that should be present?

        2. VERIFICATION APPROACH:
           - How to verify the video's authenticity?
           - What metadata should be checked?
           - Platform verification methods?

        3. MANIPULATION DETECTION:
           - Common video manipulation techniques to watch for?
           - Audio-visual synchronization issues?
           - Contextual inconsistencies?

        4. NEWS CONTEXT ANALYSIS:
           - Does the described event typically involve video evidence?
           - Timeline consistency with video availability?
           - Source credibility for video content?

        5. RECOMMENDED VERIFICATION STEPS:
           - Technical verification methods
           - Source verification approaches
           - Cross-reference suggestions

        Respond with JSON format:
        {{
            "expected_content": "description of what should be in video",
            "verification_methods": ["list", "of", "verification", "approaches"],
            "manipulation_risks": ["potential", "manipulation", "techniques"],
            "contextual_assessment": 0.XX,
            "verification_confidence": 0.XX,
            "recommended_actions": ["specific", "verification", "steps"],
            "risk_level": "low|medium|high"
        }}
        """

    def _parse_image_analysis_text(self, analysis_text: str) -> Dict[str, Any]:
        """Parse non-JSON image analysis response into structured format"""
        # Extract key information from text response
        analysis_result = {
            'primary_subject': 'Unable to determine from text response',
            'visual_elements': [],
            'news_relevance': 0.5,
            'authenticity_score': 0.5,
            'contextual_consistency': 0.5,
            'manipulation_indicators': [],
            'credibility_assessment': 0.5,
            'confidence': 0.3,
            'key_findings': [analysis_text[:200] + '...'],
            'recommendations': ['Manual review recommended'],
            'content_warnings': [],
            'raw_response': analysis_text
        }

        # Try to extract some basic information
        text_lower = analysis_text.lower()

        # Look for authenticity indicators
        if 'authentic' in text_lower or 'genuine' in text_lower:
            analysis_result['authenticity_score'] = 0.8
        elif 'manipulated' in text_lower or 'fake' in text_lower or 'edited' in text_lower:
            analysis_result['authenticity_score'] = 0.2
            analysis_result['manipulation_indicators'].append('Potential manipulation detected')

        # Look for relevance indicators
        if 'relevant' in text_lower or 'matches' in text_lower or 'consistent' in text_lower:
            analysis_result['news_relevance'] = 0.8
            analysis_result['contextual_consistency'] = 0.8
        elif 'irrelevant' in text_lower or 'contradicts' in text_lower:
            analysis_result['news_relevance'] = 0.2
            analysis_result['contextual_consistency'] = 0.2

        return analysis_result

    async def analyze_media_with_news_context(self, media_url: str, media_type: str,
                                            news_title: str, news_content: str,
                                            source: str) -> Dict[str, Any]:
        """
        Comprehensive analysis combining media content with news context using CUDOS

        Args:
            media_url: URL of the media file
            media_type: 'image' or 'video'
            news_title: Title of the news article
            news_content: Content of the news article
            source: Source of the news

        Returns:
            Comprehensive analysis results
        """
        try:
            # First, analyze the media content
            media_analysis = await self.analyze_media_content(
                media_url,
                media_type,
                {'title': news_title, 'description': news_content, 'source': source}
            )

            if 'error' in media_analysis:
                return media_analysis

            # Then, perform contextual verification using CUDOS
            context_analysis = await self._analyze_media_news_context(
                media_analysis,
                news_title,
                news_content,
                source
            )

            # Combine results
            comprehensive_analysis = {
                'media_analysis': media_analysis,
                'context_analysis': context_analysis,
                'overall_verification': self._combine_analyses(media_analysis, context_analysis),
                'timestamp': asyncio.get_event_loop().time(),
                'analysis_method': 'cudos_media_news_integration'
            }

            return comprehensive_analysis

        except Exception as e:
            logger.error(f"Comprehensive media analysis failed: {str(e)}")
            return {'error': str(e), 'analysis_type': 'comprehensive_media_news'}

    async def _analyze_media_news_context(self, media_analysis: Dict, news_title: str,
                                        news_content: str, source: str) -> Dict[str, Any]:
        """Analyze how well media content supports the news narrative"""

        context_prompt = f"""
        Analyze how well this media content supports the associated news story:

        NEWS STORY:
        Title: {news_title}
        Content: {news_content[:1000]}...  # Truncated for API limits
        Source: {source}

        MEDIA ANALYSIS RESULTS:
        {json.dumps(media_analysis, indent=2)}

        Evaluate:
        1. CONSISTENCY: How well does the media content match the news description?
        2. SUPPORT: Does the media provide evidence for the news claims?
        3. AUTHENTICITY: Does the media appear genuine and unmanipulated?
        4. CONTEXT: Is the media contextually appropriate for the news event?
        5. VERIFICATION STRENGTH: Overall strength of media as verification evidence

        Provide detailed analysis with scores and reasoning.

        Respond with JSON:
        {{
            "content_consistency": 0.XX,
            "evidentiary_support": 0.XX,
            "authenticity_verification": 0.XX,
            "contextual_appropriateness": 0.XX,
            "overall_verification_strength": 0.XX,
            "supporting_evidence": ["list", "of", "supporting", "factors"],
            "concerning_factors": ["list", "of", "concerning", "issues"],
            "verification_confidence": 0.XX,
            "recommendations": ["verification", "recommendations"],
            "risk_assessment": "low|medium|high|critical"
        }}
        """

        try:
            request = CUDOSInferenceRequest(
                model=self.preferred_models['content_analysis'],
                prompt=context_prompt,
                max_tokens=1500,
                temperature=0.1
            )

            response = await self.cudos_client.create_inference(request)

            if response.choices:
                analysis_text = response.choices[0].get('message', {}).get('content', '')

                try:
                    return json.loads(analysis_text)
                except json.JSONDecodeError:
                    # Extract JSON from markdown
                    import re
                    json_match = re.search(r'```json\s*\n(.*?)\n```', analysis_text, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group(1))

                    # Fallback parsing
                    return {
                        'content_consistency': 0.5,
                        'evidentiary_support': 0.5,
                        'authenticity_verification': media_analysis.get('authenticity_score', 0.5),
                        'contextual_appropriateness': 0.5,
                        'overall_verification_strength': 0.5,
                        'supporting_evidence': ['Analysis completed but parsing failed'],
                        'concerning_factors': [],
                        'verification_confidence': 0.3,
                        'recommendations': ['Manual review recommended'],
                        'risk_assessment': 'medium',
                        'raw_response': analysis_text
                    }

            return {'error': 'No response from context analysis'}

        except Exception as e:
            logger.error(f"Context analysis failed: {str(e)}")
            return {'error': str(e)}

    def _combine_analyses(self, media_analysis: Dict, context_analysis: Dict) -> Dict[str, Any]:
        """Combine media and context analyses into overall verification result"""

        # Extract key scores
        media_authenticity = media_analysis.get('authenticity_score', 0.5)
        media_relevance = media_analysis.get('news_relevance', 0.5)
        media_credibility = media_analysis.get('credibility_assessment', 0.5)

        context_consistency = context_analysis.get('content_consistency', 0.5)
        context_support = context_analysis.get('evidentiary_support', 0.5)
        context_authenticity = context_analysis.get('authenticity_verification', 0.5)
        context_strength = context_analysis.get('overall_verification_strength', 0.5)

        # Calculate weighted overall score
        media_weight = 0.4
        context_weight = 0.6

        overall_score = (
            media_weight * ((media_authenticity + media_relevance + media_credibility) / 3) +
            context_weight * ((context_consistency + context_support + context_authenticity + context_strength) / 4)
        )

        # Determine verification level
        if overall_score >= 0.8:
            verification_level = 'verified'
            confidence_level = 'high'
        elif overall_score >= 0.6:
            verification_level = 'likely_verified'
            confidence_level = 'medium'
        elif overall_score >= 0.4:
            verification_level = 'questionable'
            confidence_level = 'low'
        else:
            verification_level = 'debunked'
            confidence_level = 'high'

        return {
            'overall_verification_score': round(overall_score, 3),
            'verification_level': verification_level,
            'confidence_level': confidence_level,
            'media_contribution': round(media_weight * (media_authenticity + media_relevance + media_credibility) / 3, 3),
            'context_contribution': round(context_weight * (context_consistency + context_support + context_authenticity + context_strength) / 4, 3),
            'key_factors': {
                'strongest_evidence': context_analysis.get('supporting_evidence', [])[:3],
                'concerns': context_analysis.get('concerning_factors', [])[:3]
            },
            'recommendations': context_analysis.get('recommendations', []),
            'risk_assessment': context_analysis.get('risk_assessment', 'medium')
        }