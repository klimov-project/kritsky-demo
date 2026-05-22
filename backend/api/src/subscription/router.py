from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from api.src.auth.schemas import PublicUser
from api.src.auth.utils import AuthenticatedUser, get_current_user, _to_public_user
from db.src.connect import ainit_session
from db.src.models import Subscription, User, Payment
from core.src.repos.payments import DbPaymentsRepo

logger = logging.getLogger(__name__)

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
    Mock endpoint: activates a Pro subscription for 1 or 6 months based on the latest succeeded payment.
    Determines subscription duration by payment amount:
    - 890.00 (±1) or 890.* → 1 month
    - 4144.00 (±1) or 4144.* → 6 months
    For testing and demo purposes only.
    """
    now = datetime.now(timezone.utc)

    async with ainit_session() as session:
        user = await session.get(User, auth.user.id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # 1. Check if user already has an active subscription
        active_sub_result = await session.execute(
            select(Subscription).where(
                (Subscription.userId == user.id) &
                (Subscription.dateOfExpire > now)
            ).order_by(Subscription.dateOfExpire.desc()).limit(1)
        )
        active_sub = active_sub_result.scalar_one_or_none()
        if active_sub:
            logger.info(
                "activate_mock_subscription: user %d already has active subscription expires at %s",
                user.id,
                active_sub.dateOfExpire,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription",
            )

        # 2. Get all succeeded payments for this user, sorted by id desc (most recent first)
        payment_result = await session.execute(
            select(Payment)
            .where(
                (Payment.userId == user.id) &
                (Payment.paymentStatus == "succeeded")
            )
            .order_by(Payment.id.desc())
            .limit(1)
        )
        latest_payment = payment_result.scalar_one_or_none()

        if not latest_payment:
            logger.info("activate_mock_subscription: user %d has no succeeded payments", user.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No succeeded payments found",
            )

        # 3. Determine subscription duration based on payment amount
        amount = latest_payment.amount
        logger.info(
            "activate_mock_subscription: user %d latest payment amount=%s status=%s",
            user.id,
            amount,
            latest_payment.paymentStatus,
        )

        # Amount is Decimal, convert to float for range checks
        amount_float = float(amount)
        amount_str = str(amount)

        # Check for 6-month subscription: 4144.* or >= 4144
        is_6_months = (
            amount_str.startswith("4144.") or
            amount_float >= 4144.0
        )

        # Check for 1-month subscription: 890.* or in range [889, 891]
        is_1_month = (
            amount_str.startswith("890.") or
            (889 < amount_float < 891)
        )

        if is_6_months:
            months = 6
            logger.info("activate_mock_subscription: determined 6-month subscription for user %d", user.id)
        elif is_1_month:
            months = 1
            logger.info("activate_mock_subscription: determined 1-month subscription for user %d", user.id)
        else:
            logger.warning(
                "activate_mock_subscription: payment amount %s for user %d does not match any subscription tier",
                amount,
                user.id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount {amount} does not match any subscription tier",
            )

        # 4. Calculate expiry date: next day after payment + N months
        payment_date = latest_payment.createdAt or now
        next_day_after_payment = payment_date.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        # Add months by calculating new date
        if months == 1:
            new_expire = next_day_after_payment + timedelta(days=30)
        else:  # 6 months
            # Approximate 6 months as 182 days (accounting for variable month lengths)
            new_expire = next_day_after_payment + timedelta(days=182)

        logger.info(
            "activate_mock_subscription: setting subscription for user %d to expire at %s (%d month)",
            user.id,
            new_expire,
            months,
        )

        # 5. Activate subscription
        user.isPro = True
        new_subscription = Subscription(
            userId=user.id,
            dateOfExpire=new_expire,
            paymentId=latest_payment.id,
        )
        session.add(new_subscription)
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
