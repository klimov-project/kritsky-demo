from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from db.src.models import (
    KbAuthor, KbWork, KbExcerpt, KbPoem, KbTask, KbExcerptExclusion, KbSetting
)

def build_kb_payload_from_tables(session: Session) -> dict[str, Any]:
    """
    Reconstructs the monolithic JSON payload from the relational tables.
    Only includes is_active=True tasks.
    Returns:
        { "works": [...], "poets": [...], "block3": {...}, "settings": {...} }
    """
    
    # 1. Fetch all active tasks
    active_tasks = session.execute(
        select(KbTask).where(KbTask.is_active == True)
    ).scalars().all()
    
    # Organize tasks
    tasks_by_work: dict[int, dict[str, list[dict]]] = {}
    tasks_by_excerpt: dict[int, dict[str, list[dict]]] = {}
    tasks_by_poem: dict[int, dict[str, list[dict]]] = {}
    block3_tasks: dict[str, list[dict]] = {}
    
    for t in active_tasks:
        # Reconstruct raw task dict
        raw = dict(t.content)
        raw["id"] = t.external_id
        raw["isActive"] = t.is_active
        raw["termId"] = t.term_id
        raw["authorId"] = t.author_id_str
        raw["tags"] = t.tags
        raw["format"] = t.format
        
        t_type = t.task_type
        scope = t.scope
        
        # Common tasks attached to work
        if scope == "common" and t.work_id is not None and t.excerpt_id is None:
            w_tasks = tasks_by_work.setdefault(t.work_id, {})
            w_tasks.setdefault(t_type, []).append(raw)
            
        # Excerpt tasks
        elif scope == "excerpt" and t.excerpt_id is not None:
            e_tasks = tasks_by_excerpt.setdefault(t.excerpt_id, {})
            e_tasks.setdefault(t_type, []).append(raw)
            
        # Poem tasks
        elif scope == "poem" and t.poem_id is not None:
            p_tasks = tasks_by_poem.setdefault(t.poem_id, {})
            p_tasks.setdefault(t_type, []).append(raw)
            
        # Block 3
        elif t_type.startswith("task11"):
            # Map canonical type back to JSON keys
            json_key = t_type
            if t_type in ("task11_2", "task11_3"):
                json_key = "task11_2_3"
            block3_tasks.setdefault(json_key, []).append(raw)

    # 2. Fetch Authors
    authors = {a.id: {"id": a.external_id, "name": a.name} for a in session.execute(select(KbAuthor)).scalars().all()}
    
    # 3. Fetch Exclusions
    exclusions_by_excerpt: dict[int, list[dict]] = {}
    for ex in session.execute(select(KbExcerptExclusion)).scalars().all():
        exclusions_by_excerpt.setdefault(ex.excerpt_id, []).append({
            "type": ex.exclusion_type,
            "value": ex.excluded_value
        })

    # 4. Fetch Excerpts & Works
    works_list = []
    works_db = session.execute(select(KbWork)).scalars().all()
    for w in works_db:
        w_dict = {
            "id": w.external_id,
            "workId": w.work_code,
            "title": w.title,
            "authorId": authors[w.author_id]["id"] if w.author_id in authors else "",
            "author": authors[w.author_id]["name"] if w.author_id in authors else "",
            "age18": w.age18,
            "internalTags": w.internal_tags,
            "externalTags": w.external_tags,
            "excerpts": [],
            "commonTasks": tasks_by_work.get(w.id, {})
        }
        works_list.append(w_dict)
        
    works_by_id = {w.id: w_dict for w, w_dict in zip(works_db, works_list)}
    
    excerpts_db = session.execute(select(KbExcerpt)).scalars().all()
    for e in excerpts_db:
        if e.work_id not in works_by_id: continue
        e_dict = {
            "id": e.external_id,
            "title": e.title,
            "text": e.text,
            "exclusions": exclusions_by_excerpt.get(e.id, [])
        }
        # Add task slots to excerpt
        e_dict["tasks"] = tasks_by_excerpt.get(e.id, {})
        
        works_by_id[e.work_id]["excerpts"].append(e_dict)

    # 5. Fetch Poems & Poets
    poets_dict: dict[str, dict] = {}
    poems_db = session.execute(select(KbPoem)).scalars().all()
    for p in poems_db:
        if p.author_id not in authors: continue
        a_info = authors[p.author_id]
        if a_info["id"] not in poets_dict:
            poets_dict[a_info["id"]] = {
                "authorId": a_info["id"],
                "name": a_info["name"],
                "poems": []
            }
        
        poem_dict = {
            "id": p.external_id,
            "title": p.title,
            "text": p.text,
            "tasks": tasks_by_poem.get(p.id, {})
        }
        poets_dict[a_info["id"]]["poems"].append(poem_dict)
        
    poets_list = list(poets_dict.values())

    # 6. Fetch Settings
    settings_dict = {}
    for s in session.execute(select(KbSetting)).scalars().all():
        settings_dict[s.key] = s.payload

    return {
        "works": works_list,
        "poets": poets_list,
        "block3": block3_tasks,
        "settings": settings_dict
    }
