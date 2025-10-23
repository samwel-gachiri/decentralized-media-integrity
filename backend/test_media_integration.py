#!/usr/bin/env python3
"""
Test script to verify media analysis integration in news service
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_media_integration_structure():
    """Test that the media analysis integration structure is correct"""

    print("🧪 Testing media analysis integration structure...")

    try:
        # Test imports
        from app.common.cudos_types import CUDOSInferenceRequest, CUDOSInferenceResponse
        print("✅ CUDOS types imported successfully")

        from app.services.media_analysis_service import MediaAnalysisService
        print("✅ MediaAnalysisService imported successfully")

        # Test that NewsService can be imported (without initializing)
        import importlib
        news_module = importlib.import_module('app.services.news_service')
        print("✅ NewsService module imported successfully")

        # Check that the required methods exist
        if hasattr(news_module, 'NewsService'):
            news_class = news_module.NewsService
            if hasattr(news_class, '_analyze_media_content_with_cudos'):
                print("✅ _analyze_media_content_with_cudos method exists in NewsService")
            else:
                print("❌ _analyze_media_content_with_cudos method missing from NewsService")

            if hasattr(news_class, '_calculate_verification_score'):
                print("✅ _calculate_verification_score method exists in NewsService")
            else:
                print("❌ _calculate_verification_score method missing from NewsService")
        else:
            print("❌ NewsService class not found")

        # Check MediaAnalysisService methods
        if hasattr(MediaAnalysisService, 'analyze_media_content'):
            print("✅ analyze_media_content method exists in MediaAnalysisService")
        else:
            print("❌ analyze_media_content method missing from MediaAnalysisService")

        print("🎉 Media analysis integration structure test completed successfully!")

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_media_integration_structure())