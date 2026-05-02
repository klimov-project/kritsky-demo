from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from api.src.auth.schemas import PublicUser
from api.src.auth.utils import AuthenticatedUser, get_current_user, _to_public_user
from db.src.connect import ainit_session
from db.src.models import Subscription, User

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


async def _get_subscription_expires_at(user_id: int) -> datetime | None:
    """Return the latest active subscription expiry date for the given user, or None."""
    async with ainit_session() as session:
        result = await session.execute(
            select(Subscription.dateOfExpire)
            .where(Subscription.userId == user_id, Subscription.dateOfExpire.isnot(None))
            .order_by(Subscription.dateOfExpire.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


@router.post("/activate-mock", response_model=PublicUser)
async def activate_mock_subscription(
    auth: AuthenticatedUser = Depends(get_current_user),
) -> PublicUser:
    """
    Mock endpoint: activates a Pro subscription for 30 days for the current user.
    For testing and demo purposes only.
    """
    now = datetime.now(timezone.utc)
    new_expire = now + timedelta(days=30)

    async with ainit_session() as session:
        user = await session.get(User, auth.user.id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.isPro = True
        session.add(Subscription(userId=user.id, dateOfExpire=new_expire))
        await session.commit()
        await session.refresh(user)

        public_user = _to_public_user(user)
        public_user.subscriptionExpiresAt = new_expire
        return public_user


@router.post("/reset-mock", response_model=PublicUser)
async def reset_mock_subscription(
    auth: AuthenticatedUser = Depends(get_current_user),
) -> PublicUser:
    """
    Mock endpoint: deactivates the Pro subscription for the current user.
    For testing and demo purposes only.
    """
    now = datetime.now(timezone.utc)

    async with ainit_session() as session:
        user = await session.get(User, auth.user.id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.isPro = False

        # Expire all active subscriptions
        subs_result = await session.execute(
            select(Subscription).where(Subscription.userId == user.id)
        )
        for sub in subs_result.scalars().all():
            if sub.dateOfExpire and sub.dateOfExpire > now:
                sub.dateOfExpire = now

        await session.commit()
        await session.refresh(user)

        public_user = _to_public_user(user)
        public_user.subscriptionExpiresAt = None
        return public_user
