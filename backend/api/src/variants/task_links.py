"""
Сервис для записи ссылок на версионированные задания.

Используется при сохранении вариантов и покупке сборников.
Записывает ссылки в saved_variant_tasks / order_item_tasks параллельно
с существующим JSON-снапшотом (двойная запись, Фаза 2).
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.src.models import KbTask, SavedVariantTask, OrderItemTask


# Task slots that contain actual task objects in the variant dict
VARIANT_TASK_SLOTS = [
    "task1", "task2", "task3", "task4_1", "task4_2", "task5",
    "task6", "task7", "task8", "task9_1", "task9_2", "task10",
    "task11_1", "task11_2", "task11_3", "task11_4", "task11_5",
]


async def _resolve_task_id(
    external_id: str,
    session: AsyncSession,
    cache: dict[str, int],
) -> int | None:
    """Resolve external_id to kb_tasks.id using cache + DB lookup."""
    if external_id in cache:
        return cache[external_id]

    result = await session.execute(
        select(KbTask.id)
        .where(KbTask.external_id == external_id, KbTask.is_active == True)
        .order_by(KbTask.version.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is not None:
        cache[external_id] = row
    return row


def _extract_runtime_snapshot(task_data: dict[str, Any], task_slot: str) -> dict[str, Any] | None:
    """Extract runtime-specific data that can't be recovered from kb_tasks alone.

    For task2: the selected pairs and their chosen single properties.
    For task8: the selected options subset.
    For other tasks: None (full content is in kb_tasks).
    """
    if task_slot == "task2":
        pairs = task_data.get("pairs")
        if pairs:
            return {"selectedPairs": pairs}
        return None

    if task_slot == "task8":
        # The task8Options field contains the randomized subset of options
        return None  # Options are stored separately in variant["task8Options"]

    return None


async def link_saved_variant_tasks(
    saved_variant_id: int,
    variant_payload: dict[str, Any],
    session: AsyncSession,
) -> int:
    """Create saved_variant_tasks records linking a saved variant to kb_tasks.

    Args:
        saved_variant_id: ID of the saved_variants row.
        variant_payload: The variant dict (containing task1, task2, ..., task11_5).
        session: Async DB session (caller manages commit).

    Returns:
        Number of task links created.
    """
    cache: dict[str, int] = {}
    created = 0

    for slot in VARIANT_TASK_SLOTS:
        task_data = variant_payload.get(slot)
        if not task_data or not isinstance(task_data, dict):
            continue

        ext_id = task_data.get("id")
        if not ext_id:
            continue

        task_id = await _resolve_task_id(str(ext_id), session, cache)
        if task_id is None:
            continue

        runtime = _extract_runtime_snapshot(task_data, slot)

        link = SavedVariantTask(
            saved_variant_id=saved_variant_id,
            task_id=task_id,
            task_slot=slot,
            slot_order=0,
            runtime_snapshot=runtime,
        )
        session.add(link)
        created += 1

    # Handle task8Options separately if present
    task8_options = variant_payload.get("task8Options")
    if task8_options and isinstance(task8_options, list):
        # Store the selected options snapshot on the task8 link
        result = await session.execute(
            select(SavedVariantTask)
            .where(
                SavedVariantTask.saved_variant_id == saved_variant_id,
                SavedVariantTask.task_slot == "task8",
            )
        )
        task8_link = result.scalar_one_or_none()
        if task8_link is not None:
            task8_link.runtime_snapshot = {"selectedOptions": task8_options}

    return created


async def link_order_item_tasks(
    order_item_id: int,
    variant_index: int,
    variant_payload: dict[str, Any],
    session: AsyncSession,
) -> int:
    """Create order_item_tasks records linking a collection variant to kb_tasks.

    Args:
        order_item_id: ID of the order_items row.
        variant_index: Index of this variant within the collection (0-based).
        variant_payload: The variant dict.
        session: Async DB session (caller manages commit).

    Returns:
        Number of task links created.
    """
    cache: dict[str, int] = {}
    created = 0

    for slot in VARIANT_TASK_SLOTS:
        task_data = variant_payload.get(slot)
        if not task_data or not isinstance(task_data, dict):
            continue

        ext_id = task_data.get("id")
        if not ext_id:
            continue

        task_id = await _resolve_task_id(str(ext_id), session, cache)
        if task_id is None:
            continue

        runtime = _extract_runtime_snapshot(task_data, slot)

        link = OrderItemTask(
            order_item_id=order_item_id,
            variant_index=variant_index,
            task_id=task_id,
            task_slot=slot,
            slot_order=0,
            runtime_snapshot=runtime,
        )
        session.add(link)
        created += 1

    # Handle task8Options
    task8_options = variant_payload.get("task8Options")
    if task8_options and isinstance(task8_options, list):
        result = await session.execute(
            select(OrderItemTask)
            .where(
                OrderItemTask.order_item_id == order_item_id,
                OrderItemTask.variant_index == variant_index,
                OrderItemTask.task_slot == "task8",
            )
        )
        task8_link = result.scalar_one_or_none()
        if task8_link is not None:
            task8_link.runtime_snapshot = {"selectedOptions": task8_options}

    return created


def rebuild_variant_from_links(
    tasks: list[SavedVariantTask | OrderItemTask],
    fallback_payload: dict[str, Any],
) -> dict[str, Any]:
    """Rebuild a variant dictionary from the linked tasks.

    If the tasks list is empty, returns the fallback_payload (backward compatibility).
    """
    if not tasks:
        return fallback_payload

    # Start with a copy of fallback_payload to preserve non-task fields (work, excerpt, poet, poem, id, etc.)
    variant = dict(fallback_payload)

    for link in tasks:
        slot = link.task_slot
        kb_task = getattr(link, "task", None)
        if not kb_task:
            continue

        # Reconstruct task dictionary from kb_tasks fields
        task_data = dict(kb_task.content)
        task_data["id"] = kb_task.external_id
        task_data["isActive"] = kb_task.is_active
        if kb_task.term_id:
            task_data["termId"] = kb_task.term_id
        if kb_task.author_id_str:
            task_data["authorId"] = kb_task.author_id_str
        if kb_task.tags:
            task_data["tags"] = kb_task.tags

        # Overlay runtime_snapshot data
        if link.runtime_snapshot:
            if slot == "task2" and "selectedPairs" in link.runtime_snapshot:
                task_data["pairs"] = link.runtime_snapshot["selectedPairs"]
            elif slot == "task8" and "selectedOptions" in link.runtime_snapshot:
                # task8Options goes into the root of variant, not inside task8
                variant["task8Options"] = link.runtime_snapshot["selectedOptions"]

        variant[slot] = task_data

    return variant
