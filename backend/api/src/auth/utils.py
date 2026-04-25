from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.src.connect import ainit_session
from db.src.models import User
from .schemas import PublicUser

from api.config import SETTINGS

bearer_scheme = HTTPBearer(auto_error=False)

JWT_SECRET = SETTINGS.JWT_SECRET
JWT_ALGORITHM = SETTINGS.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = SETTINGS.JWT_ACCESS_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = SETTINGS.JWT_REFRESH_EXPIRE_DAYS

ADMIN_EMAILS = {email.strip().lower() for email in SETTINGS.ADMIN_EMAILS.split(",") if email.strip()}
ADMIN_LOGIN = SETTINGS.ADMIN_LOGIN
ADMIN_PASSWORD = SETTINGS.ADMIN_PASSWORD


class TokenError(HTTPException):
    def __init__(self, detail: str = "Invalid token") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


@dataclass
class TokenPrincipal:
    sub: str
    role: str
    token_type: str


@dataclass
class AuthenticatedUser:
    user: User
    principal: TokenPrincipal


@dataclass
class AuthenticatedAdmin:
    principal: TokenPrincipal


def _create_token(*, sub: str, role: str, token_type: str, ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_access_token(sub: str, role: str) -> str:
    return _create_token(
        sub=sub,
        role=role,
        token_type="access",
        ttl=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(sub: str, role: str) -> str:
    return _create_token(
        sub=sub,
        role=role,
        token_type="refresh",
        ttl=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, *, expected_type: str | None = None) -> TokenPrincipal:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError as error:
        raise TokenError("Invalid token") from error

    sub = payload.get("sub")
    role = payload.get("role")
    token_type = payload.get("type")

    if not isinstance(sub, str) or not isinstance(role, str) or not isinstance(token_type, str):
        raise TokenError("Malformed token payload")

    if expected_type is not None and token_type != expected_type:
        raise TokenError("Invalid token type")

    return TokenPrincipal(sub=sub, role=role, token_type=token_type)


def is_admin_email(email: str | None) -> bool:
    if not email:
        return False
    return email.lower() in ADMIN_EMAILS


async def _token_from_credentials(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise TokenError("Authorization token is required")
    return credentials.credentials


async def get_access_principal(token: str = Depends(_token_from_credentials)) -> TokenPrincipal:
    return decode_token(token, expected_type="access")


async def get_refresh_principal(token: str = Depends(_token_from_credentials)) -> TokenPrincipal:
    return decode_token(token, expected_type="refresh")


async def get_current_user(principal: TokenPrincipal = Depends(get_access_principal)) -> AuthenticatedUser:
    if principal.role != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role required")

    try:
        user_id = int(principal.sub)
    except ValueError as error:
        raise TokenError("Invalid subject") from error

    async with ainit_session() as session:
        user = await session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        if getattr(user, "is_blocked", False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ваш аккаунт заблокирован")
        return AuthenticatedUser(user=user, principal=principal)


async def get_current_admin(principal: TokenPrincipal = Depends(get_access_principal)) -> AuthenticatedAdmin:
    if principal.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return AuthenticatedAdmin(principal=principal)


def build_auth_response(*, sub: str, role: str, user: dict[str, Any]) -> dict[str, Any]:
    access_token = create_access_token(sub, role)
    refresh_token = create_refresh_token(sub, role)
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "tokenType": "Bearer",
        "expiresIn": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user,
    }


async def get_user_by_email(email: str, session: AsyncSession) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


def _to_public_user(user: User) -> PublicUser:
    is_admin = is_admin_email(user.email)
    return PublicUser(
        id=user.id,
        email=user.email or "",
        name=user.name,
        phone=user.phone,
        role="admin" if is_admin else "user",
        isPro=user.isPro,
        isAdmin=is_admin,
        isBlocked=getattr(user, "is_blocked", False),
        paidDownloadCredits=user.paid_download_credits or 0,
    )


def _admin_stub_user() -> PublicUser:
    return PublicUser(
        id=0,
        email="admin@kritsky.local",
        name="Administrator",
        role="admin",
        isAdmin=True,
    )
