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
        return KnowledgeBaseResponse(
            works=normalized_payload["works"],
            poets=normalized_payload["poets"],
            block3=normalized_payload["block3"],
            settings=normalized_payload["settings"],
            updatedAt=state.updatedAt,
        )
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
        from .saver import sync_kb_payload_to_tables

        with init_session() as session:
            state = session.get(KnowledgeBaseState, 1)
            if state is None:
                state = KnowledgeBaseState(id=1, payload=normalized_payload)
            else:
                state.payload = normalized_payload

            session.add(state)
            
            # Phase 4 dual-write: (Temporarily disabled)
            # sync_kb_payload_to_tables(normalized_payload, session)
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
        from db.src.models import KbSetting

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
            
            # Dual-write to KbSetting
            setting_db = session.get(KbSetting, "weeklyPins")
            if setting_db:
                setting_db.payload = payload.weeklyPins
            else:
                session.add(KbSetting(key="weeklyPins", payload=payload.weeklyPins))
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
        from db.src.models import KbSetting

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
            
            # Dual-write to KbSetting
            setting_db = session.get(KbSetting, "weeklyVariant")
            if setting_db:
                setting_db.payload = payload.weeklyVariant
            else:
                session.add(KbSetting(key="weeklyVariant", payload=payload.weeklyVariant))
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
        from db.src.connect import init_session
        from sqlalchemy import select, func
        from db.src.models import KbTask
        from .saver import sync_kb_payload_to_tables
        import logging
        
        state = _get_or_create_state()
        normalized_payload = _normalize_payload(state.payload)
        
        # Phase 4 auto-sync: if tables are empty but blob has data, sync them now
        # This prevents V2 Randomizer from failing on first deploy.
        with init_session() as session:
            task_count = session.execute(select(func.count(KbTask.id))).scalar() or 0
            if task_count == 0 and normalized_payload.get("works"):
                logging.getLogger(__name__).info("KB tables are empty. (Auto-sync disabled)")
                # try:
                #     sync_kb_payload_to_tables(normalized_payload, session)
                #     session.commit()
                #     logging.getLogger(__name__).info("Automatic KB sync completed.")
                # except Exception as e:
                #     session.rollback()
                #     logging.getLogger(__name__).error(f"Failed to auto-sync KB tables on startup: {e}")

    except SQLAlchemyError:
        return

    set_cached_knowledge_base_payload(normalized_payload, state.updatedAt)
