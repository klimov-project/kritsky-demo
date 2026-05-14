from typing import Any

from .constants import BLOCK11_KEYS
from .tokens import (
    _filter_active_items, 
    _extract_term_tokens,
    _extract_rod_tokens,
    _build_id_exclusion_set,
    _build_identifier_exclusion_set,
)
from .context import SelectionContext, _pick_best_from_pool, _pick_random, _can_select_question
from .tasks import (
    _build_runtime_task2,
    _build_runtime_two_gap_candidates,
    _task8_has_term_conflict,
    _build_task8_options,
    _generate_rod_layout,
    _rotate_rod_layout,
    _group_pool_by_rod,
    _find_exclusive_slot,
    _is_exclusive_question,
)

def build_block1_pools(work: dict[str, Any], excerpt_tasks: dict[str, Any], kb_payload: dict[str, Any] = None) -> dict[str, list[dict[str, Any]]]:
    work_common = work.get("commonTasks") or {}
    
    t1_ids = _build_id_exclusion_set(excerpt_tasks.get("excludeTask1Ids"))
    t1_terms = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask1TermIds"))
    t2_ids = _build_id_exclusion_set(excerpt_tasks.get("excludeTask2Ids"))
    t2_terms = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask2TermIds"))
    t3_ids = _build_id_exclusion_set(excerpt_tasks.get("excludeTask3Ids"))
    t3_terms = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask3TermIds"))
    
    def get_b1_pool(key, custom_key=None, ex_ids=None, ex_terms=None):
        pool = _filter_active_items(work_common.get(key) or [])
        if custom_key:
            pool += _filter_active_items(excerpt_tasks.get(custom_key) or [])
        elif key in excerpt_tasks:
            pool += _filter_active_items(excerpt_tasks.get(key) or [])
            
        if ex_ids or ex_terms:
            ex_ids = ex_ids or set()
            ex_terms = ex_terms or set()
            pool = [q for q in pool 
                    if str(q.get("id") or "").lower() not in ex_ids 
                    and not (set(_extract_term_tokens(q, "excl")) & ex_terms)]
        return pool

    return {
        "task1": get_b1_pool("task1", "customTask1", t1_ids, t1_terms),
        "task2": get_b1_pool("task2", "customTask2", t2_ids, t2_terms),
        "task3": get_b1_pool("task3", "customTask3", t3_ids, t3_terms),
        "task4_1": get_b1_pool("task4_1"),
        "task4_2": get_b1_pool("task4_2"),
        "task5": get_b1_pool("task5"),
    }

def apply_task1_filters(b1_pools: dict[str, list[dict[str, Any]]], task1_filters: dict[str, Any]) -> None:
    task1_filters = task1_filters or {}
    include_work = task1_filters.get("includeWorkQuestions", True)
    include_term = task1_filters.get("includeTermQuestions", True)
    if not (include_work and include_term):
        filtered_t1 = []
        for q in b1_pools.get("task1", []):
            q_has_term = bool(_extract_term_tokens(q, "task1"))
            if include_term and q_has_term:
                filtered_t1.append(q)
            elif include_work and not q_has_term:
                filtered_t1.append(q)
        if filtered_t1:
            b1_pools["task1"] = filtered_t1

def populate_block1(b1_pools: dict[str, list[dict[str, Any]]], work: dict[str, Any], excerpt_tasks: dict[str, Any], ctx: SelectionContext) -> dict[str, Any]:
    tasks = {}
    tasks["task1"] = _pick_best_from_pool(b1_pools["task1"], "task1", ctx)
        
    tasks["task2"] = _build_runtime_task2(work, _pick_best_from_pool(b1_pools["task2"], "task2", ctx), excerpt_tasks)
    tasks["task3"] = _pick_random(_build_runtime_two_gap_candidates(b1_pools["task3"], "task3", ctx))
    if tasks["task3"]: 
        ctx.add_question_tokens(tasks["task3"], "task3")
    tasks["task4_1"] = _pick_best_from_pool(b1_pools["task4_1"], "task4_1", ctx)
    tasks["task4_2"] = _pick_best_from_pool(b1_pools["task4_2"], "task4_2", ctx)
    tasks["task5"] = _pick_best_from_pool(b1_pools["task5"], "task5", ctx)
    return tasks

