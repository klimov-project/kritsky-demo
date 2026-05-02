from typing import Any
import copy
import hashlib
import random

from .constants import ALL_TASK_KEYS, BLOCK11_KEYS
from .tokens import _filter_active_items, _extract_author_tokens, _extract_theme_tokens
from .context import SelectionContext, _pick_random, _pick_best_from_pool, _shuffle
from .blocks import build_block1_pools, apply_task1_filters, populate_block1, populate_block2, populate_block3
from .tasks import (
    _rotate_rod_layout,
    _build_runtime_task2,
    _build_runtime_two_gap_candidates,
    _task8_has_term_conflict,
    _build_task8_options,
    _is_exclusive_question,
    _group_pool_by_rod,
)
from .validator import evaluate_variant_rules2

def _resolve_by_id(items: list[dict[str, Any]], item_id: str) -> dict[str, Any] | None:
    if not item_id: return None
    for item in items:
        if str(item.get("id") or "") == item_id: return item
    return None


def _math_comb(n: int, k: int) -> int:
    if k < 0 or k > n: return 0
    if k == 0 or k == n: return 1
    if k > n // 2: k = n - k
    num = 1
    for i in range(k):
        num = num * (n - i) // (i + 1)
    return num


def _count_task8_variations(q: dict[str, Any]) -> int:
    if not q or not isinstance(q.get("options"), list): return 0
    options = [o for o in q["options"] if isinstance(o, dict) and o.get("isActive") is not False]
    correct = [o for o in options if o.get("isCorrect")]
    incorrect = [o for o in options if not o.get("isCorrect")]
    if not correct: return 0

    valid_pairs = []
    for nc in range(2, min(len(correct), 6) + 1):
        ni = 7 - nc
        if 1 <= ni <= 5:
            valid_pairs.append((nc, ni))
    if not valid_pairs:
        for nc in range(1, len(correct) + 1):
            ni = 7 - nc
            if ni >= 0:
                valid_pairs.append((nc, ni))

    total = 0
    for nc, ni in valid_pairs:
        total += _math_comb(len(correct), nc) * _math_comb(len(incorrect), ni)
    return total


