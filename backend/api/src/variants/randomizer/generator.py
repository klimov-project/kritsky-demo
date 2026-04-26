from typing import Any

from .constants import ALL_TASK_KEYS, BLOCK11_KEYS
from .tokens import _filter_active_items, _extract_author_tokens, _extract_theme_tokens
from .context import SelectionContext, _pick_random, _shuffle
from .blocks import build_block1_pools, apply_task1_filters, populate_block1, populate_block2, populate_block3
from .tasks import _rotate_rod_layout
from .validator import evaluate_variant_rules2

def _resolve_by_id(items: list[dict[str, Any]], item_id: str) -> dict[str, Any] | None:
    if not item_id: return None
    for item in items:
        if str(item.get("id") or "") == item_id: return item
    return None

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
                if not any(p_tasks.get(k) for k in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]):
                    poet, poem = None, None
    
    if not poet or not poem:
        possible_poets = _shuffle(poets)
        for p_poet in possible_poets:
            possible_poems = _shuffle(_filter_active_items(p_poet.get("poems") or []))
            for p_poem in possible_poems:
                p_tasks = p_poem.get("tasks") or {}
                if any(p_tasks.get(k) for k in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]):
                    poet, poem = p_poet, p_poem
                    break
            if poet: break
        
        if not poet:
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
    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant)}

def refresh_block_runtime2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    variant = payload.get("variant")
    block_type = payload.get("block")
    if not variant or not block_type: return {"error": "Missing variant or block"}
    
    if block_type == "block3":
        return refresh_all_block11_runtime2(kb_payload, payload)
        
    block1_keys = ["task1", "task2", "task3", "task4_1", "task4_2", "task5"]
    block2_keys = ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]
    target_keys = block1_keys if block_type == "block1" else block2_keys
    
    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("work")))
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("poet")))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("excerpt"), "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("poem"), "poem"))
    
    for key in ALL_TASK_KEYS:
        if key not in target_keys:
            ctx.add_question_tokens(variant.get(key), key)
            
    work, excerpt, poem = variant.get("work"), variant.get("excerpt"), variant.get("poem")
    
    if block_type == "block1":
        excerpt_tasks = excerpt.get("tasks") or {}
        b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
        apply_task1_filters(b1_pools, payload.get("task1Filters") or variant.get("task1Filters"))
        tasks = populate_block1(b1_pools, work, excerpt_tasks, ctx)
        variant.update(tasks)
        
    elif block_type == "block2":
        tasks = populate_block2(poem.get("tasks") or {}, ctx)
        variant.update(tasks)
        
    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant)}

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
    
    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant)}

def refresh_task_runtime2(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    variant = payload.get("variant")
    task_key = payload.get("taskKey")
    if not variant or not task_key: return {"error": "Missing variant or taskKey"}
    
    ctx = SelectionContext()
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("work")))
    ctx.used_author_tokens.update(_extract_author_tokens(variant.get("poet")))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("excerpt"), "excerpt"))
    ctx.used_theme_tokens.update(_extract_theme_tokens(variant.get("poem"), "poem"))
    
    for key in ALL_TASK_KEYS:
        if key != task_key: ctx.add_question_tokens(variant.get(key), key)
        
    work, excerpt, poem = variant.get("work"), variant.get("excerpt"), variant.get("poem")
    
    # We use build_block1_pools and populate_block1 to get the specific task
    if task_key in ["task1", "task2", "task3", "task4_1", "task4_2", "task5"]:
        excerpt_tasks = excerpt.get("tasks") or {}
        b1_pools = build_block1_pools(work, excerpt_tasks, kb_payload)
        apply_task1_filters(b1_pools, payload.get("task1Filters") or variant.get("task1Filters"))
        tasks = populate_block1(b1_pools, work, excerpt_tasks, ctx)
        variant[task_key] = tasks[task_key]
        
    elif task_key in ["task6", "task7", "task8", "task9_1", "task9_2", "task10"]:
        tasks = populate_block2(poem.get("tasks") or {}, ctx)
        variant[task_key] = tasks[task_key]
        if task_key == "task8":
            variant["task8Options"] = tasks.get("task8Options", [])
            
    elif task_key in BLOCK11_KEYS:
        rod_layout = variant.get("_rodLayout") or []
        if not rod_layout:
            tasks = populate_block3(kb_payload.get("block3") or {}, ctx)
            variant.update(tasks)
        else:
            tasks = populate_block3(kb_payload.get("block3") or {}, ctx, rod_layout)
            variant[task_key] = tasks[task_key]

    return {"variant": variant, "evaluation": evaluate_variant_rules2(variant)}


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
