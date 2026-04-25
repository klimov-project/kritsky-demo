from __future__ import annotations

import os
import time
from datetime import date, datetime, timezone
from typing import Any, Dict, Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
import asyncio
from collections import deque
import logging
_logger = logging.getLogger(__name__)
_logger.setLevel(logging.INFO)

from api.src.auth.utils import AuthenticatedUser, get_current_user
from api.src.cache.knowledge_base_cache import (
    get_cached_knowledge_base_payload,
    set_cached_knowledge_base_payload,
)
from api.src.knowledge_base.router import _get_or_create_state, _normalize_payload
from api.src.variants.randomizer_v2 import (
    generate_variant_runtime2,
    refresh_task_runtime2,
    refresh_block_runtime2,
    generate_block_standalone2,
)
from db.src.connect import ainit_session, init_session
from db.src.models import KnowledgeBaseState, SavedVariant, SavedVariantTask, Subscription, User, VariantExport, VariantFolder

router = APIRouter(prefix="/api/variants", tags=["variants"])
SUBSCRIPTION_DAILY_EXPORT_LIMIT = 3


from api.config import SETTINGS

KB_CACHE_DB_SYNC_INTERVAL_SECONDS = SETTINGS.KB_CACHE_DB_SYNC_INTERVAL_SECONDS
_next_kb_cache_db_sync_monotonic = 0.0
_in_memory_kb_payload: dict[str, Any] | None = None
_in_memory_kb_updated_at: datetime | None = None

_VARIANT_POOL_SIZE = 10
_variant_pool_v2: deque = deque(maxlen=_VARIANT_POOL_SIZE)
_variant_pool_refill_task: asyncio.Task | None = None


from .schemas import (
    SavedVariantPayload,
    UpdateSavedVariantPayload,
    SavedVariantResponse,
    SavedVariantListResponse,
    ExportQuotaResponse,
    ConsumeExportRequest,
    ConsumeExportResponse,
    RuntimeTask1FiltersPayload,
    RuntimeGeneratePayload,
    RuntimeRefreshBlockPayload,
    RuntimeRefreshTaskPayload,
    RuntimeVariantResponse,
)
from .converters import variant_to_dto




async def _get_export_quota(user: User, session) -> ExportQuotaResponse:
    from datetime import datetime, time, timezone
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)

    # Count today's exports
    query = await session.execute(
        select(VariantExport.content_type)
        .where(
            VariantExport.user_id == user.id,
            VariantExport.createdAt >= today_start
        )
    )
    exports = query.scalars().all()

    excerpts_used = 0
    poems_used = 0
    for ct in exports:
        if ct == "full":
            excerpts_used += 1
            poems_used += 1
        elif ct == "excerpt":
            excerpts_used += 1
        elif ct == "poem":
            poems_used += 1

    has_active_subscription = bool(user.isPro) # Simplified for now, we have Subscription checks elsewhere
    
    daily_excerpts_limit = 3
    daily_poems_limit = 3
    
    paid_remaining = max(0, int((user.paid_download_credits if user else 0) or 0))

    excerpts_rem = max(0, daily_excerpts_limit - excerpts_used)
    poems_rem = max(0, daily_poems_limit - poems_used)

    return ExportQuotaResponse(
        hasActiveSubscription=has_active_subscription,
        dailyExcerptsLimit=daily_excerpts_limit,
        dailyExcerptsUsed=excerpts_used,
        dailyExcerptsRemaining=excerpts_rem,
        dailyPoemsLimit=daily_poems_limit,
        dailyPoemsUsed=poems_used,
        dailyPoemsRemaining=poems_rem,
        paidDownloadsRemaining=paid_remaining,
        # Legacy fields
        dailyFreeLimit=daily_excerpts_limit,
        dailyFreeUsed=max(excerpts_used, poems_used),
        dailyFreeRemaining=min(excerpts_rem, poems_rem),
    )




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


def warm_runtime_variant_payload_cache() -> None:
    try:
        _load_v2_knowledge_base_payload()
    except Exception:
        return
    try:
        # Pre-fill the pool with at least one variant at startup
        response = _generate_pregenerated_variant_v2()
        _variant_pool_v2.append(response)
    except Exception as e:
        _logger.error(f"Failed to warm variant cache: {e}")
        return


def _timestamps_equal(left: datetime | None, right: datetime | None) -> bool:
    left_utc = _to_utc(left)
    right_utc = _to_utc(right)
    return left_utc == right_utc


    _next_kb_cache_db_sync_monotonic = now_monotonic + KB_CACHE_DB_SYNC_INTERVAL_SECONDS
    return _normalize_payload(cached_payload)


