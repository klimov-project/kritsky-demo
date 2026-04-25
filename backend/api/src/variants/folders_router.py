from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from api.src.auth.utils import AuthenticatedUser, get_current_user
from api.src.variants.schemas import (
    VariantFolderListResponse,
    VariantFolderPayload,
    VariantFolderResponse,
)
from db.src.connect import ainit_session
from db.src.models import VariantFolder

router = APIRouter(prefix="/api/variant-folders", tags=["variant-folders"])


def _to_dto(item: VariantFolder) -> VariantFolderResponse:
    return VariantFolderResponse(
        id=item.id,
        name=item.name,
        createdAt=item.createdAt,
    )


@router.get("", response_model=VariantFolderListResponse)
async def list_folders(auth: AuthenticatedUser = Depends(get_current_user)) -> VariantFolderListResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(VariantFolder)
            .where(VariantFolder.user_id == auth.user.id)
            .order_by(VariantFolder.id.desc())
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
    folder_id: int, payload: VariantFolderPayload, auth: AuthenticatedUser = Depends(get_current_user)
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

        item.name = payload.name
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
