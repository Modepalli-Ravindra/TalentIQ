from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import jwt
import hashlib
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    salted_hash = hashlib.sha256((plain_password + settings.JWT_SECRET).encode('utf-8')).hexdigest()
    return salted_hash == hashed_password


def get_password_hash(password: str) -> str:
    return hashlib.sha256((password + settings.JWT_SECRET).encode('utf-8')).hexdigest()


def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "iss": "TalentIQ-AI-Auth",
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return {}
