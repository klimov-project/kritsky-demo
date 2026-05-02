from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from sqlalchemy import select

from api.src.auth.utils import AuthenticatedUser, get_current_user
from db.src.connect import ainit_session
from db.src.models import Subscription


async def require_active_subscription(
    auth: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    FastAPI dependency: ensures the current user has an active Pro subscription.

    Checks:
    1. User is authenticated (handled by get_current_user).
    2. user.isPro is True.
    3. The latest subscription has dateOfExpire > now().

    Raises HTTP 403 if any condition fails.
    """
    user = auth.user

    if not user.isPro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required. Please activate your subscription.",
        )

    now = datetime.now(timezone.utc)
    async with ainit_session() as session:
        result = await session.execute(
            select(Subscription.dateOfExpire)
            .where(
                Subscription.userId == user.id,
                Subscription.dateOfExpire.isnot(None),
                Subscription.dateOfExpire > now,
            )
            .order_by(Subscription.dateOfExpire.desc())
            .limit(1)
        )
        expires_at = result.scalar_one_or_none()

    if expires_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required. Please activate your subscription.",
        )

    return auth
