from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class KnowledgeBasePayload(BaseModel):
    works: list[dict[str, Any]] = Field(default_factory=list)
    poets: list[dict[str, Any]] = Field(default_factory=list)
    block3: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    settings: dict[str, Any] = Field(default_factory=dict)


class KnowledgeBaseResponse(KnowledgeBasePayload):
    updatedAt: datetime | None = None


class KnowledgeBaseCacheMetaResponse(BaseModel):
    redisEnabled: bool
    key: str
    exists: bool
    sizeBytes: int
    updatedAt: datetime | None = None


class WeeklyVariantPayload(BaseModel):
    weeklyVariant: dict[str, Any] | None = None


class WeeklyPinsPayload(BaseModel):
    weeklyPins: dict[str, str] | None = None
