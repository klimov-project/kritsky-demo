from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from db.src.models import SavedVariant
    from .schemas import SavedVariantResponse

def variant_to_dto(item: SavedVariant) -> SavedVariantResponse:
    from .schemas import SavedVariantResponse
    variant_payload = item.variant_payload or {}
    
    return SavedVariantResponse(
        id=item.id,
        userId=item.user_id,
        createdAt=item.createdAt,
        updatedAt=item.updatedAt,
        variant=variant_payload,
        settings=item.settings_payload or {},
        position=item.position,
        isShared=item.is_shared,
        shareToken=item.share_token,
        folderIds=[f.id for f in item.folders] if hasattr(item, "folders") and item.folders else []
    )
