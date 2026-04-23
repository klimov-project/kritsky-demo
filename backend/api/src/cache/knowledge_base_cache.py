from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any

try:
    from redis import Redis
    from redis.exceptions import RedisError
except Exception:
    Redis = None
    RedisError = Exception


from api.config import SETTINGS

REDIS_URL = SETTINGS.REDIS_URL
KB_CACHE_KEY = SETTINGS.KB_CACHE_KEY
REDIS_CONNECT_TIMEOUT_SECONDS = SETTINGS.REDIS_CONNECT_TIMEOUT_SECONDS
REDIS_IO_TIMEOUT_SECONDS = SETTINGS.REDIS_IO_TIMEOUT_SECONDS

_redis_client: Redis | None = None
_redis_retry_after_monotonic: float = 0.0


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed


def _parse_cached_state(raw_value: str | None) -> tuple[dict[str, Any] | None, datetime | None]:
    if not raw_value:
        return None, None

    try:
        cached_state = json.loads(raw_value)
    except (TypeError, json.JSONDecodeError):
        return None, None

    if not isinstance(cached_state, dict):
        return None, None

    payload = cached_state.get("payload")
    if not isinstance(payload, dict):
        return None, None

    updated_at = _parse_datetime(cached_state.get("updatedAt") if isinstance(cached_state.get("updatedAt"), str) else None)
    return payload, updated_at


def _format_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat()


def _drop_redis_client() -> None:
    global _redis_client, _redis_retry_after_monotonic
    _redis_client = None
    _redis_retry_after_monotonic = time.monotonic() + 5.0


def _get_redis_client() -> Redis | None:
    global _redis_client

    if Redis is None or not REDIS_URL:
        return None

    if _redis_client is not None:
        return _redis_client

    if time.monotonic() < _redis_retry_after_monotonic:
        return None

    try:
        client = Redis.from_url(
            REDIS_URL,
            socket_connect_timeout=REDIS_CONNECT_TIMEOUT_SECONDS,
            socket_timeout=REDIS_IO_TIMEOUT_SECONDS,
            decode_responses=True,
        )
        client.ping()
    except Exception:
        _drop_redis_client()
        return None

    _redis_client = client
    return _redis_client


def get_cached_knowledge_base_payload() -> tuple[dict[str, Any] | None, datetime | None]:
    client = _get_redis_client()
    if client is None:
        return None, None

    try:
        raw_value = client.get(KB_CACHE_KEY)
    except RedisError:
        _drop_redis_client()
        return None, None

    if not raw_value:
        return None, None

    return _parse_cached_state(raw_value)


def set_cached_knowledge_base_payload(payload: dict[str, Any], updated_at: datetime | None) -> None:
    client = _get_redis_client()
    if client is None:
        return

    state = {
        "updatedAt": _format_datetime(updated_at),
        "payload": payload,
    }

    try:
        client.set(KB_CACHE_KEY, json.dumps(state, ensure_ascii=False))
    except RedisError:
        _drop_redis_client()


def clear_cached_knowledge_base_payload() -> None:
    client = _get_redis_client()
    if client is None:
        return

    try:
        client.delete(KB_CACHE_KEY)
    except RedisError:
        _drop_redis_client()


def get_knowledge_base_cache_meta() -> dict[str, Any]:
    client = _get_redis_client()
    if client is None:
        return {
            "redisEnabled": False,
            "key": KB_CACHE_KEY,
            "exists": False,
            "sizeBytes": 0,
            "updatedAt": None,
        }

    try:
        raw_value = client.get(KB_CACHE_KEY)
    except RedisError:
        _drop_redis_client()
        return {
            "redisEnabled": False,
            "key": KB_CACHE_KEY,
            "exists": False,
            "sizeBytes": 0,
            "updatedAt": None,
        }

    if not raw_value:
        return {
            "redisEnabled": True,
            "key": KB_CACHE_KEY,
            "exists": False,
            "sizeBytes": 0,
            "updatedAt": None,
        }

    _, updated_at = _parse_cached_state(raw_value)
    return {
        "redisEnabled": True,
        "key": KB_CACHE_KEY,
        "exists": True,
        "sizeBytes": len(raw_value.encode("utf-8")),
        "updatedAt": updated_at,
    }
