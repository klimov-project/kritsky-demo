import json
import logging
from typing import Any
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from db.src.models import (
    KbAuthor, KbWork, KbExcerpt, KbPoem, KbTask, KbExcerptExclusion
)

_logger = logging.getLogger(__name__)

def sync_kb_payload_to_tables(payload: dict[str, Any], session: Session) -> None:
    """
    Synchronizes the monolithic KB JSON payload into the relational tables.
    Implements an upsert/versioning strategy.
    """
    works_data = payload.get("works", [])
    poets_data = payload.get("poets", [])
    block3_data = payload.get("block3", {})

    # Existing entities mapping
    existing_authors = {r[0]: r[1] for r in session.execute(select(KbAuthor.external_id, KbAuthor.id)).all()}
    existing_works = {r[0]: r[1] for r in session.execute(select(KbWork.external_id, KbWork.id)).all()}
    existing_excerpts = {r[0]: r[1] for r in session.execute(select(KbExcerpt.external_id, KbExcerpt.id)).all()}
    existing_poems = {r[0]: r[1] for r in session.execute(select(KbPoem.external_id, KbPoem.id)).all()}
    
    # For tasks, we need their latest version (even if inactive) to determine next version
    from sqlalchemy import func
    latest_tasks = {}
    
    subq = select(
        KbTask.external_id, func.max(KbTask.version).label("max_v")
    ).group_by(KbTask.external_id).subquery()
    
    latest_query = select(KbTask).join(
        subq,
        (KbTask.external_id == subq.c.external_id) & (KbTask.version == subq.c.max_v)
    )
    for task_obj in session.execute(latest_query).scalars().all():
        latest_tasks[task_obj.external_id] = task_obj

    # 1. Authors
    seen_author_ids = set()
    for w in works_data:
        aid = w.get("authorId", "")
        if aid and aid not in seen_author_ids:
            seen_author_ids.add(aid)
            if aid not in existing_authors:
                author = KbAuthor(external_id=aid, name=w.get("author", aid))
                session.add(author)
                session.flush()
                existing_authors[aid] = author.id

    for p in poets_data:
        aid = p.get("authorId", "")
        if aid and aid not in seen_author_ids:
            seen_author_ids.add(aid)
            if aid not in existing_authors:
                author = KbAuthor(external_id=aid, name=p.get("name", aid))
                session.add(author)
                session.flush()
                existing_authors[aid] = author.id

    # 2. Works
    for w in works_data:
        ext_id = w.get("id", "")
        if not ext_id: continue
        if ext_id not in existing_works:
            work = KbWork(
                external_id=ext_id,
                work_code=w.get("workId", ""),
                author_id=existing_authors.get(w.get("authorId", "")),
                title=w.get("title", ""),
                age18=bool(w.get("age18", False)),
                internal_tags=w.get("internalTags", ""),
                external_tags=w.get("externalTags", ""),
            )
            session.add(work)
            session.flush()
            existing_works[ext_id] = work.id
        else:
            # Update existing work if needed (simplified: just update fields)
            session.execute(
                update(KbWork).where(KbWork.id == existing_works[ext_id]).values(
                    work_code=w.get("workId", ""),
                    author_id=existing_authors.get(w.get("authorId", "")),
                    title=w.get("title", ""),
                    age18=bool(w.get("age18", False)),
                    internal_tags=w.get("internalTags", ""),
                    external_tags=w.get("externalTags", ""),
                )
            )

    # 3. Excerpts
    for w in works_data:
        for exc in w.get("excerpts", []):
            ext_id = exc.get("id", "")
            if not ext_id: continue
            if ext_id not in existing_excerpts:
                excerpt = KbExcerpt(
                    external_id=ext_id,
                    work_id=existing_works.get(w.get("id", "")),
                    title=exc.get("title", ""),
                    text=exc.get("text", ""),
                )
                session.add(excerpt)
                session.flush()
                existing_excerpts[ext_id] = excerpt.id
            else:
                session.execute(
                    update(KbExcerpt).where(KbExcerpt.id == existing_excerpts[ext_id]).values(
                        title=exc.get("title", ""),
                        text=exc.get("text", "")
                    )
                )

    # 4. Poems
    for p in poets_data:
        for poem_data in p.get("poems", []):
            ext_id = poem_data.get("id", "")
            if not ext_id: continue
            if ext_id not in existing_poems:
                poem = KbPoem(
                    external_id=ext_id,
                    author_id=existing_authors.get(p.get("authorId", "")),
                    title=poem_data.get("title", ""),
                    text=poem_data.get("text", ""),
                )
                session.add(poem)
                session.flush()
                existing_poems[ext_id] = poem.id
            else:
                session.execute(
                    update(KbPoem).where(KbPoem.id == existing_poems[ext_id]).values(
                        title=poem_data.get("title", ""),
                        text=poem_data.get("text", "")
                    )
                )

    # 5. Tasks
    # Collect all tasks from payload
    payload_tasks = []

    # Block 1, 2
    for w in works_data:
        w_db_id = existing_works.get(w.get("id", ""))
        for exc in w.get("excerpts", []):
            exc_db_id = existing_excerpts.get(exc.get("id", ""))
            etasks = exc.get("tasks", {})
            for t1 in etasks.get("task1", []): payload_tasks.append((t1, "task1", "excerpt", w_db_id, exc_db_id, None))
            for t2 in etasks.get("task2", []): payload_tasks.append((t2, "task2", "excerpt", w_db_id, exc_db_id, None))
            for t3 in etasks.get("task3", []): payload_tasks.append((t3, "task3", "excerpt", w_db_id, exc_db_id, None))
            for t4_1 in etasks.get("task4_1", []): payload_tasks.append((t4_1, "task4_1", "excerpt", w_db_id, exc_db_id, None))
            for t4_2 in etasks.get("task4_2", []): payload_tasks.append((t4_2, "task4_2", "excerpt", w_db_id, exc_db_id, None))
            for t5 in etasks.get("task5", []): payload_tasks.append((t5, "task5", "excerpt", w_db_id, exc_db_id, None))
            
        common = w.get("commonTasks", {})
        for t1 in common.get("task1", []): payload_tasks.append((t1, "task1", "common", w_db_id, None, None))
        for t2 in common.get("task2", []): payload_tasks.append((t2, "task2", "common", w_db_id, None, None))
        for t3 in common.get("task3", []): payload_tasks.append((t3, "task3", "common", w_db_id, None, None))

    # Block 3
    for json_key, b3_list in block3_data.items():
        for t in b3_list:
            t_type = "task11_1"
            if json_key == "task11_2_3":
                t_type = "task11_2" # canonicalize
            elif json_key in ("task11_1", "task11_4", "task11_5"):
                t_type = json_key
                
            payload_tasks.append((t, t_type, "block3", None, None, None))

    # Poems (task 7, 8, 9_1, 9_2, 10)
    for p in poets_data:
        for poem_data in p.get("poems", []):
            poem_db_id = existing_poems.get(poem_data.get("id", ""))
            ptasks = poem_data.get("tasks", {})
            for t in ptasks.get("task6", []): payload_tasks.append((t, "task6", "poem", None, None, poem_db_id))
            for t in ptasks.get("task7", []): payload_tasks.append((t, "task7", "poem", None, None, poem_db_id))
            for t in ptasks.get("task8", []): payload_tasks.append((t, "task8", "poem", None, None, poem_db_id))
            for t in ptasks.get("task9_1", []): payload_tasks.append((t, "task9_1", "poem", None, None, poem_db_id))
            for t in ptasks.get("task9_2", []): payload_tasks.append((t, "task9_2", "poem", None, None, poem_db_id))
            for t in ptasks.get("task10", []): payload_tasks.append((t, "task10", "poem", None, None, poem_db_id))

    seen_task_ids = set()
    for t_data, t_type, scope, work_id, excerpt_id, poem_id in payload_tasks:
        ext_id = t_data.get("id", "")
        if not ext_id: continue
        if ext_id in seen_task_ids: continue
        seen_task_ids.add(ext_id)
        
        content = {k: v for k, v in t_data.items() if k not in ["id", "isActive", "termId", "authorId", "tags"]}
        
        if ext_id in latest_tasks:
            curr = latest_tasks[ext_id]
            # Check if changed
            changed = False
            if curr.content != content: changed = True
            if curr.task_type != t_type: changed = True
            if curr.scope != scope: changed = True
            if curr.tags != t_data.get("tags", ""): changed = True
            if curr.work_id != work_id: changed = True
            if curr.excerpt_id != excerpt_id: changed = True
            if curr.poem_id != poem_id: changed = True
            
            if changed:
                if t_type.startswith("task11"):
                    print(f"Updating block3 task {ext_id} to scope {scope}, old scope: {curr.scope}")
                # Deactivate old, insert new version
                curr.is_active = False
                new_task = KbTask(
                    external_id=ext_id,
                    version=curr.version + 1,
                    task_type=t_type,
                    format=t_data.get("format", "unknown"),
                    scope=scope,
                    tags=t_data.get("tags", ""),
                    author_id_str=str(t_data.get("authorId", "") or ""),
                    term_id=str(t_data.get("termId", "") or ""),
                    content=content,
                    work_id=work_id,
                    excerpt_id=excerpt_id,
                    poem_id=poem_id,
                    is_active=True
                )
                session.add(new_task)
            elif curr.is_active == False:
                # If it was inactive but hasn't changed, reactivate it? Or insert a new version to be safe?
                # Best is to just reactivate the latest version.
                curr.is_active = True
        else:
            # New task
            new_task = KbTask(
                external_id=ext_id,
                version=1,
                task_type=t_type,
                format=t_data.get("format", "unknown"),
                scope=scope,
                tags=t_data.get("tags", ""),
                author_id_str=str(t_data.get("authorId", "") or ""),
                term_id=str(t_data.get("termId", "") or ""),
                content=content,
                work_id=work_id,
                excerpt_id=excerpt_id,
                poem_id=poem_id,
                is_active=True
            )
            session.add(new_task)

    # Soft delete tasks that are in DB but no longer in JSON
    for ext_id, curr in latest_tasks.items():
        if ext_id not in seen_task_ids:
            curr.is_active = False

    session.flush()

    # 6. Exclusions (Sync exactly)
    # First delete all exclusions
    session.execute(KbExcerptExclusion.__table__.delete())
    
    # Re-insert
    seen_exclusions = set()
    for w in works_data:
        for exc in w.get("excerpts", []):
            ext_id = exc.get("id", "")
            if not ext_id: continue
            exc_db_id = existing_excerpts.get(ext_id)
            if not exc_db_id: continue

            exc_list = exc.get("exclusions", [])
            for excl in exc_list:
                ctype = excl.get("type", "")
                cval = excl.get("value", "")
                if not ctype or not cval: continue
                key = (exc_db_id, ctype, cval)
                if key not in seen_exclusions:
                    seen_exclusions.add(key)
                    ex = KbExcerptExclusion(excerpt_id=exc_db_id, exclusion_type=ctype, excluded_value=cval)
                    session.add(ex)

    # 7. KbSettings
    settings = payload.get("settings", {})
    from db.src.models import KbSetting
    for key, value in settings.items():
        # Upsert
        setting = session.get(KbSetting, key)
        if setting:
            setting.payload = value
        else:
            session.add(KbSetting(key=key, payload=value))

