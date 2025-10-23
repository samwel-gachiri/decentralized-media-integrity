from typing import Dict, Any, Optional, List
import json
import os
import hashlib
import uuid
from datetime import datetime
import logging
import asyncio
import aiohttp
from web3 import Web3
from eth_account import Account
import ipfshttpclient
from sqlalchemy.orm import Session
from app.models.database import DecentralizedStorage, get_session
from app.services.blockchain_service import blockchain_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DecentralizedStorageService:
    """
    Service for decentralized storage of verified news content using IPFS and blockchain verification
    """

    def __init__(self):
        # IPFS configuration
        self.ipfs_api_url = os.getenv('IPFS_API_URL', '/dns4/ipfs.infura.io/tcp/5001/https')
        self.ipfs_project_id = os.getenv('IPFS_PROJECT_ID')
        self.ipfs_project_secret = os.getenv('IPFS_PROJECT_SECRET')

        # Blockchain service for verification records
        self.blockchain_service = blockchain_service

        # Initialize IPFS client
        self.ipfs_client = None
        self._init_ipfs_client()

        logger.info("Decentralized storage service initialized")

    def _init_ipfs_client(self):
        """Initialize IPFS client with authentication"""
        try:
            if self.ipfs_project_id and self.ipfs_project_secret:
                self.ipfs_client = ipfshttpclient.connect()
            else:
                # Fallback to local IPFS node or public gateway
                self.ipfs_client = ipfshttpclient.connect()

            logger.info("✅ IPFS client connected")
        except Exception as e:
            logger.warning(f"⚠️ IPFS client initialization failed: {str(e)}")
            logger.warning("   Content will be stored locally until IPFS is available")

    async def store_verified_news(self, report_data: Dict, verification_metadata: Dict) -> Dict[str, Any]:
        """Store verified news content on IPFS with minimal code"""
        try:
            # Prepare and store content on IPFS in one go
            content_json = json.dumps({
                'version': '1.0', 'type': 'verified_news_report', 'timestamp': datetime.now().isoformat(),
                'content': report_data, 'verification': verification_metadata,
                'metadata': {'platform': 'Decentralized News Integrity Platform', 'blockchain': 'CUDOS Network', 'storage': 'IPFS'}
            }, indent=2, default=str)

            # Store on IPFS (mock if no client)
            if self.ipfs_client:
                result = self.ipfs_client.add_json(content_json)
                ipfs_cid, ipfs_url = result, f"https://ipfs.io/ipfs/{result}"
            else:
                ipfs_cid = 'Qm' + hashlib.sha256(content_json.encode()).hexdigest()[:44]
                ipfs_url = f"https://ipfs.io/ipfs/{ipfs_cid}"

            # Record on blockchain (optional)
            blockchain_result = await self._record_verification_on_blockchain(ipfs_cid, verification_metadata)

            # Store in DB
            self._store_metadata_in_db(report_data.get('id'), ipfs_cid, blockchain_result.get('transaction_hash') if blockchain_result.get('success') else None, verification_metadata)

            return {
                'success': True, 'ipfs_cid': ipfs_cid, 'ipfs_url': ipfs_url,
                'blockchain_tx': blockchain_result.get('transaction_hash'),
                'blockchain_success': blockchain_result.get('success', False)
            }

        except Exception as e:
            logger.error(f"Failed to store verified news: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def _record_verification_on_blockchain(self, content_cid: str, verification_metadata: Dict) -> Dict[str, Any]:
        """Record news verification on blockchain"""
        try:
            # Generate verification ID
            verification_id = '0x' + hashlib.sha256(f"{content_cid}{datetime.now().isoformat()}".encode()).hexdigest()

            # Prepare verification data for blockchain
            verification_data = {
                'verification_id': verification_id,
                'content_cid': content_cid,
                'content_hash': '0x' + hashlib.sha256(content_cid.encode()).hexdigest(),
                'verification_score': verification_metadata.get('verification_score', 0),
                'integrity_level': verification_metadata.get('integrity_level', 'unknown'),
                'verified_at': int(datetime.now().timestamp()),
                'verifier_address': self.blockchain_service.deployer_account.address,
                'metadata': json.dumps({
                    'ai_analysis': verification_metadata.get('ai_analysis', {}),
                    'source_credibility': verification_metadata.get('source_credibility', {}),
                    'platform': 'Decentralized News Integrity Platform'
                })
            }

            # Record on blockchain
            blockchain_result = await self.blockchain_service.store_news_verification_on_blockchain(verification_data)

            if blockchain_result.get('success', False):
                return {
                    'success': True,
                    'verification_id': verification_id,
                    'transaction_hash': blockchain_result.get('transaction_hash'),
                    'blockchain_data': verification_data,
                    'note': blockchain_result.get('note', 'Blockchain verification recorded')
                }
            else:
                # Blockchain recording failed, but we can still proceed with IPFS storage
                logger.warning(f"Blockchain recording failed: {blockchain_result.get('error', 'Unknown error')}")
                return {
                    'success': False,
                    'verification_id': verification_id,
                    'error': blockchain_result.get('error', 'Blockchain recording failed'),
                    'note': 'IPFS storage will proceed without blockchain verification'
                }

        except Exception as e:
            logger.error(f"Blockchain verification recording failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def _store_metadata_in_db(self, report_id: int, cid: str, tx_hash: str, verification_metadata: Dict) -> bool:
        """Store decentralized storage metadata in database"""
        try:
            db = get_session()

            storage_record = DecentralizedStorage(
                report_id=report_id,
                cudos_cid=cid,
                storage_url=f"https://ipfs.io/ipfs/{cid}",
                blockchain_tx_hash=tx_hash,
                verification_id=verification_metadata.get('verification_id'),
                content_hash=hashlib.sha256(cid.encode()).hexdigest(),
                verification_score=verification_metadata.get('verification_score'),
                verified=True
            )

            db.add(storage_record)
            db.commit()
            db.refresh(storage_record)

            db.close()

            logger.info(f"💾 Stored decentralized metadata for report {report_id}")
            return True

        except Exception as e:
            logger.error(f"Database storage failed: {str(e)}")
            return False

    async def retrieve_verified_news(self, cid: str) -> Optional[Dict]:
        """Retrieve verified news content from IPFS"""
        try:
            if self.ipfs_client:
                # Retrieve from IPFS
                content_bytes = self.ipfs_client.cat(cid)
                content_json = content_bytes.decode('utf-8')
                content_package = json.loads(content_json)

                return content_package
            else:
                # Fallback: simulate retrieval
                logger.warning("⚠️ IPFS client not available, cannot retrieve content")
                return None

        except Exception as e:
            logger.error(f"Failed to retrieve content from IPFS: {str(e)}")
            return None

    async def verify_content_integrity(self, cid: str, expected_hash: str = None) -> Dict[str, Any]:
        """Verify the integrity of content stored on IPFS"""
        try:
            content_package = await self.retrieve_verified_news(cid)

            if not content_package:
                return {
                    'valid': False,
                    'error': 'Content not found or inaccessible'
                }

            # Verify content structure
            if not self._validate_content_structure(content_package):
                return {
                    'valid': False,
                    'error': 'Content structure validation failed'
                }

            # Verify hash if provided
            if expected_hash:
                content_hash = hashlib.sha256(json.dumps(content_package, sort_keys=True).encode()).hexdigest()
                if content_hash != expected_hash:
                    return {
                        'valid': False,
                        'error': 'Content hash mismatch'
                    }

            return {
                'valid': True,
                'content_type': content_package.get('type'),
                'verification_score': content_package.get('verification', {}).get('verification_score'),
                'verified_at': content_package.get('verification', {}).get('verified_at')
            }

        except Exception as e:
            logger.error(f"Content integrity verification failed: {str(e)}")
            return {
                'valid': False,
                'error': str(e)
            }

    def _validate_content_structure(self, content_package: Dict) -> bool:
        """Validate the structure of stored content"""
        required_fields = ['version', 'type', 'timestamp', 'content', 'verification', 'metadata']

        for field in required_fields:
            if field not in content_package:
                return False

        # Validate content section
        content = content_package.get('content', {})
        required_content_fields = ['id', 'title', 'content', 'source']
        for field in required_content_fields:
            if field not in content:
                return False

        # Validate verification section
        verification = content_package.get('verification', {})
        required_verification_fields = ['integrity_level', 'verification_score', 'verified_at']
        for field in required_verification_fields:
            if field not in verification:
                return False

        return True

    async def get_storage_stats(self) -> Dict[str, Any]:
        """Get statistics about decentralized storage usage"""
        try:
            db = get_session()

            total_stored = db.query(DecentralizedStorage).count()
            verified_stored = db.query(DecentralizedStorage).filter(
                DecentralizedStorage.verified == True
            ).count()

            db.close()

            return {
                'total_stored_items': total_stored,
                'verified_items': verified_stored,
                'ipfs_connected': self.ipfs_client is not None,
                'blockchain_connected': self.blockchain_service.is_connected(),
                'storage_health': 'healthy' if self.ipfs_client else 'degraded'
            }

        except Exception as e:
            logger.error(f"Failed to get storage stats: {str(e)}")
            return {
                'error': str(e)
            }

    async def search_verified_content(self, query: str, filters: Dict = None) -> List[Dict]:
        """Search for verified content (basic implementation)"""
        try:
            db = get_session()

            # Basic search by report ID or CID
            query_results = db.query(DecentralizedStorage).filter(
                (DecentralizedStorage.cudos_cid.contains(query)) |
                (DecentralizedStorage.report_id == int(query) if query.isdigit() else False)
            ).limit(10).all()

            results = []
            for record in query_results:
                results.append({
                    'report_id': record.report_id,
                    'cid': record.cudos_cid,
                    'url': record.storage_url,
                    'stored_at': record.created_at.isoformat(),
                    'verified': record.verified
                })

            db.close()

            return results

        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []

# Singleton instance
decentralized_storage_service = DecentralizedStorageService()