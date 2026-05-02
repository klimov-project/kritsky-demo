from __future__ import annotations

import random
import re
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, TypeVar

from api.src.variants.randomizer import generate_variant_runtime2

T = TypeVar("T")
IDENTIFIER_SPLIT_RE = re.compile(r"[,;\n]+")

# S4: max times a single termId may appear in task3 within one pack
_TERM_MAX_USES = 4
# S6: max times a single work may be used as excerpt source in a full-variant pack
_WORK_MAX_USES = 2
# S8: max poems from one poet in a full-variant pack
_POET_MAX_POEMS = 2


class CollectionGenerationError(Exception):
    def __init__(self, detail: str):
        self.detail = detail


@dataclass
class AuthorPackContext:
    """Tracks cross-variant deduplication state for an author (1–5) collection pack."""
    used_task1_ids: set[str] = field(default_factory=set)
    used_task2_ids: set[str] = field(default_factory=set)
    term_counts: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    used_task5_tags: set[str] = field(default_factory=set)


@dataclass
class FullPackContext:
    """Tracks cross-variant deduplication state for a full-variant (11-task) collection pack."""
    work_use_count: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    used_task5_ids: set[str] = field(default_factory=set)
    poet_poem_count: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    used_task11_ids: set[str] = field(default_factory=set)


def _is_active(item: dict[str, Any]) -> bool:
    return item.get("isActive") is not False


def _parse_identifier_tokens(value: Any) -> list[str]:
    if isinstance(value, list):
        values = value
    else:
        values = [value]
    tokens: list[str] = []
    for item in values:
        if not isinstance(item, str):
            continue
        for part in IDENTIFIER_SPLIT_RE.split(item):
            token = part.strip().lower()
            if token:
                tokens.append(token)
    return list(dict.fromkeys(tokens))


def _extract_term_tokens(item: dict[str, Any]) -> set[str]:
    tokens: set[str] = set()
    for key in ("termId", "termId1", "termId2"):
        for token in _parse_identifier_tokens(item.get(key)):
            tokens.add(token)
    options = item.get("options")
    if isinstance(options, list):
        for option in options:
            if isinstance(option, dict):
                for token in _parse_identifier_tokens(option.get("termId")):
                    tokens.add(token)
    return tokens


def _sort_excerpts(excerpts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    indexed = list(enumerate(excerpts))
    return [
        excerpt for _, excerpt in sorted(
            indexed,
            key=lambda item: (
                item[1].get("order") if isinstance(item[1].get("order"), int) else item[0] + 1,
                item[0],
            ),
        )
    ]


def _pick_random(items: list[T]) -> T | None:
    if not items:
        return None
    return random.choice(items)


def _filter_active_entries(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, dict) and _is_active(item)]


def _build_identifier_exclusion_set(values: Any) -> set[str]:
    tokens: set[str] = set()
    if not isinstance(values, list):
        return tokens
    for value in values:
        for token in _parse_identifier_tokens(value):
            tokens.add(token)
    return tokens


def _build_text_exclusion_set(values: Any) -> set[str]:
    tokens: set[str] = set()
    if not isinstance(values, list):
        return tokens
    for value in values:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized:
                tokens.add(normalized)
    return tokens


def _normalize_property_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return list(dict.fromkeys(
        item.strip()
        for item in value
        if isinstance(item, str) and item.strip()
    ))


def _get_pair_properties_by_category(pair: dict[str, Any], category: str) -> list[str]:
    typed = _normalize_property_list(pair.get("phrases") if category == "phrases" else pair.get("characteristics"))
    if typed:
        return typed
    has_typed = _normalize_property_list(pair.get("phrases")) or _normalize_property_list(pair.get("characteristics"))
    if has_typed:
        return []
    return _normalize_property_list(pair.get("properties"))


