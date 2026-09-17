import hashlib
import os
import secrets
import uuid
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database import get_db
from app.models import Role, User, UserSession

SECRET_KEY = os.getenv("JWT_SECRET", "db3a5b6c8d7e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600
REFRESH_TOKEN_EXPIRE_DAYS = 7
PASSWORD_RESET_EXPIRE_MINUTES = 15
DEFAULT_ADMIN_PASSWORD = "passpass"
LAST_SEEN_UPDATE_SECONDS = 60


def organization_is_active(user: User) -> bool:
    if not user.organization_id:
        return True
    org = user.organization
    if org is None or org.deleted_at is not None:
        return False
    return bool(org.is_active)


def enforce_active_organization(user: User) -> None:
    if not organization_is_active(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization access has been disabled",
        )


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def reset_tokens_match(plain_token: str, stored_hash: Optional[str]) -> bool:
    if not stored_hash:
        return False
    return secrets.compare_digest(hash_password_reset_token(plain_token), stored_hash)


def decode_token(token: str, expected_type: Optional[str] = None) -> dict:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if expected_type and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected {expected_type} token")
    return payload


def new_session_id() -> str:
    return str(uuid.uuid4())


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client and request.client.host:
        return request.client.host[:64]
    return "unknown"


def parse_device_label(user_agent: Optional[str]) -> str:
    ua = user_agent or ""
    ua_l = ua.lower()

    if "iphone" in ua_l:
        device = "iPhone"
    elif "ipad" in ua_l:
        device = "iPad"
    elif "android" in ua_l:
        device = "Android"
    elif "mac os" in ua_l or "macintosh" in ua_l:
        device = "macOS"
    elif "windows" in ua_l:
        device = "Windows"
    elif "linux" in ua_l:
        device = "Linux"
    else:
        device = "Unknown device"

    if "edg/" in ua_l or "edg " in ua_l:
        browser = "Edge"
    elif "opr/" in ua_l or "opera" in ua_l:
        browser = "Opera"
    elif "chrome" in ua_l and "safari" in ua_l:
        browser = "Chrome"
    elif "firefox" in ua_l:
        browser = "Firefox"
    elif "safari" in ua_l:
        browser = "Safari"
    else:
        browser = "Browser"

    if device == "Unknown device":
        return browser
    return f"{browser} on {device}"


def get_request_meta(request: Request) -> tuple[Optional[str], str, str]:
    user_agent = (request.headers.get("user-agent") or "").strip()[:512] or None
    return user_agent, get_client_ip(request), parse_device_label(user_agent)


def _session_expiry(remember_me: bool) -> datetime:
    now = datetime.utcnow()
    if remember_me:
        return now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)


def issue_session_tokens(
    db: Session,
    user: User,
    request: Request,
    remember_me: bool,
    existing_session: Optional[UserSession] = None,
) -> dict:
    now = datetime.utcnow()
    user_agent, ip_address, device_label = get_request_meta(request)
    expires_at = _session_expiry(remember_me)

    if existing_session:
        existing_session.last_seen_at = now
        existing_session.expires_at = expires_at
        if user_agent:
            existing_session.user_agent = user_agent
            existing_session.device_label = device_label
        existing_session.ip_address = ip_address
        session = existing_session
    else:
        session = UserSession(
            user_id=user.id,
            jti=new_session_id(),
            user_agent=user_agent,
            ip_address=ip_address,
            device_label=device_label,
            last_seen_at=now,
            expires_at=expires_at,
        )
        db.add(session)

    db.commit()
    db.refresh(session)

    token_data = {"sub": user.email, "sid": session.jti}
    return {
        "access_token": create_access_token(data=token_data),
        "token_type": "bearer",
        "refresh_token": create_refresh_token(data=token_data) if remember_me else None,
        "remember_me": remember_me,
        "must_change_password": bool(user.must_change_password),
    }


def get_active_session(db: Session, sid: Optional[str], user_id: int) -> UserSession:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not sid:
        raise credentials_exception

    session = (
        db.query(UserSession)
        .filter(
            UserSession.jti == sid,
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
        )
        .first()
    )
    if not session or session.expires_at <= datetime.utcnow():
        raise credentials_exception
    return session


def touch_session(db: Session, session: UserSession) -> None:
    now = datetime.utcnow()
    last_seen = session.last_seen_at
    if last_seen and (now - last_seen).total_seconds() < LAST_SEEN_UPDATE_SECONDS:
        return
    session.last_seen_at = now
    db.commit()


def revoke_other_sessions(db: Session, user_id: int, current_session_id: int) -> int:
    now = datetime.utcnow()
    revoked = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.id != current_session_id,
            UserSession.revoked_at.is_(None),
        )
        .update(
            {UserSession.revoked_at: now, UserSession.updated_at: now},
            synchronize_session=False,
        )
    )
    db.commit()
    return int(revoked)


def revoke_session(db: Session, session: UserSession) -> None:
    session.revoked_at = datetime.utcnow()
    db.commit()


def list_active_sessions(db: Session, user_id: int) -> list[UserSession]:
    now = datetime.utcnow()
    return (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )
        .order_by(UserSession.last_seen_at.desc())
        .all()
    )


def get_token_payload(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token, expected_type="access")
    except jwt.PyJWTError:
        raise credentials_exception
    if not payload.get("sub"):
        raise credentials_exception
    return payload


def get_current_user(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = (
        db.query(User)
        .options(joinedload(User.role_relation).selectinload(Role.permissions))
        .filter(User.email == payload["sub"])
        .first()
    )
    if user is None:
        raise credentials_exception

    if not user.is_active or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled",
        )

    enforce_active_organization(user)
    session = get_active_session(db, payload.get("sid"), user.id)
    touch_session(db, session)
    if user.organization_id:
        from app.permissions import ensure_organization_role_permissions

        ensure_organization_role_permissions(db, user.organization_id)
    return user


def get_current_session(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserSession:
    return get_active_session(db, payload.get("sid"), current_user.id)
