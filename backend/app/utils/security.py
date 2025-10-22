# app/utils/security.py
import bcrypt
import asyncio

async def hash_password(password: str) -> str:
    """Hash password safely inside async app"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, lambda: bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    )

async def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hashed"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, lambda: bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    )
