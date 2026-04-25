"""
Скрипт миграции данных из knowledge_base_state.payload в новые версионированные таблицы.

Использование:
    docker compose exec backend python -m scripts.migrate_kb_to_tables

Идемпотентный: можно запускать повторно. Существующие записи пропускаются по external_id.
"""
from __future__ import annotations

import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select, text
from db.src.connect import init_session
from db.src.models import (
    KnowledgeBaseState,
    KbAuthor,
    KbWork,
    KbExcerpt,
    KbPoem,
    KbTask,
    KbExcerptExclusion,
)

# ---------------------------------------------------------------------------
# Format classification
# ---------------------------------------------------------------------------

TASK_TYPE_FORMAT = {
    "task1": "short_answer",
    "task2": "match",
    "task3": "two_gap",
    "customTask1": "short_answer",
    "customTask2": "match",
    "customTask3": "two_gap",
    "task4_1": "essay",
    "task4_2": "essay",
    "task5": "essay",
    "task6": "two_gap",
    "task7": "short_answer",
    "task8": "multi_choice",
    "task9_1": "essay",
    "task9_2": "essay",
    "task10": "essay",
    "task11_1": "essay_block3",
    "task11_2_3": "essay_block3",
    "task11_4": "essay_block3",
    "task11_5": "essay_block3",
}

# Fields that go into content JSONB (everything else is a metadata column)
METADATA_FIELDS = {"id", "termId", "authorId", "tags", "isActive"}


def _build_content(task_type: str, raw: dict) -> dict:
    """Extract content fields from raw task dict, excluding metadata columns."""
    fmt = TASK_TYPE_FORMAT.get(task_type, "unknown")

    if fmt == "short_answer":
        return {
            k: raw[k] for k in ("text", "answer", "isTermQuestion")
            if k in raw
        }
    elif fmt == "two_gap":
        content = {}
        for k in ("part1", "part2", "answer1", "answer2", "termId1", "termId2", "withoutAuthor"):
            if k in raw:
                content[k] = raw[k]
        return content
    elif fmt == "match":
        content = {}
        for k in ("prompt", "leftLabel", "rightLabel", "pairs", "extraOption",
                   "characterSource", "pairPropertyType", "characterCount"):
            if k in raw:
                content[k] = raw[k]
        return content
    elif fmt == "multi_choice":
        content = {}
        for k in ("prompt", "options"):
            if k in raw:
                content[k] = raw[k]
        return content
    elif fmt == "essay":
        content = {}
        for k in ("text", "theme1Id", "theme2Id", "similarityId",
                   "themeInternalId", "publicId"):
            if k in raw:
                content[k] = raw[k]
        return content
    elif fmt == "essay_block3":
        content = {}
        for k in ("text", "workId", "authorId", "authorIds", "rodId",
                   "questionId", "special", "themeInternalId", "publicId"):
            if k in raw:
                content[k] = raw[k]
        return content
    else:
        # Fallback: store everything except metadata
        return {k: v for k, v in raw.items() if k not in METADATA_FIELDS}


def _scope_for_task_type(task_type: str) -> str:
    if task_type in ("task1", "task2", "task3"):
        return "common"
    if task_type.startswith("customTask") or task_type in ("task4_1", "task4_2", "task5"):
        return "excerpt"
    if task_type in ("task6", "task7", "task8", "task9_1", "task9_2", "task10"):
        return "poem"
    if task_type.startswith("task11"):
        return "block3"
    return "unknown"


def _canonical_task_type(task_type: str) -> str:
    """Map customTask* to their canonical task_type for the slot."""
    mapping = {
        "customTask1": "task1",
        "customTask2": "task2",
        "customTask3": "task3",
    }
    return mapping.get(task_type, task_type)