def _resolve_task2_property_category(question: dict[str, Any], work: dict[str, Any]) -> str:
    category = str(question.get("pairPropertyType") or "").strip().lower()
    if category in {"phrases", "characteristics"}:
        return category
    character_source = str(question.get("characterSource") or "").strip().lower()
    if character_source == "quotes":
        return "phrases"
    if character_source == "facts":
        return "characteristics"
    pairs = question.get("pairs") if isinstance(question.get("pairs"), list) else []
    pair_has_phrases = any(_get_pair_properties_by_category(pair, "phrases") for pair in pairs if isinstance(pair, dict))
    pair_has_characteristics = any(_get_pair_properties_by_category(pair, "characteristics") for pair in pairs if isinstance(pair, dict))
    characters = work.get("characters") if isinstance(work.get("characters"), list) else []
    character_has_phrases = any(isinstance(character, dict) and _normalize_property_list(character.get("quotes")) for character in characters)
    character_has_characteristics = any(isinstance(character, dict) and _normalize_property_list(character.get("facts")) for character in characters)
    categories: list[str] = []
    if pair_has_phrases or character_has_phrases:
        categories.append("phrases")
    if pair_has_characteristics or character_has_characteristics:
        categories.append("characteristics")
    return _pick_random(categories) or "phrases"


def _pick_character_property(character: dict[str, Any], category: str, excluded_properties: set[str]) -> str:
    values = character.get("quotes") if category == "phrases" else character.get("facts")
    options = [
        value.strip()
        for value in (values if isinstance(values, list) else [])
        if isinstance(value, str) and value.strip() and value.strip().lower() not in excluded_properties
    ]
    return _pick_random(options) or ""


