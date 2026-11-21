from datetime import datetime, timedelta, timezone
import re
from typing import Any, Dict, Optional

from passlib.context import CryptContext
from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    from jose import jwt

    settings = get_settings()
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=60 * 24)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    from jose import JWTError, jwt

    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


DANGEROUS_PATTERNS = [
    re.compile(r"(\b(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM)\b)", re.IGNORECASE),
    re.compile(r"(\.\./|\.\.\\)"),  # Path traversal
    re.compile(r"(;\s*rm\s+-rf|;\s*del\s+)", re.IGNORECASE),  # Destructive shell
]


def sanitize_input_query(query: str, max_len: int = 1000) -> str:
    """
    Sanitizes user input queries against SQL injection patterns, path traversal,
    and shell exploitation.
    """
    import re
    from app.core.exceptions import ValidationError

    if not query or not query.strip():
        raise ValidationError("Query string cannot be empty")

    cleaned = query.strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len]

    patterns = [
        re.compile(r"(\b(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM)\b)", re.IGNORECASE),
        re.compile(r"(\.\./|\.\.\\)"),
        re.compile(r"(;\s*rm\s+-rf|;\s*del\s+)", re.IGNORECASE),
    ]

    for pattern in patterns:
        if pattern.search(cleaned):
            raise ValidationError("Query contains forbidden security patterns")

    return cleaned