def run():
    with init_session() as session:
        # Load KB payload
        state = session.get(KnowledgeBaseState, 1)
        if state is None:
            print("ERROR: No KnowledgeBaseState with id=1 found.")
            return

        kb = state.payload
        if not kb:
            print("ERROR: KnowledgeBaseState payload is empty.")
            return

        works_data = [w for w in (kb.get("works") or []) if isinstance(w, dict)]
        poets_data = [p for p in (kb.get("poets") or []) if isinstance(p, dict)]
        block3_data = kb.get("block3") or {}

        # Track existing external_ids to make script idempotent
        existing_authors = {
            r[0] for r in session.execute(select(KbAuthor.external_id)).all()
        }
        existing_works = {
            r[0] for r in session.execute(select(KbWork.external_id)).all()
        }
        existing_excerpts = {
            r[0] for r in session.execute(select(KbExcerpt.external_id)).all()
        }
        existing_poems = {
            r[0] for r in session.execute(select(KbPoem.external_id)).all()
        }
        existing_tasks = {
            (r[0], r[1])
            for r in session.execute(select(KbTask.external_id, KbTask.version)).all()
        }

        # Maps from external_id -> db id (for FK references)
        author_map: dict[str, int] = {}
        work_map: dict[str, int] = {}
        excerpt_map: dict[str, int] = {}
        poem_map: dict[str, int] = {}

        # Preload existing id mappings
        for row in session.execute(select(KbAuthor.external_id, KbAuthor.id)).all():
            author_map[row[0]] = row[1]
        for row in session.execute(select(KbWork.external_id, KbWork.id)).all():
            work_map[row[0]] = row[1]
        for row in session.execute(select(KbExcerpt.external_id, KbExcerpt.id)).all():
            excerpt_map[row[0]] = row[1]
        for row in session.execute(select(KbPoem.external_id, KbPoem.id)).all():
            poem_map[row[0]] = row[1]

        stats = {
            "authors": 0,
            "works": 0,
            "excerpts": 0,
            "poems": 0,
            "tasks": 0,
            "exclusions": 0,
            "skipped_tasks": 0,
        }

        # -------------------------------------------------------------------
        # Phase 1: Authors
        # -------------------------------------------------------------------
        print("Phase 1: Migrating authors...")
        seen_author_ids: set[str] = set()

        for w in works_data:
            aid = w.get("authorId", "")
            if aid and aid not in seen_author_ids:
                seen_author_ids.add(aid)
                if aid not in existing_authors:
                    author = KbAuthor(external_id=aid, name=w.get("author", aid))
                    session.add(author)
                    session.flush()
                    author_map[aid] = author.id
                    stats["authors"] += 1

        for p in poets_data:
            aid = p.get("authorId", "")
            if aid and aid not in seen_author_ids:
                seen_author_ids.add(aid)
                if aid not in existing_authors:
                    author = KbAuthor(external_id=aid, name=p.get("name", aid))
                    session.add(author)
                    session.flush()
                    author_map[aid] = author.id
                    stats["authors"] += 1

        print(f"  Created {stats['authors']} authors")

        # -------------------------------------------------------------------
        # Phase 2: Works
        # -------------------------------------------------------------------
        print("Phase 2: Migrating works...")
        for w in works_data:
            ext_id = w.get("id", "")
            if not ext_id or ext_id in existing_works:
                if ext_id in existing_works:
                    pass  # Already loaded in work_map
                continue

            work = KbWork(
                external_id=ext_id,
                work_code=w.get("workId", ""),
                author_id=author_map.get(w.get("authorId", "")),
                title=w.get("title", ""),
                age18=bool(w.get("age18", False)),
                internal_tags=w.get("internalTags", ""),
                external_tags=w.get("externalTags", ""),
            )
            session.add(work)
            session.flush()
            work_map[ext_id] = work.id
            stats["works"] += 1

        print(f"  Created {stats['works']} works")

        # -------------------------------------------------------------------
        # Phase 3: Excerpts
        # -------------------------------------------------------------------
        print("Phase 3: Migrating excerpts...")
        for w in works_data:
            w_db_id = work_map.get(w.get("id", ""))
            if w_db_id is None:
                continue

            for exc in w.get("excerpts", []):
                ext_id = exc.get("id", "")
                if not ext_id or ext_id in existing_excerpts:
                    continue

                excerpt = KbExcerpt(
                    external_id=ext_id,
                    excerpt_code=exc.get("excerptId", ""),
                    work_id=w_db_id,
                    sort_order=int(exc.get("order", 0)),
                    title=exc.get("title", ""),
                    chapter=exc.get("chapter", ""),
                    theme_internal_id=exc.get("themeInternalId", ""),
                    text=exc.get("text", ""),
                )
                session.add(excerpt)
                session.flush()
                excerpt_map[ext_id] = excerpt.id
                stats["excerpts"] += 1

        print(f"  Created {stats['excerpts']} excerpts")

        # -------------------------------------------------------------------
        # Phase 4: Poems
        # -------------------------------------------------------------------
        print("Phase 4: Migrating poems...")
        for p in poets_data:
            poet_author_id = author_map.get(p.get("authorId", ""))

            for poem in p.get("poems", []):
                ext_id = poem.get("id", "")
                if not ext_id or ext_id in existing_poems:
                    continue

                poem_obj = KbPoem(
                    external_id=ext_id,
                    poem_code=poem.get("poemId", ""),
                    author_id=poet_author_id,
                    title=poem.get("title", ""),
                    text=poem.get("text", ""),
                    age18=bool(poem.get("age18", False)),
                )
                session.add(poem_obj)
                session.flush()
                poem_map[ext_id] = poem_obj.id
                stats["poems"] += 1

        print(f"  Created {stats['poems']} poems")

        # -------------------------------------------------------------------
        # Helper: insert task
        # -------------------------------------------------------------------
        def insert_task(
            raw: dict,
            task_type: str,
            scope: str,
            work_id: int | None = None,
            excerpt_id: int | None = None,
            poem_id: int | None = None,
        ) -> None:
            ext_id = raw.get("id", "")
            if not ext_id:
                return

            if (ext_id, 1) in existing_tasks:
                stats["skipped_tasks"] += 1
                return

            is_active = raw.get("isActive", True)
            if is_active is None:
                is_active = True

            canonical_type = _canonical_task_type(task_type)
            fmt = TASK_TYPE_FORMAT.get(task_type, "unknown")
            content = _build_content(task_type, raw)

            task = KbTask(
                external_id=ext_id,
                version=1,
                task_type=canonical_type,
                format=fmt,
                scope=scope,
                work_id=work_id,
                excerpt_id=excerpt_id,
                poem_id=poem_id,
                is_active=bool(is_active),
                author_id_str=str(raw.get("authorId", "") or ""),
                term_id=str(raw.get("termId", "") or ""),
                tags=str(raw.get("tags", "") or ""),
                content=content,
            )
            session.add(task)
            existing_tasks.add((ext_id, 1))
            stats["tasks"] += 1

        # -------------------------------------------------------------------
        # Phase 5: Tasks — common (per work)
        # -------------------------------------------------------------------
        print("Phase 5: Migrating common tasks...")
        for w in works_data:
            w_db_id = work_map.get(w.get("id", ""))
            common = w.get("commonTasks", {})

            for task_type in ("task1", "task2", "task3"):
                for raw_task in common.get(task_type, []):
                    insert_task(raw_task, task_type, "common", work_id=w_db_id)

        session.flush()
        print(f"  Tasks so far: {stats['tasks']}")

        # -------------------------------------------------------------------
        # Phase 6: Tasks — excerpt-level
        # -------------------------------------------------------------------
        print("Phase 6: Migrating excerpt tasks...")
        for w in works_data:
            w_db_id = work_map.get(w.get("id", ""))

            for exc in w.get("excerpts", []):
                exc_db_id = excerpt_map.get(exc.get("id", ""))
                tasks = exc.get("tasks", {})

                for task_type in ("customTask1", "customTask2", "customTask3",
                                  "task4_1", "task4_2", "task5"):
                    for raw_task in tasks.get(task_type, []):
                        insert_task(
                            raw_task, task_type, "excerpt",
                            work_id=w_db_id, excerpt_id=exc_db_id,
                        )

        session.flush()
        print(f"  Tasks so far: {stats['tasks']}")

        # -------------------------------------------------------------------
        # Phase 7: Tasks — poem-level
        # -------------------------------------------------------------------
        print("Phase 7: Migrating poem tasks...")
        for p in poets_data:
            for poem in p.get("poems", []):
                poem_db_id = poem_map.get(poem.get("id", ""))
                ptasks = poem.get("tasks", {})

                for task_type in ("task6", "task7", "task8", "task9_1", "task9_2", "task10"):
                    for raw_task in ptasks.get(task_type, []):
                        insert_task(
                            raw_task, task_type, "poem",
                            poem_id=poem_db_id,
                        )

        session.flush()
        print(f"  Tasks so far: {stats['tasks']}")

        # -------------------------------------------------------------------
        # Phase 8: Tasks — block3
        # -------------------------------------------------------------------
        print("Phase 8: Migrating block3 tasks...")
        for task_type in ("task11_1", "task11_2_3", "task11_4", "task11_5"):
            for raw_task in block3_data.get(task_type, []):
                insert_task(raw_task, task_type, "block3")

        session.flush()
        print(f"  Tasks so far: {stats['tasks']}")

        # -------------------------------------------------------------------
        # Phase 9: Excerpt exclusions
        # -------------------------------------------------------------------
        print("Phase 9: Migrating excerpt exclusions...")

        existing_exclusions_count = session.execute(
            text("SELECT count(*) FROM kb_excerpt_exclusions")
        ).scalar_one()

        if existing_exclusions_count == 0:
            for w in works_data:
                for exc in w.get("excerpts", []):
                    exc_db_id = excerpt_map.get(exc.get("id", ""))
                    if exc_db_id is None:
                        continue

                    tasks = exc.get("tasks", {})

                    exclusion_mapping = {
                        "excludeTask1Ids": "task1_id",
                        "excludeTask2Ids": "task2_id",
                        "excludeTask3Ids": "task3_id",
                        "excludeTask2Properties": "task2_property",
                        "excludeTask2Characters": "task2_character",
                    }

                    seen_for_excerpt: set[tuple[str, str]] = set()
                    for json_key, excl_type in exclusion_mapping.items():
                        values = tasks.get(json_key, [])
                        if not isinstance(values, list):
                            continue
                        for val in values:
                            val_str = str(val).strip()
                            if not val_str:
                                continue
                            dedup_key = (excl_type, val_str)
                            if dedup_key in seen_for_excerpt:
                                continue
                            seen_for_excerpt.add(dedup_key)
                            excl = KbExcerptExclusion(
                                excerpt_id=exc_db_id,
                                exclusion_type=excl_type,
                                excluded_value=val_str,
                            )
                            session.add(excl)
                            stats["exclusions"] += 1

            session.flush()

        print(f"  Created {stats['exclusions']} exclusions")

        # -------------------------------------------------------------------
        # Commit
        # -------------------------------------------------------------------
        session.commit()

        print()
        print("=" * 60)
        print("Migration complete!")
        print(f"  Authors:    {stats['authors']}")
        print(f"  Works:      {stats['works']}")
        print(f"  Excerpts:   {stats['excerpts']}")
        print(f"  Poems:      {stats['poems']}")
        print(f"  Tasks:      {stats['tasks']} (skipped: {stats['skipped_tasks']})")
        print(f"  Exclusions: {stats['exclusions']}")
        print("=" * 60)


if __name__ == "__main__":
    run()