def _compute_pool_sizes(variant: dict[str, Any], kb_payload: dict[str, Any]) -> dict[str, int]:
    """R15: Count available candidates for each task slot given the current variant.

    Builds a fresh context from all tasks in the variant and queries each
    pool the same way the generator does, returning the count of valid
    candidates. Two-gap slots (task3, task6) return the number of built pairs.
    Block-11 slots return the count per rod group.
    """
    from .context import _can_select_question
    from .tokens import _filter_active_items
    from .tasks import _build_runtime_two_gap_candidates, _task8_has_term_conflict, _is_exclusive_question, _group_pool_by_rod
    from .blocks import build_block1_pools, apply_task1_filters
    from .constants import BLOCK11_KEYS

    work = variant.get("work")
    excerpt = variant.get("excerpt")
    poet = variant.get("poet")
    poem = variant.get("poem")

    # Build a full ctx from the current variant
    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(work))
    ctx.used_author_tokens.update(_extract_author_tokens(poet))
    ctx.used_theme_tokens.update(_extract_theme_tokens(excerpt, "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(poem, "poem"))
    for key in ALL_TASK_KEYS:
        ctx.add_question_tokens(variant.get(key), key)

    sizes: dict[str, int] = {}

    # --- Block 1 ---
    if work and excerpt:
        excerpt_tasks = (excerpt.get("tasks") or {})
        b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
        for key in ("task1", "task4_1", "task4_2", "task5"):
            pool = b1_pools.get(key) or []
            sizes[key] = sum(1 for q in pool if _can_select_question(q, key, ctx))
        # task2: approximation — count raw candidates
        sizes["task2"] = sum(1 for q in (b1_pools.get("task2") or []) if _can_select_question(q, "task2", ctx))
        # task3: build pairs with blank excluded_ids, count results
        sizes["task3"] = len(_build_runtime_two_gap_candidates(b1_pools.get("task3") or [], "task3", ctx))

    # --- Block 2 ---
    if poem:
        poem_tasks = poem.get("tasks") or {}
        for key in ("task7", "task9_1", "task9_2", "task10"):
            pool = poem_tasks.get(key) or []
            sizes[key] = sum(1 for q in pool if _can_select_question(q, key, ctx))
        # task6: build pairs
        sizes["task6"] = len(_build_runtime_two_gap_candidates(poem_tasks.get("task6") or [], "task6", ctx))
        # task8: count total variations (combinations of options) across all valid questions
        task8_pool = poem_tasks.get("task8") or []
        t8_total = 0
        for q in task8_pool:
            if _can_select_question(q, "task8", ctx) and not _task8_has_term_conflict(q, ctx):
                t8_total += _count_task8_variations(q)
        
        if t8_total == 0:
            for q in task8_pool:
                if _can_select_question(q, "task8", ctx):
                    t8_total += _count_task8_variations(q)
        sizes["task8"] = t8_total

    # --- Block 3 ---
    block3_payload = kb_payload.get("block3") or {}
    b3_pool = (
        (block3_payload.get("task11_1") or []) +
        (block3_payload.get("task11_2_3") or []) +
        (block3_payload.get("task11_4") or []) +
        (block3_payload.get("task11_5") or [])
    )
    rod_layout = variant.get("_rodLayout") or []
    if rod_layout:
        rod_groups = _group_pool_by_rod(b3_pool)
        exclusive_slot = variant.get("_exclusiveSlot")
        for i, key in enumerate(BLOCK11_KEYS):
            rod = rod_layout[i] if i < len(rod_layout) else "проза"
            pool = rod_groups.get(rod) or []
            if i == exclusive_slot:
                pool = [q for q in pool if _is_exclusive_question(q)]
            else:
                pool = [q for q in pool if not _is_exclusive_question(q)]
            sizes[key] = sum(1 for q in pool if _can_select_question(q, key, ctx))
    else:
        for key in BLOCK11_KEYS:
            sizes[key] = 0

    return sizes

def generate_variant_runtime2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    works = _filter_active_items(kb_payload.get("works") or [])
    poets = _filter_active_items(kb_payload.get("poets") or [])
    block3 = kb_payload.get("block3") or {}
    use_selected = bool(payload.get("useSelected", True))
    
    # Core Selection (Work/Excerpt and Poet/Poem)
    work, excerpt = None, None
    if use_selected:
        work = _resolve_by_id(works, payload.get("workId"))
        if work:
            excerpt = _resolve_by_id(_filter_active_items(work.get("excerpts") or []), payload.get("excerptId"))
            if not excerpt: excerpt = _pick_random(_filter_active_items(work.get("excerpts") or []))
    
    if not work or not excerpt:
        work = _pick_random(works)
        excerpt = _pick_random(_filter_active_items(work.get("excerpts") or [])) if work else None

    poet, poem = None, None
    if use_selected:
        poet = _resolve_by_id(poets, payload.get("poetId"))
        if poet:
            poem = _resolve_by_id(_filter_active_items(poet.get("poems") or []), payload.get("poemId"))
            if not poem: poem = _pick_random(_filter_active_items(poet.get("poems") or []))
            
            # Retry randomly if no tasks
            if poem:
                p_tasks = poem.get("tasks") or {}
                if not all(p_tasks.get(k) for k in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]):
                    poet, poem = None, None
    
    if not poet or not poem:
        excerpt_authors = set(_extract_author_tokens(work)) if work else set()
        excerpt_themes = set(_extract_theme_tokens(excerpt, "excerpt")) if excerpt else set()
        
        possible_poets = _shuffle(poets)
        best_poet, best_poem = None, None
        min_theme_overlap = 999
        
        for p_poet in possible_poets:
            p_authors = set(_extract_author_tokens(p_poet))
            if p_authors & excerpt_authors:
                continue
                
            possible_poems = _shuffle(_filter_active_items(p_poet.get("poems") or []))
            for p_poem in possible_poems:
                p_tasks = p_poem.get("tasks") or {}
                if not all(p_tasks.get(k) for k in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]):
                    continue
                    
                p_themes = set(_extract_theme_tokens(p_poem, "poem"))
                overlap = len(p_themes & excerpt_themes)
                
                if overlap == 0:
                    poet, poem = p_poet, p_poem
                    break
                elif overlap < min_theme_overlap:
                    min_theme_overlap = overlap
                    best_poet, best_poem = p_poet, p_poem
            if poet: break
            
        if not poet and best_poet:
            poet, poem = best_poet, best_poem
            
        if not poet:
            valid_poets = []
            for p in poets:
                for pm in _filter_active_items(p.get("poems") or []):
                    pm_tasks = pm.get("tasks") or {}
                    if all(pm_tasks.get(k) for k in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]):
                        valid_poets.append((p, pm))
            if valid_poets:
                poet, poem = _pick_random(valid_poets)
            else:
                poet = _pick_random(poets)
                poem = _pick_random(_filter_active_items(poet.get("poems") or [])) if poet else None

    if not work or not excerpt or not poet or not poem:
        return {"variant": {}, "evaluation": {"ok": False, "error": "Missing core items"}}

    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(work))
    ctx.used_author_tokens.update(_extract_author_tokens(poet))
    ctx.used_theme_tokens.update(_extract_theme_tokens(excerpt, "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(poem, "poem"))
    
    excerpt_tasks = excerpt.get("tasks") or {}
    b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
    
    apply_task1_filters(b1_pools, payload.get("task1Filters"))
    
    tasks1 = populate_block1(b1_pools, work, excerpt_tasks, ctx)
    tasks2 = populate_block2(poem.get("tasks") or {}, ctx)
    tasks3 = populate_block3(block3, ctx)
    
    variant = {
        **tasks1, **tasks2, **tasks3,
        "work": work, "excerpt": excerpt, "poet": poet, "poem": poem,
    }
    pool_sizes = _compute_pool_sizes(variant, kb_payload)
    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant), "pool_sizes": pool_sizes}

