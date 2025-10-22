"""
Updated Authentication routes for News Integrity
Combines JWT token system with simplified database approach
"""

from fastapi import APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
import aiosqlite
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets

from app.database.database import get_db
from app.utils.security import hash_password, verify_password

router = APIRouter(
    tags=["auth"]
)
security = HTTPBearer()

# Simple Token Configuration
SECRET_KEY = "climate_witness_chain_secret_key_change_in_production"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Pydantic models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    firstName: Optional[str] = None  # Accept frontend format
    lastName: Optional[str] = None   # Accept frontend format
    role: str = 'user'  # 'user' or 'researcher'
    location_region: Optional[str] = None
    locationRegion: Optional[str] = None  # Accept frontend format
    
    def get_first_name(self) -> str:
        return self.first_name or self.firstName or ""
    
    def get_last_name(self) -> str:
        return self.last_name or self.lastName or ""
    
    def get_location_region(self) -> Optional[str]:
        return self.location_region or self.locationRegion

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    location_region: Optional[str] = None
    profile_image: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create simple access token"""
    user_id = data.get("sub")
    if not user_id:
        return None
    
    # Create a simple token with user_id and timestamp
    timestamp = datetime.utcnow().timestamp()
    token_data = f"{user_id}:{timestamp}:access"
    
    # Create a hash for security
    token_hash = hashlib.sha256(f"{token_data}:{SECRET_KEY}".encode()).hexdigest()
    return f"access_{user_id}_{int(timestamp)}_{token_hash[:16]}"

def create_refresh_token(data: dict):
    """Create simple refresh token"""
    user_id = data.get("sub")
    if not user_id:
        return None
    
    # Create a simple token with user_id and timestamp
    timestamp = datetime.utcnow().timestamp()
    token_data = f"{user_id}:{timestamp}:refresh"
    
    # Create a hash for security
    token_hash = hashlib.sha256(f"{token_data}:{SECRET_KEY}".encode()).hexdigest()
    return f"refresh_{user_id}_{int(timestamp)}_{token_hash[:16]}"

def verify_token(token: str, token_type: str = "access"):
    """Verify simple token"""
    try:
        if not token.startswith(f"{token_type}_"):
            return None
        
        # Parse token: type_userid_timestamp_hash
        parts = token.split("_")
        if len(parts) != 4:
            return None
        
        token_prefix, user_id, timestamp_str, token_hash = parts
        timestamp = int(timestamp_str)
        
        # Verify hash
        token_data = f"{user_id}:{timestamp}:{token_type}"
        expected_hash = hashlib.sha256(f"{token_data}:{SECRET_KEY}".encode()).hexdigest()[:16]
        
        if token_hash != expected_hash:
            return None
        
        # Check expiration
        token_time = datetime.fromtimestamp(timestamp)
        now = datetime.utcnow()
        
        if token_type == "access":
            if now - token_time > timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES):
                return None
        elif token_type == "refresh":
            if now - token_time > timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS):
                return None
        
        return {"sub": user_id, "type": token_type}
        
    except (ValueError, IndexError):
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
        user = await cursor.fetchone()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    return user

def user_to_dict(user) -> dict:
    """Convert user row to dictionary"""
    return {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"] if "role" in user.keys() else "user",
        "wallet_address": user["wallet_address"] if "wallet_address" in user.keys() else None,
        "trust_score": user["trust_score"] if "trust_score" in user.keys() else 50,
        "location_region": user["location_region"] if "location_region" in user.keys() else None,
        "profile_image": user["profile_image"] if "profile_image" in user.keys() else None,
        "created_at": user["created_at"] if "created_at" in user.keys() else None,
        "last_login_at": user["last_login_at"] if "last_login_at" in user.keys() else None
    }

# Routes
@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegister,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Register a new user with JWT tokens"""
    try:
        # Check if user already exists
        async with db.execute("SELECT * FROM users WHERE email = ?", (user_data.email,)) as cursor:
            existing_user = await cursor.fetchone()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Hash password
        hashed_pw = await hash_password(user_data.password)
        user_id = str(uuid.uuid4())
        
        # Insert user into database with all fields
        await db.execute(
            """INSERT INTO users 
               (id, email, password_hash, first_name, last_name, role, location_region, trust_score, created_at, last_login_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                user_data.email,
                hashed_pw,
                user_data.get_first_name(),
                user_data.get_last_name(),
                user_data.role,
                user_data.get_location_region(),
                50,  # Default trust score
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ),
        )
        await db.commit()
        
        # Get the created user
        async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
            user = await cursor.fetchone()
        
        # Create tokens
        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_to_dict(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(
    user_data: UserLogin,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Login user with JWT tokens"""
    try:
        # Get user by email
        async with db.execute("SELECT * FROM users WHERE email = ?", (user_data.email,)) as cursor:
            user = await cursor.fetchone()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
        
        # Verify password
        valid = await verify_password(user_data.password, user["password_hash"])
        if not valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Update last login
        await db.execute(
            "UPDATE users SET last_login_at = ? WHERE id = ?",
            (datetime.now().isoformat(), user["id"])
        )
        await db.commit()
        
        # Create tokens
        access_token = create_access_token(data={"sub": user["id"]})
        refresh_token = create_refresh_token(data={"sub": user["id"]})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_to_dict(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Refresh access token"""
    try:
        payload = verify_token(token_data.refresh_token, "refresh")
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
            user = await cursor.fetchone()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
        
        # Create new tokens
        access_token = create_access_token(data={"sub": user["id"]})
        refresh_token = create_refresh_token(data={"sub": user["id"]})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_to_dict(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )

@router.get("/me")
async def get_current_user_info(
    authorization: str = Header(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get current user information"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
        user = await cursor.fetchone()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    return {"user": user_to_dict(user)}

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify backend is working"""
    return {"message": "Backend is working", "timestamp": datetime.now().isoformat()}

@router.put("/profile")
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Update user profile"""
    try:
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if profile_data.first_name is not None:
            update_fields.append("first_name = ?")
            update_values.append(profile_data.first_name)
        if profile_data.last_name is not None:
            update_fields.append("last_name = ?")
            update_values.append(profile_data.last_name)
        if profile_data.location_region is not None:
            update_fields.append("location_region = ?")
            update_values.append(profile_data.location_region)
        if profile_data.profile_image is not None:
            update_fields.append("profile_image = ?")
            update_values.append(profile_data.profile_image)
        
        if not update_fields:
            return {"user": user_to_dict(current_user)}
        
        # Add user ID to values
        update_values.append(current_user["id"])
        
        # Execute update
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        await db.execute(query, update_values)
        await db.commit()
        
        # Get updated user
        async with db.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],)) as cursor:
            updated_user = await cursor.fetchone()
        
        return {"user": user_to_dict(updated_user)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@router.put("/password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Change user password"""
    try:
        # Verify current password
        valid = await verify_password(password_data.current_password, current_user["password_hash"])
        if not valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = await hash_password(password_data.new_password)
        
        # Update password
        await db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (new_password_hash, current_user["id"])
        )
        await db.commit()
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )

@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """Logout user (client should remove tokens)"""
    return {"message": "Logged out successfully"}