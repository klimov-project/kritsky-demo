from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from api.src.auth.utils import AuthenticatedUser, get_current_user
from api.src.variants.schemas import (
    VariantFolderListResponse,
    VariantFolderPayload,
    VariantFolderUpdatePayload,
    VariantFolderResponse,
    SavedVariantListResponse,
)
import uuid
from sqlalchemy.orm import selectinload
from db.src.connect import ainit_session
from db.src.models import VariantFolder, SavedVariant

router = APIRouter(prefix="/api/variant-folders", tags=["variant-folders"])


def _to_dto(item: VariantFolder) -> VariantFolderResponse:
    return VariantFolderResponse(
        id=item.id,
        name=item.name,
        createdAt=item.createdAt,
        shareToken=item.share_token,
        isShared=item.is_shared,
        position=item.position,
    )


@router.get("", response_model=VariantFolderListResponse)
async def list_folders(auth: AuthenticatedUser = Depends(get_current_user)) -> VariantFolderListResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder)
            .where(VariantFolder.user_id == auth.user.id)
            .order_by(VariantFolder.position.asc(), VariantFolder.id.desc())
        )
        items = query.scalars().all()
        return VariantFolderListResponse(items=[_to_dto(item) for item in items])


@router.post("", response_model=VariantFolderResponse)
async def create_folder(
    payload: VariantFolderPayload, auth: AuthenticatedUser = Depends(get_current_user)
) -> VariantFolderResponse:
    async with ainit_session() as session:
        item = VariantFolder(user_id=auth.user.id, name=payload.name)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return _to_dto(item)


@router.patch("/{folder_id}", response_model=VariantFolderResponse)
async def update_folder(
    folder_id: int, payload: VariantFolderUpdatePayload, auth: AuthenticatedUser = Depends(get_current_user)
) -> VariantFolderResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder).where(
                VariantFolder.id == folder_id,
                VariantFolder.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Folder not found")

        if payload.name is not None:
            item.name = payload.name
        if payload.position is not None:
            item.position = payload.position
            
        await session.commit()
        await session.refresh(item)
        return _to_dto(item)


@router.delete("/{folder_id}")
async def delete_folder(folder_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> dict[str, Any]:
    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder).where(
                VariantFolder.id == folder_id,
                VariantFolder.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Folder not found")

        await session.delete(item)
        await session.commit()
        return {"ok": True}


@router.post("/{folder_id}/share", response_model=VariantFolderResponse)
async def share_folder(folder_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> VariantFolderResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder).where(
                VariantFolder.id == folder_id,
                VariantFolder.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Folder not found")

        item.is_shared = True
        if not item.share_token:
            item.share_token = uuid.uuid4().hex

        await session.commit()
        await session.refresh(item)
        return _to_dto(item)


@router.delete("/{folder_id}/share", response_model=VariantFolderResponse)
async def unshare_folder(folder_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> VariantFolderResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder).where(
                VariantFolder.id == folder_id,
                VariantFolder.user_id == auth.user.id,
            )
        )
        item = query.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Folder not found")

        item.is_shared = False
        await session.commit()
        await session.refresh(item)
        return _to_dto(item)


@router.get("/shared/{token}", response_model=SavedVariantListResponse)
async def get_shared_folder(token: str, auth: AuthenticatedUser = Depends(get_current_user)) -> SavedVariantListResponse:
    if not auth.user.isPro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active subscription required to view shared folders",
        )

    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder).where(
                VariantFolder.share_token == token,
                VariantFolder.is_shared == True,
            )
        )
        folder = query.scalar_one_or_none()
        if not folder:
            raise HTTPException(status_code=404, detail="Shared folder not found or link is inactive")

        # Now get all variants for this folder
        from api.src.variants.converters import variant_to_dto
        
        variant_query = await session.execute(
            select(SavedVariant)
            .where(SavedVariant.folders.any(VariantFolder.id == folder.id))
            .options(
                selectinload(SavedVariant.folders)
            )
            .order_by(SavedVariant.position.asc(), SavedVariant.id.desc())
        )
        variants = variant_query.scalars().all()
        return SavedVariantListResponse(items=[variant_to_dto(v) for v in variants])