def refresh_block_runtime2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    variant = payload.get("variant")
    block_type = payload.get("block")
    if not variant or not block_type: return {"error": "Missing variant or block"}
    
    if block_type == "block3":
        return refresh_all_block11_runtime2(kb_payload, payload)
        
    block1_keys = ["task1", "task2", "task3", "task4_1", "task4_2", "task5"]
    block2_keys = ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]
    target_keys = block1_keys if block_type == "block1" else block2_keys
    
    works = _filter_active_items(kb_payload.get("works") or [])
    poets = _filter_active_items(kb_payload.get("poets") or [])

    v_work, v_excerpt, v_poet, v_poem = variant.get("work"), variant.get("excerpt"), variant.get("poet"), variant.get("poem")

    work = _resolve_by_id(works, payload.get("selectedWorkId")) or v_work
    excerpt = None
    if work:
        excerpt = _resolve_by_id(_filter_active_items(work.get("excerpts") or []), payload.get("selectedExcerptId"))
        if not excerpt and v_work and str(work.get("id")) == str(v_work.get("id")):
            excerpt = v_excerpt
        if not excerpt:
            excerpt = _pick_random(_filter_active_items(work.get("excerpts") or []))

    poet = _resolve_by_id(poets, payload.get("selectedPoetId")) or v_poet
    poem = None
    if poet:
        poem = _resolve_by_id(_filter_active_items(poet.get("poems") or []), payload.get("selectedPoemId"))
        if not poem and v_poet and str(poet.get("id")) == str(v_poet.get("id")):
            poem = v_poem
        if not poem:
            poem = _pick_random(_filter_active_items(poet.get("poems") or []))

    if not work or not excerpt or not poet or not poem:
        return {"error": "Failed to resolve core items for refresh"}

    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(work))
    ctx.used_author_tokens.update(_extract_author_tokens(poet))
    ctx.used_theme_tokens.update(_extract_theme_tokens(excerpt, "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(poem, "poem"))
    
    for key in ALL_TASK_KEYS:
        if key not in target_keys:
            ctx.add_question_tokens(variant.get(key), key)
            
    if block_type == "block1":
        excerpt_tasks = excerpt.get("tasks") or {}
        b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
        apply_task1_filters(b1_pools, payload.get("task1Filters") or variant.get("task1Filters"))
        tasks = populate_block1(b1_pools, work, excerpt_tasks, ctx)
        variant.update(tasks)
        variant["work"] = work
        variant["excerpt"] = excerpt
        
    elif block_type == "block2":
        tasks = populate_block2(poem.get("tasks") or {}, ctx)
        variant.update(tasks)
        variant["poet"] = poet
        variant["poem"] = poem
        
    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant), "pool_sizes": _compute_pool_sizes(variant, kb_payload)}