_in_memory_kb_payload_v2: dict[str, Any] | None = None
_in_memory_kb_v2_updated_at: float = 0.0


def _load_v2_knowledge_base_payload() -> dict[str, Any]:
    global _in_memory_kb_payload_v2, _in_memory_kb_v2_updated_at
    
    now = time.monotonic()
    if _in_memory_kb_payload_v2 is not None and now - _in_memory_kb_v2_updated_at < 60:
        return _in_memory_kb_payload_v2
        
    from db.src.connect import init_session
    from api.src.knowledge_base.builder import build_kb_payload_from_tables
    
    with init_session() as session:
        _in_memory_kb_payload_v2 = build_kb_payload_from_tables(session)
        _in_memory_kb_v2_updated_at = now
        
    return _in_memory_kb_payload_v2


@router.post("/runtime/generate", response_model=RuntimeVariantResponse)
def runtime_generate_variant(payload: RuntimeGeneratePayload) -> RuntimeVariantResponse:
    try:
        response = generate_variant_runtime2(_load_v2_knowledge_base_payload(), payload.model_dump())
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate variant: {error}",
        ) from error


@router.post("/runtime/refresh-block", response_model=RuntimeVariantResponse)
def runtime_refresh_block(payload: RuntimeRefreshBlockPayload) -> RuntimeVariantResponse:
    try:
        response = refresh_block_runtime2(_load_v2_knowledge_base_payload(), payload.model_dump())
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh block: {error}",
        ) from error


@router.post("/runtime/refresh-task", response_model=RuntimeVariantResponse)
def runtime_refresh_task(payload: RuntimeRefreshTaskPayload) -> RuntimeVariantResponse:
    try:
        response = refresh_task_runtime2(_load_v2_knowledge_base_payload(), payload.model_dump())
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh task: {error}",
        ) from error




