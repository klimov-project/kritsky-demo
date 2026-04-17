from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from api.src.cache.knowledge_base_cache import (
    get_knowledge_base_cache_meta,
    get_cached_knowledge_base_payload,
    set_cached_knowledge_base_payload,
)
from db.src.models import KnowledgeBaseState

from .schemas import (
    KnowledgeBasePayload,
    KnowledgeBaseResponse,
    KnowledgeBaseCacheMetaResponse,
    WeeklyVariantPayload,
    WeeklyPinsPayload,
)
from .utils import (
    _normalize_payload,
    _to_response,
    _get_or_create_state,
)


router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge-base"])


@router.get("", response_model=KnowledgeBaseResponse)
def get_knowledge_base() -> KnowledgeBaseResponse:
    try:
        cached_payload, cached_updated_at = get_cached_knowledge_base_payload()
        if cached_payload is not None:
            normalized_payload = _normalize_payload(cached_payload)
            return KnowledgeBaseResponse(
                works=normalized_payload["works"],
                poets=normalized_payload["poets"],
                block3=normalized_payload["block3"],
                settings=normalized_payload["settings"],
                updatedAt=cached_updated_at,
            )

        state = _get_or_create_state()
        normalized_payload = _normalize_payload(state.payload)
        set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)
        return _to_response(state)
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500, detail=f"Failed to load knowledge base: {error}") from error


@router.put("", response_model=KnowledgeBaseResponse)
def save_knowledge_base(payload: KnowledgeBasePayload) -> KnowledgeBaseResponse:
    """
    Сохранение всей базы знаний в БД и обновление кэша.
    Выполняет нормализацию данных перед сохранением.
    
    Args:
        payload (KnowledgeBasePayload): Новые данные базы знаний.
        
    Returns:
        KnowledgeBaseResponse: Сохраненная и нормализованная БД.
    """
    normalized_payload = _normalize_payload(payload.model_dump())

    try:
        from db.src.connect import init_session
        from sqlalchemy.exc import IntegrityError

        with init_session() as session:
            state = session.get(KnowledgeBaseState, 1)
            if state is None:
                state = KnowledgeBaseState(id=1, payload=normalized_payload)
            else:
                state.payload = normalized_payload

            session.add(state)
            try:
                session.commit()
            except IntegrityError:
                session.rollback()
                state = session.get(KnowledgeBaseState, 1)
                if state is None:
                    raise
                state.payload = normalized_payload
                session.add(state)
                session.commit()

            session.refresh(state)
            set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)
            return _to_response(state)
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500, detail=f"Failed to save knowledge base: {error}") from error


@router.patch("/weekly-pins")
def set_weekly_pins(payload: WeeklyPinsPayload) -> dict[str, bool]:
    """
    Обновление закрепленных ID для еженедельного варианта.
    Частично обновляет только поле weeklyPins в настройках.
    
    Args:
        payload (WeeklyPinsPayload): Набор ID для закрепления.
        
    Returns:
        dict: Статус успешности операции.
    """
    try:
        from db.src.connect import init_session

        with init_session() as session:
            state = session.get(KnowledgeBaseState, 1)
            if state is None:
                raise HTTPException(status_code=404, detail="Knowledge base not found")

            from typing import Any
            current_payload: dict[str, Any] = state.payload if isinstance(state.payload, dict) else {}
            current_settings: dict[str, Any] = current_payload.get("settings", {})
            if not isinstance(current_settings, dict):
                current_settings = {}

            current_settings["weeklyPins"] = payload.weeklyPins
            current_payload["settings"] = current_settings
            state.payload = current_payload

            session.add(state)
            session.commit()
            session.refresh(state)

            normalized_payload = _normalize_payload(state.payload)
            set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)

            return {"ok": True}
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500, detail=f"Failed to set weekly pins: {error}") from error


@router.patch("/weekly-variant")
def set_weekly_variant(payload: WeeklyVariantPayload) -> dict[str, bool]:
    """
    Обновление данных еженедельного варианта.
    Частично обновляет только поле weeklyVariant в настройках.
    
    Args:
        payload (WeeklyVariantPayload): Данные варианта.
        
    Returns:
        dict: Статус успешности операции.
    """
    try:
        from db.src.connect import init_session

        with init_session() as session:
            state = session.get(KnowledgeBaseState, 1)
            if state is None:
                raise HTTPException(status_code=404, detail="Knowledge base not found")

            from typing import Any
            current_payload: dict[str, Any] = state.payload if isinstance(state.payload, dict) else {}
            current_settings: dict[str, Any] = current_payload.get("settings", {})
            if not isinstance(current_settings, dict):
                current_settings = {}

            current_settings["weeklyVariant"] = payload.weeklyVariant
            current_payload["settings"] = current_settings
            state.payload = current_payload

            session.add(state)
            session.commit()
            session.refresh(state)

            normalized_payload = _normalize_payload(state.payload)
            set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)

            return {"ok": True}
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500, detail=f"Failed to set weekly variant: {error}") from error


@router.get("/cache/meta", response_model=KnowledgeBaseCacheMetaResponse)
def get_knowledge_base_cache_meta_route() -> KnowledgeBaseCacheMetaResponse:
    meta = get_knowledge_base_cache_meta()
    from datetime import datetime
    return KnowledgeBaseCacheMetaResponse(
        redisEnabled=bool(meta.get("redisEnabled")),
        key=str(meta.get("key") or ""),
        exists=bool(meta.get("exists")),
        sizeBytes=max(0, int(meta.get("sizeBytes") or 0)),
        updatedAt=meta.get("updatedAt") if isinstance(meta.get("updatedAt"), datetime) else None,
    )


@router.post("/cache/refresh", response_model=KnowledgeBaseCacheMetaResponse)
def refresh_knowledge_base_cache_route() -> KnowledgeBaseCacheMetaResponse:
    try:
        state = _get_or_create_state()
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500, detail=f"Failed to refresh cache from database: {error}") from error

    normalized_payload = _normalize_payload(state.payload)
    set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)
    meta = get_knowledge_base_cache_meta()

    from datetime import datetime
    return KnowledgeBaseCacheMetaResponse(
        redisEnabled=bool(meta.get("redisEnabled")),
        key=str(meta.get("key") or ""),
        exists=bool(meta.get("exists")),
        sizeBytes=max(0, int(meta.get("sizeBytes") or 0)),
        updatedAt=meta.get("updatedAt") if isinstance(meta.get("updatedAt"), datetime) else None,
    )


def warm_knowledge_base_cache_from_db() -> None:
    try:
        state = _get_or_create_state()
    except SQLAlchemyError:
        return

    normalized_payload = _normalize_payload(state.payload)
    set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)