def populate_block2(poem_pools: dict[str, list[dict[str, Any]]], ctx: SelectionContext) -> dict[str, Any]:
    tasks = {}
    tasks["task6"] = _pick_random(_build_runtime_two_gap_candidates(poem_pools.get("task6") or [], "task6", ctx))
    if tasks["task6"]: ctx.add_question_tokens(tasks["task6"], "task6")
    tasks["task7"] = _pick_best_from_pool(poem_pools.get("task7") or [], "task7", ctx)
    
    task8_pool = poem_pools.get("task8") or []
    task8_no_conflict = [q for q in task8_pool if not _task8_has_term_conflict(q, ctx)]
    task8_pool_final = task8_no_conflict if task8_no_conflict else task8_pool
    tasks["task8"] = _pick_best_from_pool(task8_pool_final, "task8", ctx)
    if tasks["task8"]:
        tasks["task8Options"] = _build_task8_options(tasks["task8"], ctx)
        if isinstance(tasks["task8"], dict):
            tasks["task8"]["options"] = tasks["task8Options"]
        
    tasks["task9_1"] = _pick_best_from_pool(poem_pools.get("task9_1") or [], "task9_1", ctx)
    tasks["task9_2"] = _pick_best_from_pool(poem_pools.get("task9_2") or [], "task9_2", ctx)
    tasks["task10"] = _pick_best_from_pool(poem_pools.get("task10") or [], "task10", ctx)
    return tasks


# Maps each block3 slot index (0–4) to the block3_payload key(s) it draws from.
# Slots 1 and 2 (task11_2, task11_3) share a single pool.
_SLOT_POOL_KEYS: dict[int, list[str]] = {
    0: ["task11_1"],
    1: ["task11_2_3"],
    2: ["task11_2_3"],
    3: ["task11_4"],
    4: ["task11_5"],
}


def _build_slot_pool(
    block3_payload: dict[str, Any],
    slot_idx: int,
    rod: str,
) -> list[dict[str, Any]]:
    """Return active questions for *slot_idx* that match the given rod tag.

    Questions without any rod tag are treated as 'проза' (default).
    """
    pool: list[dict[str, Any]] = []
    for pool_key in _SLOT_POOL_KEYS[slot_idx]:
        pool += _filter_active_items(block3_payload.get(pool_key) or [])
    return [
        q for q in pool
        if rod in _extract_rod_tokens(q)
        or (not _extract_rod_tokens(q) and rod == "проза")
    ]


def _find_exclusive_slot_per_pool(
    block3_payload: dict[str, Any],
    rod_layout: list[str],
) -> int:
    """Find a slot where the per-slot pool actually contains an exclusive question
    for the assigned rod.  Falls back to a random slot if none qualify.
    """
    candidates = []
    for i, rod in enumerate(rod_layout):
        slot_pool = _build_slot_pool(block3_payload, i, rod)
        if any(_is_exclusive_question(q) for q in slot_pool):
            candidates.append(i)
    if candidates:
        import random
        return random.choice(candidates)
    import random
    return random.randint(0, len(rod_layout) - 1)


def populate_block3(block3_payload: dict[str, Any], ctx: SelectionContext, rod_layout: list[str] = None, pinned_tasks: dict[str, Any] = None) -> dict[str, Any]:
    tasks = {}
    rod_layout = rod_layout or _generate_rod_layout()
    pinned_tasks = pinned_tasks or {}

    # R15: Pre-add pinned tasks to ctx so they correctly exclude authors/themes from other slots.
    for key, task in pinned_tasks.items():
        if key in BLOCK11_KEYS and task:
            ctx.add_question_tokens(task, key)
            tasks[key] = task

    # Determine exclusive slot using per-slot pool visibility.
    exclusive_slot = _find_exclusive_slot_per_pool(block3_payload, rod_layout)

    for i, key in enumerate(BLOCK11_KEYS):
        if key in tasks:
            continue  # Already filled by pinned_tasks

        rod = rod_layout[i]
        # Primary pool: per-slot questions matching the assigned rod.
        slot_pool = _build_slot_pool(block3_payload, i, rod)

        if i == exclusive_slot:
            excl_pool = [q for q in slot_pool if _is_exclusive_question(q)]
            primary_pool = excl_pool if excl_pool else slot_pool
        else:
            primary_pool = [q for q in slot_pool if not _is_exclusive_question(q)]

        # _pick_best_from_pool internally calls ctx.add_question_tokens, which
        # prevents 11.2 and 11.3 (shared pool) from selecting the same question.
        tasks[key] = _pick_best_from_pool(primary_pool, key, ctx)

    tasks["_rodLayout"] = rod_layout
    tasks["_exclusiveSlot"] = exclusive_slot
    tasks["_rodLayoutStep"] = 0  # Reset step counter on fresh generation
    return tasks