def refresh_all_block11_runtime2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    variant = payload.get("variant")
    if not variant: return {"error": "Missing variant"}
    
    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("work")))
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("poet")))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("excerpt"), "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("poem"), "poem"))
    
    for key in ALL_TASK_KEYS:
        if key not in BLOCK11_KEYS:
            ctx.add_question_tokens(variant.get(key), key)
            
    old_layout = variant.get("_rodLayout") or []
    new_layout = _rotate_rod_layout(old_layout)
    
    tasks = populate_block3(kb_payload.get("block3") or {}, ctx, new_layout)
    variant.update(tasks)
    
    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant), "pool_sizes": _compute_pool_sizes(variant, kb_payload)}


def refresh_task_runtime2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    """Refresh a single task slot using the current variant as constraint context.

    R14: Each task key is handled by its own isolated builder call so the ctx
    stays clean — only the already-selected tasks in the variant contribute
    constraints, not intermediate picks from a full populate_block pass.
    """
    variant = payload.get("variant")
    task_key = payload.get("taskKey")
    if not variant or not task_key: return {"error": "Missing variant or taskKey"}

    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("work")))
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("poet")))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("excerpt"), "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("poem"), "poem"))

    # Load constraints from every other slot in the current variant
    for key in ALL_TASK_KEYS:
        if key != task_key:
            ctx.add_question_tokens(variant.get(key), key)

    work = variant.get("work")
    excerpt = variant.get("excerpt")
    poem = variant.get("poem")

    # IDs to skip (already seen in this refresh cycle, from cycleHistory on the frontend)
    excluded_ids: set[str] = {str(i) for i in (payload.get("excludedTaskIds") or [])}

    # --- Block 1 tasks ---
    if task_key in ("task1", "task2", "task3", "task4_1", "task4_2", "task5"):
        excerpt_tasks = (excerpt.get("tasks") or {}) if excerpt else {}
        b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
        apply_task1_filters(b1_pools, payload.get("task1Filters") or variant.get("task1Filters"))

        if task_key == "task1":
            variant["task1"] = _pick_best_from_pool(b1_pools["task1"], "task1", ctx, excluded_ids)

        elif task_key == "task2":
            raw = _pick_best_from_pool(b1_pools["task2"], "task2", ctx, excluded_ids)
            variant["task2"] = _build_runtime_task2(work, raw, excerpt_tasks)

        elif task_key == "task3":
            candidates = _build_runtime_two_gap_candidates(
                b1_pools["task3"], "task3", ctx, excluded_ids,
            )
            new_task = _pick_random(candidates)
            if new_task:
                ctx.add_question_tokens(new_task, "task3")
            variant["task3"] = new_task

        elif task_key in ("task4_1", "task4_2", "task5"):
            variant[task_key] = _pick_best_from_pool(b1_pools[task_key], task_key, ctx, excluded_ids)

    # --- Block 2 tasks ---
    elif task_key in ("task6", "task7", "task8", "task9_1", "task9_2", "task10"):
        poem_tasks = (poem.get("tasks") or {}) if poem else {}

        if task_key == "task6":
            candidates = _build_runtime_two_gap_candidates(
                poem_tasks.get("task6") or [], "task6", ctx, excluded_ids,
            )
            new_task = _pick_random(candidates)
            if new_task:
                ctx.add_question_tokens(new_task, "task6")
            variant["task6"] = new_task

        elif task_key == "task7":
            variant["task7"] = _pick_best_from_pool(poem_tasks.get("task7") or [], "task7", ctx, excluded_ids)

        elif task_key == "task8":
            task8_pool = poem_tasks.get("task8") or []
            task8_no_conflict = [q for q in task8_pool if not _task8_has_term_conflict(q, ctx)]
            task8_pool_final = task8_no_conflict if task8_no_conflict else task8_pool
            
            # R14 Fix: Task 8 has combinatorial variations. We don't exclude the question ID entirely,
            # but we try to pick a variation (Question+OptionsHash) that isn't in excluded_ids.
            new_task = None
            for _ in range(10):
                # We pass None to _pick_best_from_pool to not exclude question IDs, 
                # as variations are what matters here.
                candidate = _pick_best_from_pool(task8_pool_final, "task8", ctx, None)
                if not candidate: break
                
                # Copy to avoid mutating the pool items
                candidate = copy.deepcopy(candidate)
                options = _build_task8_options(candidate, ctx)
                
                # Check if this specific variation (with its new composite ID) is excluded
                if str(candidate.get("id") or "") not in excluded_ids:
                    candidate["options"] = options
                    variant["task8"] = candidate
                    variant["task8Options"] = options
                    new_task = candidate
                    break
            
            if not new_task:
                # Fallback: if we couldn't find a new variation after 10 tries,
                # just pick anything (or we could return None to show exhaustion)
                variant["task8"] = _pick_best_from_pool(task8_pool_final, "task8", ctx, excluded_ids)
                if variant["task8"]:
                    variant["task8Options"] = _build_task8_options(variant["task8"], ctx)
                    if isinstance(variant["task8"], dict):
                        variant["task8"]["options"] = variant["task8Options"]

        elif task_key in ("task9_1", "task9_2", "task10"):
            variant[task_key] = _pick_best_from_pool(poem_tasks.get(task_key) or [], task_key, ctx, excluded_ids)

    # --- Block 3 tasks ---
    elif task_key in BLOCK11_KEYS:
        rod_layout = variant.get("_rodLayout") or []
        if not rod_layout:
            tasks = populate_block3(kb_payload.get("block3") or {}, ctx)
            variant.update(tasks)
        else:
            tasks = populate_block3(kb_payload.get("block3") or {}, ctx, rod_layout)
            variant[task_key] = tasks[task_key]

    return {
        "variant": variant,
        "evaluation": evaluate_variant_rules2(variant),
        "pool_sizes": _compute_pool_sizes(variant, kb_payload)
    }