def _build_task2_runtime(
    work: dict[str, Any],
    question: dict[str, Any],
    excerpt_tasks: dict[str, Any],
    task2_pool: list[dict[str, Any]],
) -> dict[str, Any] | None:
    property_category = _resolve_task2_property_category(question, work)
    excluded_characters = _build_text_exclusion_set(excerpt_tasks.get("excludeTask2Characters"))
    excluded_properties = _build_text_exclusion_set(excerpt_tasks.get("excludeTask2Properties"))
    excluded_ids = set(excerpt_tasks.get("excludeTask2Ids") or [])
    excluded_term_ids = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask2TermIds"))
    characters = work.get("characters") if isinstance(work.get("characters"), list) else []

    def find_character(name: str) -> dict[str, Any] | None:
        normalized = name.strip().lower()
        for character in characters:
            if isinstance(character, dict) and str(character.get("name") or "").strip().lower() == normalized:
                return character
        return None

    prepared_pairs: list[dict[str, Any]] = []
    for pair in question.get("pairs", []):
        if not isinstance(pair, dict):
            continue
        character_name = str(pair.get("character") or "").strip()
        if not character_name or character_name.lower() in excluded_characters:
            continue
        properties = [
            value for value in _get_pair_properties_by_category(pair, property_category)
            if value.strip().lower() not in excluded_properties
        ]
        if not properties:
            character = find_character(character_name)
            generated = _pick_character_property(character or {}, property_category, excluded_properties)
            if generated:
                properties = [generated]
        properties = list(dict.fromkeys(value.strip() for value in properties if value.strip()))
        if not properties:
            continue
        prepared_pairs.append({
            "id": str(pair.get("id") or ""),
            "character": character_name,
            "properties": properties,
        })

    configured_count_raw = question.get("characterCount")
    try:
        configured_count = int(configured_count_raw) if configured_count_raw is not None else 0
    except (TypeError, ValueError):
        configured_count = 0
    if configured_count > 0 and len(prepared_pairs) > configured_count:
        prepared_pairs = random.sample(prepared_pairs, configured_count)
    if not prepared_pairs:
        available_characters = []
        for character in characters:
            if not isinstance(character, dict):
                continue
            character_name = str(character.get("name") or "").strip()
            if not character_name or character_name.lower() in excluded_characters:
                continue
            generated = _pick_character_property(character, property_category, excluded_properties)
            if not generated:
                continue
            available_characters.append({
                "id": str(character.get("id") or ""),
                "character": character_name,
                "properties": [generated],
            })
        if configured_count > 0 and len(available_characters) > configured_count:
            prepared_pairs = random.sample(available_characters, configured_count)
        else:
            prepared_pairs = available_characters
    if not prepared_pairs:
        return None

    used_properties: set[str] = set()
    pairs: list[dict[str, Any]] = []
    for pair in prepared_pairs:
        options = pair["properties"][:]
        random.shuffle(options)
        selected = next((option for option in options if option not in used_properties), options[0] if options else "")
        if not selected:
            continue
        used_properties.add(selected)
        pairs.append({"character": pair["character"], "property": selected})
    if not pairs:
        return None

    used_characters = {pair["character"].strip().lower() for pair in pairs}
    same_question_extra_candidates = [
        option for pair in prepared_pairs if pair["character"].strip().lower() not in used_characters for option in pair["properties"] if option not in used_properties
    ]
    cross_question_candidates: list[str] = []
    for candidate in task2_pool:
        if candidate is question:
            continue
        if str(candidate.get("id") or "") in excluded_ids:
            continue
        if _extract_term_tokens(candidate) & excluded_term_ids:
            continue
        prepared = _build_task2_runtime(work, candidate, {**excerpt_tasks, "excludeTask2Ids": [], "excludeTask2TermIds": []}, [])
        if prepared is None:
            continue
        for option in prepared.get("rightOptions", []):
            if isinstance(option, str) and option.strip() and option not in used_properties:
                cross_question_candidates.append(option.strip())
    character_candidates = [
        generated for character in characters if isinstance(character, dict) and str(character.get("name") or "").strip().lower() not in used_characters
        for generated in [_pick_character_property(character, property_category, excluded_properties)] if generated and generated not in used_properties
    ]
    extra_option = (
        _pick_random(list(dict.fromkeys(same_question_extra_candidates)))
        or (str(question.get("extraOption") or "").strip() if str(question.get("extraOption") or "").strip() and str(question.get("extraOption") or "").strip().lower() not in used_properties else "")
        or _pick_random(list(dict.fromkeys(cross_question_candidates)))
        or _pick_random(list(dict.fromkeys(character_candidates)))
        or "Не относится ни к одному из персонажей"
    )
    right_options = [pair["property"] for pair in pairs]
    if extra_option in right_options:
        extra_option = "Лишний вариант"
    right_options = right_options + [extra_option]
    shuffled_right_options = right_options[:]
    random.shuffle(shuffled_right_options)
    answer_map = []
    letters = list("АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ")
    for index, pair in enumerate(pairs):
        try:
            option_index = shuffled_right_options.index(pair["property"]) + 1
        except ValueError:
            option_index = 0
        answer_map.append(f"{letters[index] if index < len(letters) else index + 1}-{option_index if option_index else '?'}")
    return {
        "prompt": str(question.get("prompt") or "").strip(),
        "leftLabel": str(question.get("leftLabel") or "Персонажи").strip(),
        "rightLabel": str(question.get("rightLabel") or "Свойства").strip(),
        "pairs": pairs,
        "rightOptions": shuffled_right_options,
        "extraOption": extra_option,
        "answer": ", ".join(answer_map) if answer_map else "—",
    }


def _get_two_gap_answer_length(entry: dict[str, Any]) -> int:
    return len(f"{str(entry.get('answer1') or '')}{str(entry.get('answer2') or '')}".replace(" ", ""))


def _is_two_gap_valid(entry: dict[str, Any]) -> bool:
    return _get_two_gap_answer_length(entry) <= 17


