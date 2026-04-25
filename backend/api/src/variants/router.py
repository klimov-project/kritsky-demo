from __future__ import annotations

import os
import time
from datetime import date, datetime, timezone
from typing import Any, Dict, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from api.src.auth.utils import AuthenticatedUser, get_current_user
from api.src.cache.knowledge_base_cache import (
    get_cached_knowledge_base_payload,
    set_cached_knowledge_base_payload,
)
from api.src.knowledge_base.router import _get_or_create_state, _normalize_payload
from api.src.variants.randomizer import (
    generate_variant_runtime,
    refresh_block_runtime,
    refresh_task_runtime,
)
from api.src.variants.randomizer_v2 import (
    generate_variant_runtime2,
    refresh_task_runtime2,
    refresh_block_runtime2,
    generate_block_standalone2,
)
from db.src.connect import ainit_session, init_session
from db.src.models import KnowledgeBaseState, SavedVariant, SavedVariantTask, Subscription, User, VariantExport, VariantFolder

import logging
_logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/variants", tags=["variants"])
SUBSCRIPTION_DAILY_EXPORT_LIMIT = 3


from api.config import SETTINGS

KB_CACHE_DB_SYNC_INTERVAL_SECONDS = SETTINGS.KB_CACHE_DB_SYNC_INTERVAL_SECONDS
_next_kb_cache_db_sync_monotonic = 0.0
_in_memory_kb_payload: dict[str, Any] | None = None
_in_memory_kb_updated_at: datetime | None = None

_cached_pregenerated_variant = None
_cached_pregenerated_variant_v2 = None
_cached_pregenerated_variant_at = None
_cached_pregenerated_variant_v2_at = None


class SavedVariantPayload(BaseModel):
    variant: dict[str, Any] = Field(default_factory=dict)
    settings: dict[str, Any] = Field(default_factory=dict)
    folderIds: list[int] = Field(default_factory=list)


class UpdateSavedVariantPayload(BaseModel):
    folderIds: list[int] = Field(default_factory=list)


class SavedVariantResponse(BaseModel):
    id: int
    userId: int | None = None
    createdAt: datetime
    updatedAt: datetime
    variant: dict[str, Any]
    settings: dict[str, Any]
    folderIds: list[int] = Field(default_factory=list)
    shareToken: str | None = None
    isShared: bool = False


class SavedVariantListResponse(BaseModel):
    items: list[SavedVariantResponse]


class ExportQuotaResponse(BaseModel):
    hasActiveSubscription: bool
    dailyFreeLimit: int
    dailyFreeUsed: int
    dailyFreeRemaining: int
    paidDownloadsRemaining: int


class ConsumeExportRequest(BaseModel):
    savedVariantId: int | None = None
    action: str = "download"


class ConsumeExportResponse(BaseModel):
    quota: ExportQuotaResponse
    source: str


class RuntimeTask1FiltersPayload(BaseModel):
    includeWorkQuestions: bool = True
    includeTermQuestions: bool = True


class RuntimeGeneratePayload(BaseModel):
    useSelected: bool = True
    selectedWorkId: str = ""
    selectedExcerptId: str = ""
    selectedPoetId: str = ""
    selectedPoemId: str = ""
    selectedThemeId: str = ""
    selectedBlock3AuthorId: str = ""
    task1Filters: RuntimeTask1FiltersPayload = Field(default_factory=RuntimeTask1FiltersPayload)
    block11RodPreference: dict[str, str] | None = None


class RuntimeRefreshBlockPayload(BaseModel):
    variant: dict[str, Any] = Field(default_factory=dict)
    block: Literal["block1", "block2", "block3"]
    selectedWorkId: str = ""
    selectedExcerptId: str = ""
    selectedPoetId: str = ""
    selectedPoemId: str = ""
    selectedThemeId: str = ""
    selectedBlock3AuthorId: str = ""
    task1Filters: RuntimeTask1FiltersPayload = Field(default_factory=RuntimeTask1FiltersPayload)
    block11RodPreference: dict[str, str] | None = None


