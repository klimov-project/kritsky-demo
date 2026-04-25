from __future__ import annotations

import time
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import func, select

from api.config import SETTINGS
from db.src.connect import init_session
from db.src.models import KnowledgeBaseState, SavedVariant, Subscription, User
from api.src.cache.knowledge_base_cache import (
    get_cached_knowledge_base_payload,
    set_cached_knowledge_base_payload,
)
from api.src.knowledge_base.utils import _get_or_create_state, _normalize_payload
from api.src.variants.randomizer import generate_variant_runtime

from .schemas import ExportQuotaResponse, SavedVariantResponse


KB_CACHE_DB_SYNC_INTERVAL_SECONDS = max(0.0, SETTINGS.KB_CACHE_DB_SYNC_INTERVAL_SECONDS)
_next_kb_cache_db_sync_monotonic = 0.0
_in_memory_kb_payload: dict[str, Any] | None = None
_in_memory_kb_updated_at: datetime | None = None

_cached_pregenerated_variant: dict[str, Any] | None = None
_cached_pregenerated_variant_at: datetime | None = None



def _to_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _db_state_is_newer(db_updated_at: datetime | None, cached_updated_at: datetime | None) -> bool:
    db_utc = _to_utc(db_updated_at)
    cached_utc = _to_utc(cached_updated_at)

    if db_utc is None:
        return False
    if cached_utc is None:
        return True

    return db_utc > cached_utc


def _timestamps_equal(left: datetime | None, right: datetime | None) -> bool:
    left_utc = _to_utc(left)
    right_utc = _to_utc(right)
    return left_utc == right_utc


def _generate_pregenerated_variant() -> dict[str, Any]:
    global _cached_pregenerated_variant, _cached_pregenerated_variant_at
    kb_payload = _load_knowledge_base_payload()
    works = [w for w in (kb_payload.get("works") or []) if isinstance(w, dict)]
    poets = [p for p in (kb_payload.get("poets") or []) if isinstance(p, dict)]
    first_work_id = str((works[0].get("id") or "")) if works else ""
    first_poet_id = str((poets[0].get("id") or "")) if poets else ""
    payload = {
        "useSelected": True,
        "selectedWorkId": first_work_id,
        "selectedExcerptId": "",
        "selectedPoetId": first_poet_id,
        "selectedPoemId": "",
        "selectedThemeId": "",
        "selectedBlock3AuthorId": "",
        "task1Filters": {"includeWorkQuestions": True, "includeTermQuestions": True},
    }
    response = generate_variant_runtime(kb_payload, payload)
    _cached_pregenerated_variant = response
    _cached_pregenerated_variant_at = datetime.now(timezone.utc)
    return response


def warm_runtime_variant_payload_cache() -> None:
    try:
        _load_knowledge_base_payload()
    except Exception:
        return
    try:
        _generate_pregenerated_variant()
    except Exception:
        return


def _load_knowledge_base_payload() -> dict[str, Any]:
    global _next_kb_cache_db_sync_monotonic
    global _in_memory_kb_payload, _in_memory_kb_updated_at

    cached_payload, cached_updated_at = get_cached_knowledge_base_payload()
    now_monotonic = time.monotonic()
    should_sync_with_db = now_monotonic >= _next_kb_cache_db_sync_monotonic

    if cached_payload is not None:
        if _in_memory_kb_payload is not None and _timestamps_equal(cached_updated_at, _in_memory_kb_updated_at):
            _next_kb_cache_db_sync_monotonic = now_monotonic + KB_CACHE_DB_SYNC_INTERVAL_SECONDS
            return _in_memory_kb_payload

        normalized_payload = _normalize_payload(cached_payload)
        _in_memory_kb_payload = normalized_payload
        _in_memory_kb_updated_at = cached_updated_at
        _next_kb_cache_db_sync_monotonic = now_monotonic + KB_CACHE_DB_SYNC_INTERVAL_SECONDS
        return normalized_payload

    if _in_memory_kb_payload is not None and not should_sync_with_db:
        return _in_memory_kb_payload

    with init_session() as session:
        state = session.get(KnowledgeBaseState, 1)

    if state is None:
        state = _get_or_create_state()

    if (
        _in_memory_kb_payload is not None
        and not _db_state_is_newer(state.updatedAt, _in_memory_kb_updated_at)
    ):
        _next_kb_cache_db_sync_monotonic = now_monotonic + KB_CACHE_DB_SYNC_INTERVAL_SECONDS
        return _in_memory_kb_payload

    normalized_payload = _normalize_payload(state.payload)
    _in_memory_kb_payload = normalized_payload
    _in_memory_kb_updated_at = state.updatedAt

    if cached_payload is None or _db_state_is_newer(state.updatedAt, cached_updated_at):
        set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)
        _next_kb_cache_db_sync_monotonic = now_monotonic + KB_CACHE_DB_SYNC_INTERVAL_SECONDS
        return normalized_payload

    _next_kb_cache_db_sync_monotonic = now_monotonic + KB_CACHE_DB_SYNC_INTERVAL_SECONDS
    return _normalize_payload(cached_payload)