@router.post("/runtime/generate-block-v2")
def runtime_generate_block_v2(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Автономная генерация отдельного блока (block1, block2 или block3) V2.
    """
    try:
        response = generate_block_standalone2(_load_v2_knowledge_base_payload(), payload)
        return response
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate standalone block: {error}",
        ) from error




def _generate_pregenerated_variant() -> dict[str, Any]:
    return _generate_pregenerated_variant_v2()


def _generate_pregenerated_variant_v2() -> dict[str, Any]:
    """
    Генерирует и кэширует эталонный вариант ЕГЭ (V2).
    """
    global _cached_pregenerated_variant_v2, _cached_pregenerated_variant_v2_at

    kb_payload = _load_v2_knowledge_base_payload()

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

    response = generate_variant_runtime2(kb_payload, payload)
    _cached_pregenerated_variant_v2 = response
    _cached_pregenerated_variant_v2_at = datetime.now(timezone.utc)
    return response


async def _refill_variant_pool_loop_v2():
    """Background task to keep the variant pool full."""
    while True:
        try:
            if len(_variant_pool_v2) < _VARIANT_POOL_SIZE:
                # Run CPU-bound generation in a thread
                response = await asyncio.to_thread(_generate_pregenerated_variant_v2)
                _variant_pool_v2.append(response)
                _logger.info(f"Refilled variant pool. Current size: {len(_variant_pool_v2)}")
            else:
                await asyncio.sleep(5) # Pool is full, check less often
        except Exception as e:
            _logger.error(f"Error in variant pool refill: {e}")
            await asyncio.sleep(10)
        await asyncio.sleep(0.5)


@router.get("/runtime/pregenerated", response_model=RuntimeVariantResponse)
async def get_runtime_pregenerated_variant() -> RuntimeVariantResponse:
    """Return a variant from the pool or generate one if empty."""
    # We use V2 pool by default for the main endpoint if possible
    if _variant_pool_v2:
        response = _variant_pool_v2.popleft()
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    
    # Fallback to direct generation if pool is empty
    response = await asyncio.to_thread(_generate_pregenerated_variant_v2)
    return RuntimeVariantResponse(
        variant=response["variant"],
        evaluation=response["evaluation"],
    )


@router.get("/runtime/pregenerated/v2", response_model=RuntimeVariantResponse)
async def get_runtime_pregenerated_variant_v2() -> RuntimeVariantResponse:
    """Return a variant from the V2 pool."""
    if _variant_pool_v2:
        response = _variant_pool_v2.popleft()
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    
    # Fallback
    response = await asyncio.to_thread(_generate_pregenerated_variant_v2)
    return RuntimeVariantResponse(
        variant=response["variant"],
        evaluation=response["evaluation"],
    )


@router.get("/runtime/pregenerated/generate", response_model=RuntimeVariantResponse)
def force_generate_pregenerated_variant() -> RuntimeVariantResponse:
    """Manual trigger to force re-generation of the pregenerated variant cache.

    Can be called from the browser (plain GET) to rebuild the cache on demand.
    """
    try:
        response = _generate_pregenerated_variant()
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to force generate pregenerated variant: {error}",
        ) from error




@router.get("", response_model=SavedVariantListResponse)
async def list_saved_variants(
    folder_id: int | None = None,
    variant_ids: list[int] | None = Query(None),
    auth: AuthenticatedUser = Depends(get_current_user)
) -> SavedVariantListResponse:
    async with ainit_session() as session:
        stmt = select(SavedVariant).where(SavedVariant.user_id == auth.user.id)
        if folder_id is not None:
            stmt = stmt.where(SavedVariant.folders.any(VariantFolder.id == folder_id))
        
        if variant_ids:
            stmt = stmt.where(SavedVariant.id.in_(variant_ids))
        
        query = await session.execute(
            stmt
            .options(
                selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task),
                selectinload(SavedVariant.folders)
            )
            .order_by(SavedVariant.position.asc(), SavedVariant.id.desc())
        )
        items = query.scalars().all()
        return SavedVariantListResponse(items=[variant_to_dto(item) for item in items])


@router.get("/{variant_id}", response_model=SavedVariantResponse)
async def get_saved_variant(variant_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> SavedVariantResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant)
            .where(
                SavedVariant.id == variant_id,
                SavedVariant.user_id == auth.user.id,
            )
            .options(selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task))
        )
        item = query.scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved variant not found")
        return variant_to_dto(item)


@router.post("", response_model=SavedVariantResponse)
async def create_saved_variant(
    payload: SavedVariantPayload,
    auth: AuthenticatedUser = Depends(get_current_user),
) -> SavedVariantResponse:
    async with ainit_session() as session:
        item = SavedVariant(
            user_id=auth.user.id,
            variant_payload=payload.variant,
            settings_payload=payload.settings,
        )
        
        if payload.folderIds:
            query = await session.execute(
                select(VariantFolder).where(
                    VariantFolder.id.in_(payload.folderIds),
                    VariantFolder.user_id == auth.user.id
                )
            )
            folders = query.scalars().all()
            item.folders = list(folders)

        session.add(item)
        await session.commit()
        await session.refresh(item)

        # Phase 2: dual-write — link tasks to kb_tasks (non-fatal)
        try:
            from api.src.variants.task_links import link_saved_variant_tasks
            linked = await link_saved_variant_tasks(item.id, payload.variant, session)
            await session.commit()
            if linked:
                _logger.info("Linked %d tasks for saved_variant %d", linked, item.id)
        except Exception:
            _logger.exception("Failed to link tasks for saved_variant %d", item.id)

        # Re-query with tasks loaded to avoid lazy-load issues in _to_dto
        query = await session.execute(
            select(SavedVariant)
            .where(SavedVariant.id == item.id)
            .options(selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task))
        )
        item = query.scalar_one()

        return variant_to_dto(item)


@router.patch("/{variant_id}", response_model=SavedVariantResponse)
async def update_saved_variant(
    variant_id: int, 
    payload: UpdateSavedVariantPayload, 
    auth: AuthenticatedUser = Depends(get_current_user)
) -> SavedVariantResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant).where(
                SavedVariant.id == variant_id,
                SavedVariant.user_id == auth.user.id,
            ).options(selectinload(SavedVariant.folders))
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        if payload.folderIds is not None:
            if not payload.folderIds:
                item.folders = []
            else:
                folder_query = await session.execute(
                    select(VariantFolder).where(
                        VariantFolder.id.in_(payload.folderIds),
                        VariantFolder.user_id == auth.user.id
                    )
                )
                folders = folder_query.scalars().all()
                item.folders = list(folders)
        
        if payload.position is not None:
            item.position = payload.position
            
        await session.commit()
        await session.refresh(item)
        
        # Reload relations for DTO
        query = await session.execute(
            select(SavedVariant)
            .where(SavedVariant.id == item.id)
            .options(
                selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task),
                selectinload(SavedVariant.folders)
            )
        )
        item = query.scalar_one()
        return variant_to_dto(item)


@router.post("/{variant_id}/share", response_model=SavedVariantResponse)
async def share_variant(variant_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> SavedVariantResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant).where(
                SavedVariant.id == variant_id,
                SavedVariant.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        if not item.share_token:
            import uuid
            item.share_token = uuid.uuid4().hex
        
        item.is_shared = True
        await session.commit()
        await session.refresh(item)
        
        # Reload relations for DTO
        query = await session.execute(
            select(SavedVariant)
            .where(SavedVariant.id == item.id)
            .options(selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task))
        )
        item = query.scalar_one()
        return variant_to_dto(item)


@router.delete("/{variant_id}/share", response_model=SavedVariantResponse)
async def unshare_variant(variant_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> SavedVariantResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant).where(
                SavedVariant.id == variant_id,
                SavedVariant.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        item.is_shared = False
        await session.commit()
        await session.refresh(item)
        
        # Reload relations for DTO
        query = await session.execute(
            select(SavedVariant)
            .where(SavedVariant.id == item.id)
            .options(selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task))
        )
        item = query.scalar_one()
        return variant_to_dto(item)


@router.get("/shared/{token}", response_model=SavedVariantResponse)
async def get_shared_variant(token: str, auth: AuthenticatedUser = Depends(get_current_user)) -> SavedVariantResponse:
    if not auth.user.isPro:
        raise HTTPException(status_code=403, detail="Active subscription required to view shared variants")
    
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant)
            .where(
                SavedVariant.share_token == token,
                SavedVariant.is_shared == True,
            )
            .options(selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task))
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Shared variant not found or access revoked")
        
        return variant_to_dto(item)


@router.delete("/{variant_id}")
async def delete_saved_variant(variant_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> dict[str, Any]:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant).where(
                SavedVariant.id == variant_id,
                SavedVariant.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if item is None:
            return {"ok": True, "deleted": False}

        await session.delete(item)
        await session.commit()
        return {"ok": True, "deleted": True}


@router.get("/export/quota", response_model=ExportQuotaResponse)
async def get_export_quota(auth: AuthenticatedUser = Depends(get_current_user)) -> ExportQuotaResponse:
    async with ainit_session() as session:
        user = await session.get(User, auth.user.id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        quota = await _get_export_quota(user, session)
        session.add(user)
        await session.commit()
        return quota


@router.post("/export/quota/consume", response_model=ConsumeExportResponse)
async def consume_export_quota(
    payload: ConsumeExportRequest | None = None,
    auth: AuthenticatedUser = Depends(get_current_user),
) -> ConsumeExportResponse:
    """
    Учет использования квоты на экспорт (печать/скачивание).
    Регистрирует действие пользователя и обновляет общую статистику скачиваний.
    
    Args:
        payload (ConsumeExportRequest, optional): Данные действия (ID варианта, тип действия).
        auth (AuthenticatedUser): Текущий пользователь.
        
    Returns:
        ConsumeExportResponse: Текущее состояние квот и источник списания.
    """
    async with ainit_session() as session:
        query = await session.execute(
            select(User)
            .where(User.id == auth.user.id)
            .with_for_update()
        )
        user = query.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        quota = await _get_export_quota(user, session)
        source = "free"

        action = (payload.action if payload and payload.action in ("download", "print") else "download")
        content_type = (payload.contentType if payload and payload.contentType in ("full", "excerpt", "poem") else "full")
        variant_id = payload.savedVariantId if payload else None
        
        # Check if user has quota left (for free users)
        if not user.isPro and quota.paidDownloadsRemaining <= 0:
            if content_type == "full":
                if quota.dailyExcerptsRemaining <= 0 or quota.dailyPoemsRemaining <= 0:
                    raise HTTPException(status_code=403, detail="Daily free limit reached for full variants")
            elif content_type == "excerpt":
                if quota.dailyExcerptsRemaining <= 0:
                    raise HTTPException(status_code=403, detail="Daily free limit reached for excerpts")
            elif content_type == "poem":
                if quota.dailyPoemsRemaining <= 0:
                    raise HTTPException(status_code=403, detail="Daily free limit reached for poems")

        export_record = VariantExport(
            user_id=user.id,
            saved_variant_id=variant_id,
            action=action,
            content_type=content_type,
        )
        session.add(export_record)
        user.downloadsTotal = (user.downloadsTotal or 0) + 1
        await session.commit()

        return ConsumeExportResponse(
            quota=quota,
            source=source,
        )