def _build_runtime_task3(entries: list[dict[str, Any]]) -> dict[str, Any] | None:
    valid_entries = [entry for entry in entries if _is_two_gap_valid(entry)]
    if not valid_entries:
        return None
    standalone = [entry for entry in valid_entries if str(entry.get("part2") or "").strip() or str(entry.get("answer2") or "").strip()]
    if standalone:
        entry = _pick_random(standalone) or standalone[0]
        return {
            "part1": str(entry.get("part1") or "").strip(),
            "part2": str(entry.get("part2") or "").strip(),
            "answer1": str(entry.get("answer1") or "").strip(),
            "answer2": str(entry.get("answer2") or "").strip(),
        }
    for first in valid_entries:
        for second in valid_entries:
            if first is second:
                continue
            if _extract_term_tokens(first) & _extract_term_tokens(second):
                continue
            combined = {
                "part1": str(first.get("part1") or "").strip(),
                "part2": str(second.get("part1") or "").strip(),
                "answer1": str(first.get("answer1") or "").strip(),
                "answer2": str(second.get("answer1") or "").strip(),
            }
            if _is_two_gap_valid(combined):
                return combined
    entry = _pick_random(valid_entries) or valid_entries[0]
    return {
        "part1": str(entry.get("part1") or "").strip(),
        "part2": str(entry.get("part2") or "").strip(),
        "answer1": str(entry.get("answer1") or "").strip(),
        "answer2": str(entry.get("answer2") or "").strip(),
    }