class RuntimeRefreshTaskPayload(BaseModel):
    variant: dict[str, Any] = Field(default_factory=dict)
    taskKey: Literal[
        "task1",
        "task2",
        "task3",
        "task4_1",
        "task4_2",
        "task5",
        "task6",
        "task7",
        "task8",
        "task9_1",
        "task9_2",
        "task10",
        "task11_1",
        "task11_2",
        "task11_3",
        "task11_4",
        "task11_5",
    ]
    selectedThemeId: str = ""
    selectedBlock3AuthorId: str = ""
    task1Filters: RuntimeTask1FiltersPayload = Field(default_factory=RuntimeTask1FiltersPayload)
    task2Action: Literal["full", "reroll", "properties", "character", "property"] = "full"
    task2PairIndex: int | None = None
    excludedTaskIds: list[str] = Field(default_factory=list)


class RuntimeVariantResponse(BaseModel):
    variant: dict[str, Any]
    evaluation: dict[str, Any]


def _reset_daily_downloads_if_needed(user: User) -> None:
    today = date.today()
    if user.last_download_date != today:
        user.daily_downloads_count = 0
        user.last_download_date = today


async def _has_active_subscription(user: User, session) -> bool:
    if user.isPro:
        return True

    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(func.max(Subscription.dateOfExpire)).where(Subscription.userId == user.id)
    )
    expires_at = result.scalar_one_or_none()
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return bool(expires_at and expires_at >= now)


async def _get_export_quota(user: User, session) -> ExportQuotaResponse:
    _ = session
    has_active_subscription = True
    daily_limit = 999_999
    daily_used = 0
    daily_remaining = daily_limit
    paid_remaining = max(0, int((user.paid_download_credits if user else 0) or 0))

    return ExportQuotaResponse(
        hasActiveSubscription=has_active_subscription,
        dailyFreeLimit=daily_limit,
        dailyFreeUsed=daily_used,
        dailyFreeRemaining=daily_remaining,
        paidDownloadsRemaining=paid_remaining,
    )


def _to_dto(item: SavedVariant) -> SavedVariantResponse:
    variant_payload = item.variant_payload or {}
    
    if hasattr(item, "tasks") and item.tasks:
        from api.src.variants.task_links import rebuild_variant_from_links
        variant_payload = rebuild_variant_from_links(item.tasks, variant_payload)

    return SavedVariantResponse(
        id=item.id,
        userId=item.user_id,
        createdAt=item.createdAt,
        updatedAt=item.updatedAt,
        variant=variant_payload,
        settings=item.settings_payload or {},
        folderIds=[f.id for f in item.folders] if hasattr(item, "folders") and item.folders else [],
        shareToken=item.share_token,
        isShared=item.is_shared,
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


def _timestamps_equal(left: datetime | None, right: datetime | None) -> bool:
    left_utc = _to_utc(left)
    right_utc = _to_utc(right)
    return left_utc == right_utc


def warm_runtime_variant_payload_cache() -> None:
    try:
        _load_knowledge_base_payload()
    except Exception:
        return
    try:
        _generate_pregenerated_variant()
        _generate_pregenerated_variant_v2()
    except Exception:
        return


def _load_knowledge_base_payload() -> dict[str, Any]:
    """
    Загрузка данных базы знаний с использованием слоистого кэширования.
    Проверяет Redis, затем локальную память, и при необходимости синхронизируется с БД.
    
    Returns:
        dict: Нормализованные данные базы знаний.
    """
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
        response = generate_variant_runtime(_load_knowledge_base_payload(), payload.model_dump())
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
        response = refresh_block_runtime(_load_knowledge_base_payload(), payload.model_dump())
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
        response = refresh_task_runtime(_load_knowledge_base_payload(), payload.model_dump())
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


@router.post("/runtime/generate-v2", response_model=RuntimeVariantResponse)
def runtime_generate_variant_v2(payload: RuntimeGeneratePayload) -> RuntimeVariantResponse:
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
            detail=f"Failed to generate variant v2: {error}",
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


@router.post("/runtime/refresh-block-v2", response_model=RuntimeVariantResponse)
def runtime_refresh_block_v2(payload: RuntimeRefreshBlockPayload) -> RuntimeVariantResponse:
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
            detail=f"Failed to refresh block v2: {error}",
        ) from error


