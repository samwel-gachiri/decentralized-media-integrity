import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple

from jose import JWTError, jwt
from passlib.context import CryptContext


from app.database.models import AuthUser
from app.database import crud


class AuthService:
    """Handles user registration, authentication, and JWT issuing"""

    def __init__(self, db_path: str = "./news_integrity.db"):
    # self.crud = None
        self._pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        self._secret_key = os.environ.get("JWT_SECRET", "dev-secret-change-me")
        self._refresh_secret_key = os.environ.get("JWT_REFRESH_SECRET", "dev-refresh-secret")
        self._algorithm = "HS256"
        self._access_minutes = int(os.environ.get("JWT_ACCESS_MINUTES", "30"))
        self._refresh_days = int(os.environ.get("JWT_REFRESH_DAYS", "7"))

    # Password hashing
    def hash_password(self, password: str) -> str:
        return self._pwd_context.hash(password)

    def verify_password(self, plain_password: str, password_hash: str) -> bool:
        return self._pwd_context.verify(plain_password, password_hash)

    # JWT helpers
    def _create_token(self, subject: str, expires_delta: timedelta, is_refresh: bool = False) -> str:
        now = datetime.utcnow()
        payload = {
            "sub": subject,
            "iat": int(now.timestamp()),
            "exp": int((now + expires_delta).timestamp()),
            "type": "refresh" if is_refresh else "access",
        }
        key = self._refresh_secret_key if is_refresh else self._secret_key
        return jwt.encode(payload, key, algorithm=self._algorithm)

    def create_access_token(self, user_id: str) -> str:
        return self._create_token(user_id, timedelta(minutes=self._access_minutes), is_refresh=False)

    def create_refresh_token(self, user_id: str) -> str:
        return self._create_token(user_id, timedelta(days=self._refresh_days), is_refresh=True)

    def verify_access_token(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
            if payload.get("type") != "access":
                return None
            return payload.get("sub")
        except JWTError:
            return None

    def verify_refresh_token(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, self._refresh_secret_key, algorithms=[self._algorithm])
            if payload.get("type") != "refresh":
                return None
            return payload.get("sub")
        except JWTError:
            return None

    # Core flows
    async def register(self, email: str, password: str, wallet_address: Optional[str] = None) -> Optional[AuthUser]:
        existing = await crud.get_auth_user_by_email(email)
        if existing:
            return None
        user = AuthUser(
            id=f"auth-{uuid.uuid4().hex[:12]}",
            email=email,
            password_hash=self.hash_password(password),
            wallet_address=wallet_address,
            role="user",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        ok = await crud.create_auth_user(user)
        return user if ok else None

    async def authenticate(self, email: str, password: str) -> Optional[AuthUser]:
        user = await crud.get_auth_user_by_email(email)
        if not user or not user.is_active:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user

    async def issue_tokens(self, user_id: str) -> Tuple[str, str]:
        return self.create_access_token(user_id), self.create_refresh_token(user_id)


