"""
Сервис для записи ссылок на версионированные задания.

Используется при покупке сборников (OrderItemTask).
Ранее использовался и для сохранённых вариантов, но теперь они хранятся
только как JSON-снапшот в variant_payload.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.src.models import KbTask, OrderItemTask


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
    For other tasks: None (full content is in kb_tasks).
    """
    if task_slot == "task2":
        pairs = task_data.get("pairs")
        if pairs:
            return {"selectedPairs": pairs}
        return None

    return None


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