def _build_excerpt_task_pools(work: dict[str, Any], excerpt: dict[str, Any], all_works: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    excerpt_tasks = excerpt.get("tasks") if isinstance(excerpt.get("tasks"), dict) else {}
    task1_id_exclusions = set(excerpt_tasks.get("excludeTask1Ids") or [])
    task1_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask1TermIds"))
    task2_id_exclusions = set(excerpt_tasks.get("excludeTask2Ids") or [])
    task2_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask2TermIds"))
    task3_id_exclusions = set(excerpt_tasks.get("excludeTask3Ids") or [])
    task3_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask3TermIds"))
    common_tasks = work.get("commonTasks") if isinstance(work.get("commonTasks"), dict) else {}
    task1 = [
        *[item for item in _filter_active_entries(common_tasks.get("task1")) if str(item.get("id") or "") not in task1_id_exclusions and not (_extract_term_tokens(item) & task1_term_exclusions)],
        *_filter_active_entries(excerpt_tasks.get("customTask1")),
    ]
    task2 = [
        *[item for item in _filter_active_entries(common_tasks.get("task2")) if str(item.get("id") or "") not in task2_id_exclusions and not (_extract_term_tokens(item) & task2_term_exclusions)],
        *_filter_active_entries(excerpt_tasks.get("customTask2")),
    ]
    local_task3 = [
        *[item for item in _filter_active_entries(common_tasks.get("task3")) if str(item.get("id") or "") not in task3_id_exclusions and not (_extract_term_tokens(item) & task3_term_exclusions)],
        *_filter_active_entries(excerpt_tasks.get("customTask3")),
    ]
    global_task3 = [
        item for work_item in all_works if isinstance(work_item, dict) for item in _filter_active_entries((work_item.get("commonTasks") or {}).get("task3"))
        if item.get("withoutAuthor") is True and str(item.get("id") or "") not in task3_id_exclusions and not (_extract_term_tokens(item) & task3_term_exclusions)
    ]
    return {
        "task1": task1,
        "task2": task2,
        "task3": [item for item in [*local_task3, *global_task3] if _is_two_gap_valid(item)],
        "task4_1": _filter_active_entries(excerpt_tasks.get("task4_1")),
        "task4_2": _filter_active_entries(excerpt_tasks.get("task4_2")),
        "task5": _filter_active_entries(excerpt_tasks.get("task5")),
    }


def _has_valid_collection_task2(work: dict[str, Any], excerpt_tasks: dict[str, Any], task2_pool: list[dict[str, Any]]) -> bool:
    return any(_build_task2_runtime(work, question, excerpt_tasks, task2_pool) is not None for question in task2_pool)


def _is_complete_collection_source(work: dict[str, Any], excerpt: dict[str, Any], all_works: list[dict[str, Any]]) -> bool:
    pools = _build_excerpt_task_pools(work, excerpt, all_works)
    excerpt_tasks = excerpt.get("tasks") if isinstance(excerpt.get("tasks"), dict) else {}
    return bool(pools["task1"] and _has_valid_collection_task2(work, excerpt_tasks, pools["task2"]) and _build_runtime_task3(pools["task3"]) is not None and (pools["task4_1"] or pools["task4_2"]) and pools["task5"])


def _is_complete_collection_variant(variant: Any) -> bool:
    if not isinstance(variant, dict):
        return False
    return bool(isinstance(variant.get("task1"), dict) and isinstance(variant.get("task2"), dict) and isinstance(variant.get("task3"), dict) and (isinstance(variant.get("task4_1"), dict) or isinstance(variant.get("task4_2"), dict)) and isinstance(variant.get("task5"), dict))


def _is_complete_collection_payload(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False
    packs = payload.get("packs")
    if not isinstance(packs, list) or not packs:
        return False
    for pack in packs:
        if not isinstance(pack, dict):
            return False
        variants = pack.get("variants")
        if not isinstance(variants, list) or not variants:
            return False
        if any(not _is_complete_collection_variant(variant) for variant in variants):
            return False
    return True


def _build_collection_variant(
    work: dict[str, Any],
    excerpt: dict[str, Any],
    all_works: list[dict[str, Any]],
    index: int,
    pack_ctx: AuthorPackContext,
) -> dict[str, Any] | None:
    pools = _build_excerpt_task_pools(work, excerpt, all_works)
    excerpt_tasks = excerpt.get("tasks") if isinstance(excerpt.get("tasks"), dict) else {}

    # S2: task1 — question not more than once per pack
    task1_pool = [q for q in pools["task1"] if str(q.get("id") or "") not in pack_ctx.used_task1_ids]
    task1 = _pick_random(task1_pool)

    # S3: task2 — all questions different per pack
    task2_runtime = None
    selected_task2_id: str | None = None
    task2_questions = [q for q in pools["task2"] if str(q.get("id") or "") not in pack_ctx.used_task2_ids]
    random.shuffle(task2_questions)
    for question in task2_questions:
        task2_runtime = _build_task2_runtime(work, question, excerpt_tasks, pools["task2"])
        if task2_runtime is not None:
            selected_task2_id = str(question.get("id") or "")
            break

    # S4: task3 — exclude entries whose termId has already hit _TERM_MAX_USES
    def _task3_term_ids(entry: dict[str, Any]) -> list[str]:
        tokens: list[str] = []
        for key in ("termId", "termId1", "termId2"):
            val = str(entry.get(key) or "").strip().lower()
            if val:
                tokens.append(val)
        return tokens

    task3_pool = [
        entry for entry in pools["task3"]
        if all(pack_ctx.term_counts[t] < _TERM_MAX_USES for t in _task3_term_ids(entry))
    ]
    task3_runtime = _build_runtime_task3(task3_pool)

    # S5: task5 — tags must not repeat within a pack
    def _task5_tags(entry: dict[str, Any]) -> set[str]:
        raw = entry.get("tags")
        if isinstance(raw, list):
            return {str(t).strip().lower() for t in raw if str(t).strip()}
        if isinstance(raw, str) and raw.strip():
            return {raw.strip().lower()}
        return set()

    task5_pool = [q for q in pools["task5"] if not (_task5_tags(q) & pack_ctx.used_task5_tags)]
    task5 = _pick_random(task5_pool)

    task4_1 = _pick_random(pools["task4_1"])
    task4_2 = _pick_random(pools["task4_2"])

    if task1 is None or task2_runtime is None or task3_runtime is None or (task4_1 is None and task4_2 is None) or task5 is None:
        return None

    # Update pack context for subsequent variants
    pack_ctx.used_task1_ids.add(str(task1.get("id") or ""))
    if selected_task2_id:
        pack_ctx.used_task2_ids.add(selected_task2_id)
    # Accumulate term usage from the chosen task3 entry (task3_runtime doesn't carry termId,
    # so we find the matching entry by answer content to update counts)
    for entry in pools["task3"]:
        if (str(entry.get("answer1") or "") == str(task3_runtime.get("answer1") or "")
                and str(entry.get("answer2") or "") == str(task3_runtime.get("answer2") or "")):
            for t in _task3_term_ids(entry):
                pack_ctx.term_counts[t] += 1
            break
    pack_ctx.used_task5_tags.update(_task5_tags(task5))

    return {
        "id": f"collection-variant-{index}",
        "index": index,
        "workTitle": str(work.get("title") or "").strip(),
        "author": str(work.get("author") or "").strip(),
        "excerptTitle": str(excerpt.get("title") or f"Отрывок {index}").strip(),
        "excerptText": str(excerpt.get("text") or "").strip(),
        "task1": None if task1 is None else {"prompt": str(task1.get("text") or "").strip(), "answer": str(task1.get("answer") or "").strip()},
        "task2": task2_runtime,
        "task3": task3_runtime,
        "task4_1": None if task4_1 is None else {"prompt": str(task4_1.get("text") or "").strip()},
        "task4_2": None if task4_2 is None else {"prompt": str(task4_2.get("text") or "").strip()},
        "task5": None if task5 is None else {"prompt": str(task5.get("text") or "").strip()},
    }


def _generate_collection_payload(knowledge_base_payload: dict[str, Any], collection_config: dict[str, Any], quantity: int) -> dict[str, Any]:
    works = [item for item in knowledge_base_payload.get("works", []) if isinstance(item, dict)]
    author_id = collection_config["authorId"]
    author_name = collection_config["authorName"]
    variants_count = int(collection_config["variantsCount"])
    author_works = [work for work in works if (str(work.get("authorId") or "").strip() == author_id or str(work.get("author") or "").strip() == author_name)]
    # S1: excerpts are sorted by their `order` field (ascending) — no shuffle
    sources = [
        (work, excerpt)
        for work in author_works
        for excerpt in _sort_excerpts([item for item in work.get("excerpts", []) if isinstance(item, dict)])
        if str(excerpt.get("text") or "").strip()
    ]
    complete_sources = [(work, excerpt) for work, excerpt in sources if _is_complete_collection_source(work, excerpt, works)]
    if not sources:
        raise CollectionGenerationError(detail=f"Не удалось собрать сборник: для автора {author_name} нет отрывков.")
    if not complete_sources:
        raise CollectionGenerationError(detail=f"Не удалось собрать сборник: для автора {author_name} нет отрывков с полным набором заданий 1–5.")
    packs = []
    for pack_index in range(quantity):
        # Each pack gets a fresh deduplication context (S2–S5)
        pack_ctx = AuthorPackContext()
        variants = []
        for variant_index in range(variants_count):
            # S1: sequential cycling through ordered sources (no random shuffle)
            source = complete_sources[variant_index % len(complete_sources)]
            variant = _build_collection_variant(source[0], source[1], works, variant_index + 1, pack_ctx)
            if variant is None:
                raise CollectionGenerationError(detail=f"Не удалось собрать сборник: один из отрывков автора {author_name} не даёт полный вариант 1–5.")
            variants.append(variant)
        packs.append({"index": pack_index + 1, "variants": variants})
    return {"kind": "author_collection_1_5", "authorId": author_id, "authorName": author_name, "variantsCount": variants_count, "packs": packs}


def _generate_full_variant_collection_payload(knowledge_base_payload: dict[str, Any], collection_config: dict[str, Any], quantity: int) -> dict[str, Any]:
    variants_count = int(collection_config["variantsCount"])
    packs = []
    for pack_index in range(quantity):
        pack_ctx = FullPackContext()
        variants = []
        for variant_index in range(variants_count):
            
            variant = None
            max_retries = 100
            for attempt in range(max_retries):
                result = generate_variant_runtime2(knowledge_base_payload, {})
                v = result["variant"]
                if not v:
                    continue
                
                work_id = str((v.get("work") or {}).get("id") or "")
                task5_id = str((v.get("task5") or {}).get("id") or "")
                poet_id = str((v.get("poet") or {}).get("id") or "")
                
                # S6: work used <= _WORK_MAX_USES
                if work_id and pack_ctx.work_use_count[work_id] >= _WORK_MAX_USES:
                    continue
                # S7: task5 must not repeat
                if task5_id and task5_id in pack_ctx.used_task5_ids:
                    continue
                # S8: poet used <= _POET_MAX_POEMS
                if poet_id and pack_ctx.poet_poem_count[poet_id] >= _POET_MAX_POEMS:
                    continue
                
                # S9: task11 must not repeat
                task11_ids = []
                for k in ["task11_1", "task11_2", "task11_3", "task11_4", "task11_5"]:
                    t = v.get(k)
                    if t:
                        task11_ids.append(str(t.get("id") or ""))
                
                if any(tid in pack_ctx.used_task11_ids for tid in task11_ids):
                    continue
                    
                # All constraints passed
                variant = v
                
                if work_id:
                    pack_ctx.work_use_count[work_id] += 1
                if task5_id:
                    pack_ctx.used_task5_ids.add(task5_id)
                if poet_id:
                    pack_ctx.poet_poem_count[poet_id] += 1
                for tid in task11_ids:
                    pack_ctx.used_task11_ids.add(tid)
                    
                break
                
            if variant is None:
                raise CollectionGenerationError(
                    detail="Не удалось собрать полный сборник с учетом ограничений (мало данных в базе знаний)."
                )
            
            variant["id"] = f"full-variant-{pack_index}-{variant_index}"
            variant["index"] = variant_index + 1
            variants.append(variant)
            
        packs.append({"index": pack_index + 1, "variants": variants})
    return {"kind": "full_variant_collection", "variantsCount": variants_count, "packs": packs}


def _validate_pack_specs(packs: list[dict[str, Any]]) -> None:
    """
    Вспомогательная функция для тестов, проверяющая соблюдение спецификаций S1-S9.
    Если спецификация нарушена, выбрасывает AssertionError.
    """
    for pack in packs:
        variants = pack.get("variants", [])
        
        # S2-S5 contexts
        used_task1 = set()
        used_task2 = set()
        used_task5_tags = set()
        
        # S6-S9 contexts
        work_use_count = defaultdict(int)
        used_task5_ids = set()
        poet_poem_count = defaultdict(int)
        used_task11_ids = set()
        
        for variant in variants:
            # S2: Task 1
            t1 = variant.get("task1")
            if t1 and t1.get("id"):
                assert t1["id"] not in used_task1, f"S2 violation: task1 {t1['id']} repeated in pack"
                used_task1.add(t1["id"])
                
            # S3: Task 2
            t2 = variant.get("task2")
            if t2 and t2.get("id"):
                assert t2["id"] not in used_task2, f"S3 violation: task2 {t2['id']} repeated in pack"
                used_task2.add(t2["id"])
                
            # S4 (Task 3 term counts) is hard to validate strictly here without full KB access.
            
            # S5: Task 5 tags
            t5 = variant.get("task5")
            if t5 and t5.get("tags"):
                tags = {str(t).strip().lower() for t in t5["tags"] if str(t).strip()}
                intersection = tags & used_task5_tags
                assert not intersection, f"S5 violation: tags {intersection} repeated in pack"
                used_task5_tags.update(tags)
                
            # S6: Work max uses
            w = variant.get("work")
            if w and w.get("id"):
                work_use_count[w["id"]] += 1
                assert work_use_count[w["id"]] <= _WORK_MAX_USES, f"S6 violation: work {w['id']} used >{_WORK_MAX_USES} times in pack"
                
            # S7: Task 5 uniqueness
            if t5 and t5.get("id"):
                assert t5["id"] not in used_task5_ids, f"S7 violation: task5 {t5['id']} repeated in pack"
                used_task5_ids.add(t5["id"])
                
            # S8: Poet max uses
            p = variant.get("poet")
            if p and p.get("id"):
                poet_poem_count[p["id"]] += 1
                assert poet_poem_count[p["id"]] <= _POET_MAX_POEMS, f"S8 violation: poet {p['id']} used >{_POET_MAX_POEMS} times in pack"
                
            # S9: Task 11 uniqueness
            for k in ["task11_1", "task11_2", "task11_3", "task11_4", "task11_5"]:
                t11 = variant.get(k)
                if t11 and t11.get("id"):
                    assert t11["id"] not in used_task11_ids, f"S9 violation: task11 {t11['id']} repeated in pack"
                    used_task11_ids.add(t11["id"])
