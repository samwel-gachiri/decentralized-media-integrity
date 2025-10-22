"""
IPFS service for storing event photos and metadata using ipfshttpclient
"""

import ipfshttpclient
import json
import os
from typing import Optional, Dict, Any
import tempfile
import asyncio
import io
import logging

logger = logging.getLogger(__name__)

class IPFSService:
    def __init__(self, ipfs_api_url: str = "/ip4/127.0.0.1/tcp/5001/http"):
        self.api_url = ipfs_api_url
        self.client = None
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            self.client.close()
    
    def _get_client(self):
        """Get IPFS client, create if needed"""
        if not self.client:
            try:
                self.client = ipfshttpclient.connect(self.api_url)
            except Exception as e:
                logger.error(f"Failed to connect to IPFS: {e}")
                return None
        return self.client
    
    async def is_available(self) -> bool:
        """Check if IPFS node is available"""
        try:
            # Quick timeout check
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)  # 1 second timeout
            result = sock.connect_ex(('127.0.0.1', 5001))
            sock.close()
            
            if result != 0:
                return False
                
            client = self._get_client()
            if not client:
                return False
            # Try to get version info with timeout
            version = client.version()
            return bool(version)
        except Exception as e:
            logger.error(f"IPFS not available: {e}")
            return False
    
    async def add_file(self, file_content: bytes, filename: str) -> Optional[str]:
        """
        Add a file to IPFS and return the hash
        """
        try:
            # Quick availability check with timeout
            if not await self.is_available():
                logger.warning("IPFS node not available, falling back to local storage")
                return None
            
            client = self._get_client()
            if not client:
                return None
            
            # Create a file-like object from bytes
            file_obj = io.BytesIO(file_content)
            
            # Upload to IPFS with pinning and timeout
            import asyncio
            try:
                # Run IPFS operation with timeout
                result = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        None, lambda: client.add(file_obj, pin=True)
                    ), 
                    timeout=5.0  # 5 second timeout
                )
            except asyncio.TimeoutError:
                logger.warning("IPFS upload timed out")
                return None
            
            if isinstance(result, dict):
                ipfs_hash = result.get('Hash')
            elif isinstance(result, str):
                ipfs_hash = result
            else:
                # Handle list response (multiple files)
                ipfs_hash = result[-1]['Hash'] if result else None
            
            if ipfs_hash:
                logger.info(f"File uploaded to IPFS: {ipfs_hash}")
                return ipfs_hash
            else:
                logger.error("IPFS upload failed: No hash returned")
                return None
                
        except Exception as e:
            logger.error(f"IPFS upload error: {e}")
            return None
    
    async def add_json(self, data: Dict[Any, Any]) -> Optional[str]:
        """
        Add JSON data to IPFS and return the hash
        """
        try:
            json_content = json.dumps(data, indent=2).encode('utf-8')
            return await self.add_file(json_content, 'metadata.json')
        except Exception as e:
            print(f"❌ IPFS JSON upload error: {e}")
            return None
    
    async def get_file(self, ipfs_hash: str) -> Optional[bytes]:
        """
        Retrieve a file from IPFS by hash
        """
        try:
            if not await self.is_available():
                return None
            
            client = self._get_client()
            if not client:
                return None
            
            # Get file content from IPFS
            content = client.cat(ipfs_hash)
            
            if isinstance(content, bytes):
                return content
            elif hasattr(content, 'read'):
                return content.read()
            else:
                return bytes(content)
                
        except Exception as e:
            logger.error(f"IPFS retrieval error: {e}")
            return None
    
    async def get_json(self, ipfs_hash: str) -> Optional[Dict[Any, Any]]:
        """
        Retrieve JSON data from IPFS by hash
        """
        try:
            content = await self.get_file(ipfs_hash)
            if content:
                return json.loads(content.decode('utf-8'))
            return None
        except Exception as e:
            print(f"❌ IPFS JSON retrieval error: {e}")
            return None
    
    def get_gateway_url(self, ipfs_hash: str, gateway: str = "https://ipfs.io") -> str:
        """
        Get a gateway URL for accessing the file via HTTP
        """
        return f"{gateway}/ipfs/{ipfs_hash}"
    
    async def pin_file(self, ipfs_hash: str) -> bool:
        """
        Pin a file to ensure it stays available
        """
        try:
            if not await self.is_available():
                return False
            
            client = self._get_client()
            if not client:
                return False
            
            # Pin the file
            result = client.pin.add(ipfs_hash)
            return bool(result)
            
        except Exception as e:
            logger.error(f"IPFS pin error: {e}")
            return False

# Global IPFS service instance
ipfs_service = IPFSService()

async def upload_to_ipfs(file_content: bytes, filename: str) -> Optional[str]:
    """
    Convenience function to upload a file to IPFS
    """
    async with IPFSService() as service:
        return await service.add_file(file_content, filename)

async def upload_metadata_to_ipfs(metadata: Dict[Any, Any]) -> Optional[str]:
    """
    Convenience function to upload metadata to IPFS
    """
    async with IPFSService() as service:
        return await service.add_json(metadata)
