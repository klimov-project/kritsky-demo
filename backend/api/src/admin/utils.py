from __future__ import annotations

from datetime import datetime

from db.src.models import User


def _status_from_subscription(expiration: datetime | None, now: datetime) -> str:
    if expiration is None:
        return "None"
    if expiration.tzinfo is None and now.tzinfo is not None:
        return "Active" if expiration >= now.replace(tzinfo=None) else "Expired"
    return "Active" if expiration >= now else "Expired"


def _normalize_payment_status(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"success", "paid", "succeeded"}:
        return "Success"
    if normalized in {"pending", "processing", "new"}:
        return "Pending"
    return "Failed"


def _normalize_order_status(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"paid", "success"}:
        return "Paid"
    if normalized in {"delivered", "done", "completed"}:
        return "Delivered"
    if normalized in {"cancelled", "canceled", "failed"}:
        return "Cancelled"
    return "New"


def _display_user_name(user: User | None, user_id: int) -> str:
    if user is None:
        return f"Пользователь #{user_id}"
    if user.name and user.name.strip():
        return user.name.strip()
    if user.email and user.email.strip():
        return user.email.strip()
    return f"Пользователь #{user.id}"


def _extract_created_at(entity: object) -> datetime | None:
    created_at = getattr(entity, "createdAt", None)
    if isinstance(created_at, datetime):
        return created_at

    fallback_created_at = getattr(entity, "created_at", None)
    return fallback_created_at if isinstance(fallback_created_at, datetime) else None


def _format_created_at(entity: object, fmt: str) -> str:
    created_at = _extract_created_at(entity)
    return created_at.strftime(fmt) if created_at else ""