@router.post("/runtime/refresh-task-v2", response_model=RuntimeVariantResponse)
def runtime_refresh_task_v2(payload: RuntimeRefreshTaskPayload) -> RuntimeVariantResponse:
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
            detail=f"Failed to refresh task v2: {error}",
        ) from error


def _generate_pregenerated_variant() -> dict[str, Any]:
    """
    Генерирует и кэширует эталонный вариант ЕГЭ.
    Используется для быстрого старта приложения или ручного обновления кэша.
    
    Returns:
        dict: Сгенерированный вариант с оценкой.
    """
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


@router.get("/runtime/pregenerated", response_model=RuntimeVariantResponse)
def get_runtime_pregenerated_variant() -> RuntimeVariantResponse:
    """Return the cached pregenerated variant. Never triggers generation.

    Generation happens only at Docker startup or via GET /runtime/pregenerated/generate.
    """
    if _cached_pregenerated_variant is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Pregenerated variant is not ready yet. "
                "Trigger generation via GET /api/variants/runtime/pregenerated/generate."
            ),
        )
    return RuntimeVariantResponse(
        variant=_cached_pregenerated_variant["variant"],
        evaluation=_cached_pregenerated_variant["evaluation"],
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


@router.get("/runtime/pregenerated-v2", response_model=RuntimeVariantResponse)
def get_runtime_pregenerated_variant_v2() -> RuntimeVariantResponse:
    if _cached_pregenerated_variant_v2 is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Pregenerated V2 variant is not ready yet. "
                "Trigger generation via GET /api/variants/runtime/pregenerated-v2/generate."
            ),
        )
    return RuntimeVariantResponse(
        variant=_cached_pregenerated_variant_v2["variant"],
        evaluation=_cached_pregenerated_variant_v2["evaluation"],
    )


@router.get("/runtime/pregenerated-v2/generate", response_model=RuntimeVariantResponse)
def force_generate_pregenerated_variant_v2() -> RuntimeVariantResponse:
    try:
        response = _generate_pregenerated_variant_v2()
        return RuntimeVariantResponse(
            variant=response["variant"],
            evaluation=response["evaluation"],
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to force generate pregenerated V2 variant: {error}",
        ) from error


@router.get("", response_model=SavedVariantListResponse)
async def list_saved_variants(
    folder_id: int | None = None,
    auth: AuthenticatedUser = Depends(get_current_user)
) -> SavedVariantListResponse:
    async with ainit_session() as session:
        stmt = select(SavedVariant).where(SavedVariant.user_id == auth.user.id)
        if folder_id is not None:
            stmt = stmt.where(SavedVariant.folders.any(VariantFolder.id == folder_id))
        
        query = await session.execute(
            stmt
            .options(
                selectinload(SavedVariant.tasks).selectinload(SavedVariantTask.task),
                selectinload(SavedVariant.folders)
            )
            .order_by(SavedVariant.id.desc())
        )
        items = query.scalars().all()
        return SavedVariantListResponse(items=[_to_dto(item) for item in items])


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
        return _to_dto(item)


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

        return _to_dto(item)


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
        return _to_dto(item)


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
        return _to_dto(item)


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
        return _to_dto(item)


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
        
        return _to_dto(item)


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
        variant_id = payload.savedVariantId if payload else None
        export_record = VariantExport(
            user_id=user.id,
            saved_variant_id=variant_id,
            action=action,
        )
        session.add(export_record)
        user.downloadsTotal = (user.downloadsTotal or 0) + 1
        await session.commit()

        return ConsumeExportResponse(
            quota=quota,
            source=source,
        )
