from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional, List
from app.services.decentralized_storage_service import decentralized_storage_service
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/store-verified-news")
async def store_verified_news_endpoint(report_data: Dict, verification_metadata: Dict):
    """Store verified news content on decentralized storage (IPFS + blockchain)"""
    try:
        result = await decentralized_storage_service.store_verified_news(
            report_data,
            verification_metadata
        )

        if result['success']:
            return {
                "message": "Verified news stored on decentralized storage",
                "ipfs_cid": result['ipfs_cid'],
                "ipfs_url": result['ipfs_url'],
                "blockchain_tx": result.get('blockchain_tx'),
                "verification_id": result.get('verification_id'),
                "stored_at": result['stored_at']
            }
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Storage failed'))

    except Exception as e:
        logger.error(f"Failed to store verified news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Storage failed: {str(e)}")

@router.get("/content/{cid}")
async def retrieve_verified_news(cid: str):
    """Retrieve verified news content from IPFS by CID"""
    try:
        content = await decentralized_storage_service.retrieve_verified_news(cid)

        if content:
            return {
                "success": True,
                "content": content
            }
        else:
            raise HTTPException(status_code=404, detail="Content not found or inaccessible")

    except Exception as e:
        logger.error(f"Failed to retrieve content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")

@router.post("/verify-integrity/{cid}")
async def verify_content_integrity(cid: str, expected_hash: Optional[str] = None):
    """Verify the integrity of content stored on IPFS"""
    try:
        verification_result = await decentralized_storage_service.verify_content_integrity(
            cid,
            expected_hash
        )

        return {
            "cid": cid,
            "verification": verification_result
        }

    except Exception as e:
        logger.error(f"Integrity verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.get("/stats")
async def get_storage_stats():
    """Get statistics about decentralized storage usage"""
    try:
        stats = await decentralized_storage_service.get_storage_stats()

        return {
            "message": "Decentralized storage statistics",
            "stats": stats
        }

    except Exception as e:
        logger.error(f"Failed to get storage stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

@router.get("/search")
async def search_verified_content(query: str, limit: int = 10):
    """Search for verified content by CID or report ID"""
    try:
        results = await decentralized_storage_service.search_verified_content(query)

        return {
            "query": query,
            "results": results[:limit],
            "total_found": len(results)
        }

    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/content/{cid}/metadata")
async def get_content_metadata(cid: str):
    """Get metadata for content stored on IPFS without full retrieval"""
    try:
        # First verify the content exists and get basic info
        verification = await decentralized_storage_service.verify_content_integrity(cid)

        if verification.get('valid'):
            return {
                "cid": cid,
                "valid": True,
                "content_type": verification.get('content_type'),
                "verification_score": verification.get('verification_score'),
                "verified_at": verification.get('verified_at'),
                "ipfs_url": f"https://ipfs.io/ipfs/{cid}"
            }
        else:
            raise HTTPException(status_code=404, detail="Content not valid or not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Metadata retrieval failed: {str(e)}")

@router.get("/health")
async def decentralized_storage_health():
    """Check the health of decentralized storage services"""
    try:
        stats = await decentralized_storage_service.get_storage_stats()

        health_status = {
            "service": "decentralized_storage",
            "status": "healthy",
            "ipfs_connected": stats.get('ipfs_connected', False),
            "blockchain_connected": stats.get('blockchain_connected', False),
            "storage_health": stats.get('storage_health', 'unknown'),
            "total_stored_items": stats.get('total_stored_items', 0),
            "verified_items": stats.get('verified_items', 0)
        }

        # Determine overall health
        if not stats.get('ipfs_connected') or not stats.get('blockchain_connected'):
            health_status["status"] = "degraded"
        elif stats.get('storage_health') != 'healthy':
            health_status["status"] = "warning"

        return health_status

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "service": "decentralized_storage",
            "status": "unhealthy",
            "error": str(e)
        }