from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class SavedVariantPayload(BaseModel):
    variant: dict[str, Any] = Field(default_factory=dict)
    settings: dict[str, Any] = Field(default_factory=dict)


class SavedVariantResponse(BaseModel):
    id: int
    userId: int | None = None
    createdAt: datetime
    updatedAt: datetime
    variant: dict[str, Any]
    settings: dict[str, Any]


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