def generate_block_standalone2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    """Generate a single block (block1, block2, or block3) independently.
    
    Useful for training or building variants piece by piece.
    """
    block_type = payload.get("block")
    if not block_type: return {"error": "Missing block type"}
    
    ctx = SelectionContext()
    
    if block_type == "block1":
        works = _filter_active_items(kb_payload.get("works") or [])
        work = _resolve_by_id(works, payload.get("workId")) or _pick_random(works)
        if not work: return {"error": "No works available"}
        
        excerpts = _filter_active_items(work.get("excerpts") or [])
        excerpt = _resolve_by_id(excerpts, payload.get("excerptId")) or _pick_random(excerpts)
        if not excerpt: return {"error": "No excerpts available for selected work"}
        
        ctx.used_author_tokens.update(_extract_author_tokens(work))
        ctx.used_theme_tokens.update(_extract_theme_tokens(excerpt, "excerpt"))
        
        excerpt_tasks = excerpt.get("tasks") or {}
        b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
        apply_task1_filters(b1_pools, payload.get("task1Filters"))
        
        tasks = populate_block1(b1_pools, work, excerpt_tasks, ctx)
        return {"tasks": tasks, "work": work, "excerpt": excerpt}
        
    elif block_type == "block2":
        poets = _filter_active_items(kb_payload.get("poets") or [])
        poet, poem = None, None
        
        poet_id = payload.get("poetId")
        poem_id = payload.get("poemId")
        
        if poet_id:
            poet = _resolve_by_id(poets, poet_id)
            if poet:
                poem = _resolve_by_id(_filter_active_items(poet.get("poems") or []), poem_id)
                if not poem: poem = _pick_random(_filter_active_items(poet.get("poems") or []))
        
        if not poet or not poem:
            # Pick random with tasks
            possible_poets = _shuffle(poets)
            for p_poet in possible_poets:
                possible_poems = _shuffle(_filter_active_items(p_poet.get("poems") or []))
                for p_poem in possible_poems:
                    p_tasks = p_poem.get("tasks") or {}
                    if any(p_tasks.get(k) for k in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]):
                        poet, poem = p_poet, p_poem
                        break
                if poet: break
        
        if not poet or not poem: return {"error": "No poems with tasks available"}
        
        ctx.used_author_tokens.update(_extract_author_tokens(poet))
        ctx.used_theme_tokens.update(_extract_theme_tokens(poem, "poem"))
        
        tasks = populate_block2(poem.get("tasks") or {}, ctx)
        return {"tasks": tasks, "poet": poet, "poem": poem}
        
    elif block_type == "block3":
        block3_payload = kb_payload.get("block3") or {}
        tasks = populate_block3(block3_payload, ctx)
        return {"tasks": tasks}
        
    return {"error": f"Invalid block type: {block_type}"}
