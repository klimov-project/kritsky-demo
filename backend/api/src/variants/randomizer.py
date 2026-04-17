from __future__ import annotations

import copy
import random
import re
from typing import Any, Callable, Literal


RUSSIAN_LETTERS = list("АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ")
VARIANT_BUILD_ATTEMPTS = 250
PARTIAL_VARIANT_BUILD_ATTEMPTS = 60
MAX_REFRESH_TASK_POOL_ITEMS = 150
MAX_REFRESH_TASK_EVALUATION_ITEMS = 100
BLOCK11_COMPLIANCE_ATTEMPTS = 700
TASK2_EXTRA_OPTION_FALLBACK = "Не относится ни к одному из персонажей"
TASK2_PAIR_PICK_ATTEMPTS = 32
TASK2_PARTIAL_REFRESH_MAX_CANDIDATES = 180
TASK8_MAX_OPTIONS = 7
TASK8_MIN_CORRECT_OPTIONS = 2
TASK8_MAX_CORRECT_OPTIONS = 6

SERVICE_TAGS = {
    "встречается",
    "используется",
    "можно найти",
    "относится",
    "принадлежит",
    "содержит",
    "можно заметить",
    "обозначается",
    "называется",
}
ROD_SINGLE_USE_IN_BLOCK11 = {"лирика", "пьеса", "поэма"}
NO_AUTHOR_TAGS = {"без автора", "без-автора", "без_автора"}

BLOCK11_KEYS = ["task11_1", "task11_2", "task11_3", "task11_4", "task11_5"]
THEME_GROUP_1_KEYS = ["task4_1", "task4_2", "task5"]
THEME_GROUP_2_KEYS = ["task9_1", "task9_2", "task10"]
THEME_GROUP_3_KEYS = ["task11_1", "task11_2", "task11_3", "task11_4", "task11_5"]

SERVICE_TAG_ALLOWED_KEYS = {"task3", "task6"}
CHARACTER_TAG_ALLOWED_KEYS = {"task2", "task5", "task11_1", "task11_2", "task11_3", "task11_4", "task11_5"}
HTML_TAG_PATTERN = re.compile(r"</?[a-z][\s\S]*>", re.IGNORECASE | re.UNICODE)
SPLIT_PATTERN = re.compile(r"[,\n;]+", re.UNICODE)

VariantTaskKey = Literal[
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


def _pick_random(items: list[Any]) -> Any | None:
    if not items:
        return None
    return random.choice(items)


def _shuffle(items: list[Any]) -> list[Any]:
    next_items = list(items)
    random.shuffle(next_items)
    return next_items


def _pick_many_random(items: list[Any], count: int) -> list[Any]:
    if count <= 0:
        return []
    return _shuffle(items)[:count]


def _limit_random_items(items: list[Any], limit: int) -> list[Any]:
    if limit <= 0 or len(items) <= limit:
        return list(items)
    return _pick_many_random(items, limit)


def _is_object_record(value: Any) -> bool:
    return isinstance(value, dict)


def _sort_excerpts_by_order(excerpts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    indexed = [{"excerpt": excerpt, "index": index} for index, excerpt in enumerate(excerpts)]

    def _order(entry: dict[str, Any]) -> tuple[float, int]:
        excerpt = entry["excerpt"]
        index = entry["index"]
        order = excerpt.get("order")
        try:
            numeric = float(order)
        except (TypeError, ValueError):
            numeric = float(index + 1)
        return (numeric, index)

    indexed.sort(key=_order)
    return [entry["excerpt"] for entry in indexed]


def _get_two_gap_answer_length(question: dict[str, Any]) -> int:
    answer1 = str(question.get("answer1") or "")
    answer2 = str(question.get("answer2") or "")
    return len(re.sub(r"\s+", "", f"{answer1}{answer2}"))


def _is_two_gap_valid(question: dict[str, Any]) -> bool:
    return _get_two_gap_answer_length(question) <= 17


def _filter_active_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in items if item.get("isActive") is not False]


def _normalize_tag(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"^тег\.?\s*", "", value.lower().lstrip("#"))).strip()


def _normalize_tag_kind_token(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[._-]+", " ", _normalize_tag(value))).strip()


def _tag_matches_kind(value: str, expected_kind: str) -> bool:
    normalized = _normalize_tag(value)
    normalized_kind = _normalize_tag_kind_token(expected_kind)
    if not normalized_kind:
        return False
    return (
        normalized == normalized_kind
        or normalized.startswith(f"{normalized_kind}:")
        or normalized.startswith(f"{normalized_kind}.")
        or normalized.startswith(f"{normalized_kind} ")
    )


def _get_structured_tag_payload(value: str, expected_kind: str) -> str:
    normalized = _normalize_tag(value)
    normalized_kind = _normalize_tag_kind_token(expected_kind)
    if not normalized_kind or normalized == normalized_kind:
        return ""

    if normalized.startswith(f"{normalized_kind}:") or normalized.startswith(f"{normalized_kind}."):
        return normalized[len(normalized_kind) + 1 :].strip()

    if normalized.startswith(f"{normalized_kind} "):
        return normalized[len(normalized_kind) + 1 :].strip()

    return ""


def _split_values(value: str) -> list[str]:
    return [entry.strip() for entry in SPLIT_PATTERN.split(value) if entry and entry.strip()]


def _parse_tag_value(value: Any) -> list[str]:
    if value is None:
        return []

    chunks: list[str] = []
    if isinstance(value, str):
        chunks.append(value)
    elif isinstance(value, list):
        chunks.extend([entry for entry in value if isinstance(entry, str)])

    normalized = [_normalize_tag(entry) for chunk in chunks for entry in _split_values(chunk)]
    unique: list[str] = []
    seen = set()
    for entry in normalized:
        if not entry or entry in seen:
            continue
        seen.add(entry)
        unique.append(entry)
    return unique


def _parse_identifier_tokens(value: Any) -> list[str]:
    if value is None:
        return []

    chunks: list[str] = []
    if isinstance(value, str):
        chunks.append(value)
    elif isinstance(value, list):
        chunks.extend([entry for entry in value if isinstance(entry, str)])

    normalized = [entry.strip().lower() for chunk in chunks for entry in _split_values(chunk)]
    unique: list[str] = []
    seen = set()
    for entry in normalized:
        if not entry or entry in seen:
            continue
        seen.add(entry)
        unique.append(entry)
    return unique


def _read_identifier_field(value: Any, field: str) -> list[str]:
    if not _is_object_record(value):
        return []
    return _parse_identifier_tokens(value.get(field))


def _read_string_field(value: Any, field: str) -> str:
    if not _is_object_record(value):
        return ""
    raw = value.get(field)
    return raw.strip() if isinstance(raw, str) else ""


def _get_tags(value: Any) -> list[str]:
    if not _is_object_record(value):
        return []
    return _parse_tag_value(value.get("tags")) + [
        entry for entry in _parse_tag_value(value.get("tag")) if entry not in _parse_tag_value(value.get("tags"))
    ]


def _is_author_tag(tag: str) -> bool:
    return _tag_matches_kind(tag, "автор")


def _is_term_tag(tag: str) -> bool:
    return _tag_matches_kind(tag, "термин")


def _is_theme_tag(tag: str) -> bool:
    return _tag_matches_kind(tag, "тема")


def _is_rod_tag(tag: str) -> bool:
    return _tag_matches_kind(tag, "род")


def _is_character_tag(tag: str) -> bool:
    return _tag_matches_kind(tag, "персонаж")


def _is_exclusive_question_tag(tag: str) -> bool:
    return (
        _tag_matches_kind(tag, "искл вопрос")
        or _tag_matches_kind(tag, "исключительный вопрос")
        or _tag_matches_kind(tag, "спец вопрос")
    )


def _is_exclusive_question(value: Any) -> bool:
    if _is_object_record(value) and value.get("special") is True:
        return True
    return any(_is_exclusive_question_tag(tag) for tag in _get_tags(value))


def _extract_term_tokens(value: Any, fallback_token_prefix: str) -> list[str]:
    del fallback_token_prefix
    tokens: set[str] = set()

    for field in ("termId", "termId1", "termId2"):
        for token in _read_identifier_field(value, field):
            tokens.add(token)

    if _is_object_record(value) and isinstance(value.get("options"), list):
        for option in value["options"]:
            for field in ("termId", "termId1", "termId2"):
                for token in _read_identifier_field(option, field):
                    tokens.add(token)
            for tag in _get_tags(option):
                payload = _get_structured_tag_payload(tag, "термин")
                if payload:
                    for token in _parse_identifier_tokens(payload):
                        tokens.add(token)

    tags = _get_tags(value)
    for tag in tags:
        payload = _get_structured_tag_payload(tag, "термин")
        if payload:
            for token in _parse_identifier_tokens(payload):
                tokens.add(token)

    if not tokens and any(_is_term_tag(tag) for tag in tags):
        tokens.add("tag:термин")

    return list(tokens)


def _extract_theme_tokens(value: Any, fallback_token_prefix: str) -> list[str]:
    tokens: set[str] = set()

    for field in ("theme1Id", "theme2Id", "themeInternalId"):
        for token in _read_identifier_field(value, field):
            tokens.add(token)

    tags = _get_tags(value)
    for tag in tags:
        payload = _get_structured_tag_payload(tag, "тема")
        if payload:
            for token in _parse_identifier_tokens(payload):
                tokens.add(token)

    if not tokens and any(_is_theme_tag(tag) for tag in tags):
        tokens.add(f"{fallback_token_prefix}:theme")

    return list(tokens)


def _normalize_rod(value: str) -> str:
    normalized = _normalize_tag(value)
    if "лирик" in normalized:
        return "лирика"
    if "пьес" in normalized:
        return "пьеса"
    if "поэм" in normalized:
        return "поэма"
    if "проз" in normalized:
        return "проза"
    return normalized


def _extract_rod_tokens(value: Any) -> list[str]:
    tokens: set[str] = set()
    rod_id = _read_string_field(value, "rodId")
    if rod_id:
        tokens.add(_normalize_rod(rod_id))

    for tag in _get_tags(value):
        concrete = _get_structured_tag_payload(tag, "род")
        if concrete:
            tokens.add(_normalize_rod(concrete))
            continue
        if tag in ROD_SINGLE_USE_IN_BLOCK11 or tag == "проза":
            tokens.add(_normalize_rod(tag))

    return list(tokens)


def _extract_author_tokens(value: Any, fallback_author_id: str | None = None) -> list[str]:
    tokens: set[str] = set()

    for field in ("authorId", "authorIds"):
        for token in _read_identifier_field(value, field):
            tokens.add(token)

    for tag in _get_tags(value):
        payload = _get_structured_tag_payload(tag, "автор")
        if payload:
            for token in _parse_identifier_tokens(payload):
                tokens.add(token)

    if fallback_author_id:
        for token in _parse_identifier_tokens(fallback_author_id):
            tokens.add(token)

    return list(tokens)


def _has_author_identity(value: Any, fallback_author_id: str | None = None) -> bool:
    return len(_extract_author_tokens(value, fallback_author_id)) > 0


def _extract_block11_special_tokens(value: Any) -> list[str]:
    tokens: set[str] = set()

    for token in _extract_rod_tokens(value):
        if token in ROD_SINGLE_USE_IN_BLOCK11:
            tokens.add(token)

    if _is_exclusive_question(value):
        tokens.add("искл вопрос")

    return list(tokens)


def _get_block11_special_signature(value: Any) -> str:
    return "|".join(sorted(_extract_block11_special_tokens(value)))


def _pick_random_preserving_rod(pool: list[dict[str, Any]], original: dict[str, Any] | None) -> dict[str, Any] | None:
    """Pick a random question from pool, preferring one with the same rod signature as original."""
    if not pool:
        return None
    if not original:
        return _pick_random(pool)
    target_signature = _get_block11_special_signature(original)
    if not target_signature:
        return _pick_random(pool)
    matching = [q for q in pool if _get_block11_special_signature(q) == target_signature]
    return _pick_random(matching) if matching else _pick_random(pool)


def _get_block11_questions(variant: dict[str, Any]) -> list[Any]:
    return [
        variant.get("task11_1"),
        variant.get("task11_2"),
        variant.get("task11_3"),
        variant.get("task11_4"),
        variant.get("task11_5"),
    ]


def _evaluate_block11_requirements(variant: dict[str, Any]) -> dict[str, Any]:
    rod_counts: dict[str, int] = {}
    exclusive_count = 0

    for question in _get_block11_questions(variant):
        if not question:
            continue

        for rod in _extract_rod_tokens(question):
            if rod in ROD_SINGLE_USE_IN_BLOCK11:
                rod_counts[rod] = rod_counts.get(rod, 0) + 1

        if _is_exclusive_question(question):
            exclusive_count += 1

    required_rod_coverage = all(rod_counts.get(rod, 0) >= 1 for rod in ROD_SINGLE_USE_IN_BLOCK11)
    required_rod_uniqueness = all(rod_counts.get(rod, 0) <= 1 for rod in ROD_SINGLE_USE_IN_BLOCK11)
    required_rod_exact = required_rod_coverage and required_rod_uniqueness
    exclusive_exact = exclusive_count == 1

    return {
        "ok": required_rod_exact and exclusive_exact,
        "rodCounts": rod_counts,
        "requiredRodCoverage": required_rod_coverage,
        "requiredRodUniqueness": required_rod_uniqueness,
        "exclusiveCount": exclusive_count,
        "exclusiveDistance": abs(exclusive_count - 1),
    }


def _has_required_block11_signature(variant: dict[str, Any]) -> bool:
    return bool(_evaluate_block11_requirements(variant).get("ok"))


def _get_block11_rod_layout_signature(variant: dict[str, Any]) -> str:
    layout: list[str] = []
    for key in BLOCK11_KEYS:
        rods = sorted(set(_extract_rod_tokens(variant.get(key))))
        layout.append(",".join(rods))
    return "|".join(layout)


def _count_block11_identity_differences(current: dict[str, Any], candidate: dict[str, Any]) -> int:
    return sum(
        1
        for key in BLOCK11_KEYS
        if _get_variant_task_identity(current, key) != _get_variant_task_identity(candidate, key)
    )


def _get_block11_rod_positions(variant: dict[str, Any]) -> dict[str, int]:
    """Return {rod: slot_index} for each required rod in the variant."""
    positions: dict[str, int] = {}
    for i, key in enumerate(BLOCK11_KEYS):
        for rod in _extract_rod_tokens(variant.get(key)):
            if rod in ROD_SINGLE_USE_IN_BLOCK11 and rod not in positions:
                positions[rod] = i
    return positions


def _count_block11_rod_position_changes(current: dict[str, Any], candidate: dict[str, Any]) -> int:
    """Count how many required rods moved to a different slot."""
    current_positions = _get_block11_rod_positions(current)
    candidate_positions = _get_block11_rod_positions(candidate)
    changes = 0
    for rod in ROD_SINGLE_USE_IN_BLOCK11:
        cur_pos = current_positions.get(rod)
        cand_pos = candidate_positions.get(rod)
        if cur_pos is not None and cand_pos is not None and cur_pos != cand_pos:
            changes += 1
    return changes


def _get_block11_diversity_score(current: dict[str, Any], candidate: dict[str, Any]) -> int:
    identity_differences = _count_block11_identity_differences(current, candidate)
    rod_position_changes = _count_block11_rod_position_changes(current, candidate)
    return identity_differences + rod_position_changes * 10


def _extract_service_tags(value: Any) -> list[str]:
    return [tag for tag in _get_tags(value) if tag in SERVICE_TAGS]


def _is_structural_tag(tag: str) -> bool:
    if tag in SERVICE_TAGS:
        return True
    if tag in NO_AUTHOR_TAGS:
        return True
    if _is_author_tag(tag):
        return True
    if _is_term_tag(tag):
        return True
    if _is_theme_tag(tag):
        return True
    if _is_rod_tag(tag):
        return True
    if _is_character_tag(tag):
        return True
    return False


def _extract_custom_internal_tags(value: Any) -> list[str]:
    result: list[str] = []
    for tag in _get_tags(value):
        if _is_structural_tag(tag):
            continue
        result.append("искл вопрос" if _is_exclusive_question_tag(tag) else tag)
    return result


def _has_character_tag(value: Any) -> bool:
    return any(_is_character_tag(tag) for tag in _get_tags(value))


def _normalize_comparable_id(value: str) -> str:
    return value.strip().lower()


def _build_id_exclusion_set(values: list[str] | None) -> set[str]:
    tokens: set[str] = set()
    for value in values or []:
        for token in _split_values(str(value or "")):
            normalized = _normalize_comparable_id(token)
            if normalized:
                tokens.add(normalized)
    return tokens


def _has_excluded_id(exclusions: set[str], value: str) -> bool:
    return _normalize_comparable_id(value) in exclusions


def _build_identifier_exclusion_set(values: list[str] | None) -> set[str]:
    tokens: set[str] = set()
    for value in values or []:
        for token in _parse_identifier_tokens(value):
            tokens.add(token)
    return tokens


def _is_term_question(question: dict[str, Any]) -> bool:
    if isinstance(question.get("isTermQuestion"), bool):
        return bool(question["isTermQuestion"])

    raw_values: list[str] = []
    for value in [question.get("tags"), question.get("tag")]:
        if isinstance(value, str):
            raw_values.append(value)
        elif isinstance(value, list):
            raw_values.extend([entry for entry in value if isinstance(entry, str)])

    raw_joined = ",".join(raw_values)
    if raw_joined:
        normalized_tags = [
            _normalize_tag(tag)
            for tag in _split_values(raw_joined)
            if _normalize_tag(tag)
        ]
        return any(tag == "термин" or tag.startswith("термин:") for tag in normalized_tags)

    return bool(question.get("termId"))


def _filter_task1_by_settings(questions: list[dict[str, Any]], filters: dict[str, bool]) -> list[dict[str, Any]]:
    include_work_questions = bool(filters.get("includeWorkQuestions", True))
    include_term_questions = bool(filters.get("includeTermQuestions", True))

    if include_work_questions and include_term_questions:
        return questions

    if not include_work_questions and not include_term_questions:
        return questions

    filtered: list[dict[str, Any]] = []
    for question in questions:
        term_question = _is_term_question(question)
        if include_term_questions and term_question:
            filtered.append(question)
            continue
        if include_work_questions and not term_question:
            filtered.append(question)
    return filtered


def _normalize_task2_comparable(value: str) -> str:
    cleaned = str(value).replace("&nbsp;", " ").replace("\xa0", " ")
    cleaned = re.sub(r"<[^>]*>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip().lower()


def _build_text_exclusion_set(values: list[str] | None) -> set[str]:
    tokens: set[str] = set()
    for value in values or []:
        normalized = _normalize_task2_comparable(value)
        if normalized:
            tokens.add(normalized)
    return tokens


def _build_task2_runtime_exclusions(excerpt_tasks: dict[str, Any] | None) -> dict[str, set[str]]:
    excerpt_tasks = excerpt_tasks or {}
    return {
        "characters": _build_text_exclusion_set(excerpt_tasks.get("excludeTask2Characters")),
        "properties": _build_text_exclusion_set(excerpt_tasks.get("excludeTask2Properties")),
    }


def _get_property_id_at(pair: dict[str, Any], index: int) -> str:
    """Return the propertyId at the given index, or empty string."""
    ids = pair.get("propertyIds")
    if isinstance(ids, list) and index < len(ids) and isinstance(ids[index], str):
        return ids[index].strip()
    return ""


def _build_property_id_lookup(pair: dict[str, Any]) -> dict[str, str]:
    """Map property text → propertyId for all property-like fields on a pair."""
    ids = pair.get("propertyIds")
    if not isinstance(ids, list):
        return {}
    mapping: dict[str, str] = {}
    for field in ("properties", "phrases", "characteristics"):
        raw = pair.get(field)
        if not isinstance(raw, list):
            continue
        for i, val in enumerate(raw):
            if not isinstance(val, str) or not val.strip():
                continue
            key = val.strip()
            if key not in mapping and i < len(ids) and isinstance(ids[i], str) and ids[i].strip():
                mapping[key] = ids[i].strip()
    return mapping


def _is_property_excluded(property_value: str, property_id: str, exclusion_set: set[str]) -> bool:
    """Check if a property is excluded by text or by its explicit propertyId."""
    if _normalize_task2_comparable(property_value) in exclusion_set:
        return True
    if property_id and _normalize_task2_comparable(property_id) in exclusion_set:
        return True
    return False


def _normalize_property_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    normalized = [str(item).strip() for item in value if isinstance(item, str) and str(item).strip()]
    unique: list[str] = []
    seen: set[str] = set()
    for entry in normalized:
        if entry in seen:
            continue
        seen.add(entry)
        unique.append(entry)
    return unique


def _get_pair_properties_by_category(pair: dict[str, Any], category: Literal["phrases", "characteristics"]) -> list[str]:
    typed = _normalize_property_list(pair.get("phrases") if category == "phrases" else pair.get("characteristics"))
    if typed:
        return typed

    has_typed_properties = bool(_normalize_property_list(pair.get("phrases")) or _normalize_property_list(pair.get("characteristics")))
    if has_typed_properties:
        return []

    return _normalize_property_list(pair.get("properties"))


def _resolve_task2_property_category(question: dict[str, Any], work: dict[str, Any]) -> Literal["phrases", "characteristics"]:
    pair_property_type = question.get("pairPropertyType")
    if pair_property_type in ("phrases", "characteristics"):
        return pair_property_type

    character_source = question.get("characterSource")
    if character_source == "quotes":
        return "phrases"
    if character_source == "facts":
        return "characteristics"

    pairs = question.get("pairs") if isinstance(question.get("pairs"), list) else []
    characters = work.get("characters") if isinstance(work.get("characters"), list) else []

    pair_has_phrases = any(_get_pair_properties_by_category(pair, "phrases") for pair in pairs if isinstance(pair, dict))
    pair_has_characteristics = any(_get_pair_properties_by_category(pair, "characteristics") for pair in pairs if isinstance(pair, dict))
    character_has_phrases = any(isinstance(character, dict) and bool(character.get("quotes")) for character in characters)
    character_has_characteristics = any(isinstance(character, dict) and bool(character.get("facts")) for character in characters)

    categories: list[Literal["phrases", "characteristics"]] = []
    if pair_has_phrases or character_has_phrases:
        categories.append("phrases")
    if pair_has_characteristics or character_has_characteristics:
        categories.append("characteristics")

    return _pick_random(categories) or "phrases"


def _pick_character_property(character: dict[str, Any], category: Literal["phrases", "characteristics"]) -> str:
    pool = character.get("quotes") if category == "phrases" else character.get("facts")
    if not isinstance(pool, list):
        return ""
    return _pick_random([value for value in pool if isinstance(value, str)]) or ""


def _parse_positive_integer(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return None
    if numeric <= 0:
        return None
    return numeric


def _get_task2_configured_character_count(question: dict[str, Any]) -> int | None:
    return _parse_positive_integer(question.get("characterCount"))


def _build_task2_pairs_from_characters(
    work: dict[str, Any],
    question: dict[str, Any],
    category: Literal["phrases", "characteristics"],
    exclusions: dict[str, set[str]],
) -> list[dict[str, Any]]:
    characters = work.get("characters") if isinstance(work.get("characters"), list) else []
    if not characters:
        return []

    requested_count = _get_task2_configured_character_count(question) or 3

    available_characters: list[dict[str, Any]] = []
    for character in characters:
        if not isinstance(character, dict):
            continue
        name = str(character.get("name") or "")
        if exclusions["characters"] and _normalize_task2_comparable(name) in exclusions["characters"]:
            continue
        char_id = str(character.get("id") or "").strip().lower()
        if exclusions["characters"] and char_id and char_id in exclusions["characters"]:
            continue

        properties = character.get("quotes") if category == "phrases" else character.get("facts")
        if not isinstance(properties, list):
            continue

        has_available = any(
            isinstance(property_value, str)
            and _normalize_task2_comparable(property_value) not in exclusions["properties"]
            for property_value in properties
        )
        if has_available:
            available_characters.append(character)

    count = min(requested_count, len(available_characters))
    if count <= 0:
        return []

    result: list[dict[str, Any]] = []
    for index, character in enumerate(_pick_many_random(available_characters, count)):
        properties_pool_raw = character.get("quotes") if category == "phrases" else character.get("facts")
        properties_pool = [
            property_value.strip()
            for property_value in properties_pool_raw or []
            if isinstance(property_value, str)
            and property_value.strip()
            and _normalize_task2_comparable(property_value) not in exclusions["properties"]
        ]
        property_value = _pick_random(properties_pool) or ""
        if not property_value:
            continue

        result.append(
            {
                "id": f"{question.get('id')}-runtime-{character.get('id') or index}",
                "character": character.get("name") or "",
                "tag": character.get("tag"),
                "properties": [property_value],
            }
        )

    return [pair for pair in result if str(pair.get("character", "")).strip() and pair.get("properties")]


def _get_prepared_task2_pairs(
    work: dict[str, Any],
    question: dict[str, Any],
    category: Literal["phrases", "characteristics"],
    exclusions: dict[str, set[str]],
) -> list[dict[str, Any]]:
    characters = work.get("characters") if isinstance(work.get("characters"), list) else []

    def find_character_by_name(character_name: str) -> dict[str, Any] | None:
        normalized_name = _normalize_task2_comparable(character_name)
        for character in characters:
            if not isinstance(character, dict):
                continue
            if _normalize_task2_comparable(str(character.get("name") or "")) == normalized_name:
                return character
        return None

    result: list[dict[str, Any]] = []
    for pair in question.get("pairs") or []:
        if not isinstance(pair, dict):
            continue

        character_name = str(pair.get("character") or "")
        if _normalize_task2_comparable(character_name) in exclusions["characters"]:
            continue
        pair_id = str(pair.get("id") or "").strip().lower()
        if pair_id and pair_id in exclusions["characters"]:
            continue

        pair_properties = _get_pair_properties_by_category(pair, category)
        allowed_pair_properties = [
            property_value
            for prop_idx, property_value in enumerate(pair_properties)
            if not _is_property_excluded(property_value, _get_property_id_at(pair, prop_idx), exclusions["properties"])
        ]

        generated_property = ""
        if not pair_properties:
            character = find_character_by_name(character_name) or {"quotes": [], "facts": []}
            generated_property = _pick_character_property(character, category)

        normalized_properties = [
            property_value.strip()
            for property_value in (allowed_pair_properties if allowed_pair_properties else [generated_property])
            if isinstance(property_value, str) and property_value.strip()
        ]
        filtered_properties = [
            property_value
            for property_value in normalized_properties
            if _normalize_task2_comparable(property_value) not in exclusions["properties"]
        ]

        unique_properties: list[str] = []
        seen: set[str] = set()
        for property_value in filtered_properties:
            if property_value in seen:
                continue
            seen.add(property_value)
            unique_properties.append(property_value)

        if not character_name.strip() or not unique_properties:
            continue

        prop_id_lookup = _build_property_id_lookup(pair)
        next_pair = copy.deepcopy(pair)
        next_pair["properties"] = unique_properties
        next_pair["propertyIds"] = [prop_id_lookup.get(p, "") for p in unique_properties]
        result.append(next_pair)

    return result


def _pick_task2_pairs_with_single_options(pairs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not pairs:
        return []

    best_attempt: list[dict[str, Any]] = []
    best_unique_count = -1

    for _ in range(TASK2_PAIR_PICK_ATTEMPTS):
        used_options: set[str] = set()
        used_tags: set[str] = set()
        attempt_pairs: list[dict[str, Any]] = []

        for pair in pairs:
            pair_tag = str(pair.get("tag") or "").strip().lower()
            if pair_tag and pair_tag in used_tags:
                continue

            props = pair.get("properties") or []
            prop_ids = pair.get("propertyIds") or []
            indices = list(range(len(props)))
            random.shuffle(indices)

            sel_idx = next((i for i in indices if props[i] not in used_options), None)
            if sel_idx is None:
                sel_idx = indices[0] if indices else None
            if sel_idx is None:
                continue

            selected = props[sel_idx]
            selected_id = prop_ids[sel_idx] if sel_idx < len(prop_ids) and isinstance(prop_ids[sel_idx], str) else ""
            if not selected:
                continue
            used_options.add(selected)
            if pair_tag:
                used_tags.add(pair_tag)
            next_pair = copy.deepcopy(pair)
            next_pair["properties"] = [selected]
            next_pair["propertyIds"] = [selected_id]
            attempt_pairs.append(next_pair)

        unique_count = len({pair.get("properties", [""])[0] for pair in attempt_pairs if pair.get("properties")})

        if unique_count > best_unique_count:
            best_attempt = attempt_pairs
            best_unique_count = unique_count

        if unique_count == len(attempt_pairs):
            return attempt_pairs

    return best_attempt


def _first_task2_property(pair: dict[str, Any]) -> str:
    properties = pair.get("properties")
    if not isinstance(properties, list):
        return ""
    for value in properties:
        if isinstance(value, str):
            normalized = value.strip()
            if normalized:
                return normalized
    return ""


def _normalize_runtime_task2_pairs(pairs: Any) -> list[dict[str, Any]]:
    if not isinstance(pairs, list):
        return []

    result: list[dict[str, Any]] = []
    for pair in pairs:
        if not isinstance(pair, dict):
            continue
        character = str(pair.get("character") or "").strip()
        property_value = _first_task2_property(pair)
        if not character or not property_value:
            continue
        prop_id_lookup = _build_property_id_lookup(pair)
        next_pair = copy.deepcopy(pair)
        next_pair["character"] = character
        next_pair["properties"] = [property_value]
        next_pair["propertyIds"] = [prop_id_lookup.get(property_value, "")]
        result.append(next_pair)
    return result


def _build_task2_pair_pool(
    work: dict[str, Any],
    question: dict[str, Any],
    property_category: Literal["phrases", "characteristics"],
    exclusions: dict[str, set[str]],
    normalized_pairs: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    by_character: dict[str, dict[str, Any]] = {}
    prop_id_maps: dict[str, dict[str, str]] = {}

    def add_pair(
        character_name: str,
        properties: list[str],
        pair_id: str = "",
        tag: str = "",
        property_id_lookup: dict[str, str] | None = None,
    ) -> None:
        normalized_character = _normalize_task2_comparable(character_name)
        if not normalized_character or normalized_character in exclusions["characters"]:
            return
        normalized_pair_id = pair_id.strip().lower() if pair_id else ""
        if normalized_pair_id and normalized_pair_id in exclusions["characters"]:
            return

        filtered_properties = [
            property_value
            for property_value in properties
            if property_value and not _is_property_excluded(
                property_value,
                (property_id_lookup or {}).get(property_value, ""),
                exclusions["properties"],
            )
        ]
        if not filtered_properties:
            return

        if property_id_lookup:
            char_map = prop_id_maps.setdefault(normalized_character, {})
            for prop in filtered_properties:
                pid = property_id_lookup.get(prop, "")
                if pid:
                    char_map.setdefault(prop, pid)

        existing = by_character.get(normalized_character)
        if existing is None:
            by_character[normalized_character] = {
                "id": pair_id or f"{question.get('id')}-runtime-{len(by_character)}",
                "character": character_name.strip(),
                "tag": tag or "",
                "properties": list(dict.fromkeys(filtered_properties)),
            }
            return

        existing["properties"] = list(dict.fromkeys((existing.get("properties") or []) + filtered_properties))
        if tag and not existing.get("tag"):
            existing["tag"] = tag

    for pair in normalized_pairs:
        character_name = str(pair.get("character") or "").strip()
        properties = [
            str(property_value).strip()
            for property_value in pair.get("properties") or []
            if isinstance(property_value, str) and str(property_value).strip()
        ]
        add_pair(
            character_name,
            properties,
            str(pair.get("id") or ""),
            str(pair.get("tag") or ""),
            property_id_lookup=_build_property_id_lookup(pair),
        )

    for index, character in enumerate(work.get("characters") or []):
        if not isinstance(character, dict):
            continue

        character_name = str(character.get("name") or "").strip()
        if not character_name:
            continue

        source = character.get("quotes") if property_category == "phrases" else character.get("facts")
        if not isinstance(source, list):
            continue

        properties = [
            str(value).strip()
            for value in source
            if isinstance(value, str) and str(value).strip()
        ]
        add_pair(
            character_name,
            properties,
            f"{question.get('id')}-runtime-{character.get('id') or index}",
            str(character.get("tag") or ""),
        )

    result = list(by_character.values())
    for entry in result:
        normalized_character = _normalize_task2_comparable(str(entry.get("character") or ""))
        char_map = prop_id_maps.get(normalized_character, {})
        entry["propertyIds"] = [char_map.get(p, "") for p in entry.get("properties", [])]
    return result


def _build_runtime_task2_with_pairs(
    work: dict[str, Any],
    question: dict[str, Any],
    excerpt_tasks: dict[str, Any] | None,
    property_category: Literal["phrases", "characteristics"],
    exclusions: dict[str, set[str]],
    normalized_pairs: list[dict[str, Any]],
    pairs: list[dict[str, Any]],
) -> dict[str, Any] | None:
    pairs = _normalize_runtime_task2_pairs(pairs)
    if not pairs:
        return None

    excerpt_tasks = excerpt_tasks or {}
    task2_id_exclusions = _build_id_exclusion_set(excerpt_tasks.get("excludeTask2Ids"))
    task2_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask2TermIds"))

    used_characters = {str(pair.get("character") or "").strip().lower() for pair in pairs}
    same_question_distractors = [
        str(property_value).strip()
        for pair in normalized_pairs
        if str(pair.get("character") or "").strip().lower() not in used_characters
        for property_value in pair.get("properties") or []
        if isinstance(property_value, str) and property_value.strip()
    ]

    all_work_task2 = [
        entry
        for entry in _filter_active_items(work.get("commonTasks", {}).get("task2") or [])
        if not _has_excluded_id(task2_id_exclusions, str(entry.get("id") or ""))
        and not any(token in task2_term_exclusions for token in _extract_term_tokens(entry, "task2-distractor"))
    ]

    all_work_pairs: list[dict[str, Any]] = []
    for entry in all_work_task2:
        all_work_pairs.extend(
            _get_prepared_task2_pairs(work, entry, _resolve_task2_property_category(entry, work), exclusions)
        )

    candidate_pairs = [
        pair
        for pair in all_work_pairs
        if str(pair.get("character") or "").strip().lower() not in used_characters
        and _normalize_task2_comparable(str(pair.get("character") or "")) not in exclusions["characters"]
    ]

    distractor_properties = [
        property_value
        for pair in candidate_pairs
        for property_value in pair.get("properties") or []
        if isinstance(property_value, str)
        and property_value
        and _normalize_task2_comparable(property_value) not in exclusions["properties"]
    ]

    character_distractors: list[str] = []
    for character in work.get("characters") or []:
        if not isinstance(character, dict):
            continue
        character_name = str(character.get("name") or "").strip().lower()
        if character_name in used_characters:
            continue
        if _normalize_task2_comparable(str(character.get("name") or "")) in exclusions["characters"]:
            continue

        properties_pool_raw = character.get("quotes") if property_category == "phrases" else character.get("facts")
        property_pool = [
            property_value.strip()
            for property_value in properties_pool_raw or []
            if isinstance(property_value, str)
            and property_value.strip()
            and _normalize_task2_comparable(property_value) not in exclusions["properties"]
        ]
        selected = _pick_random(property_pool) or ""
        if selected:
            character_distractors.append(selected)

    distractor_pool = list(dict.fromkeys(distractor_properties + character_distractors))

    right_options: list[str] = []
    right_option_ids: list[str] = []
    for pair in pairs:
        props = pair.get("properties") or []
        prop_ids = pair.get("propertyIds") or []
        if props and isinstance(props[0], str) and props[0]:
            right_options.append(props[0])
            right_option_ids.append(prop_ids[0] if prop_ids and isinstance(prop_ids[0], str) else "")
    used_right_options = set(right_options)

    same_question_extra_option_candidates = [
        option
        for option in dict.fromkeys(same_question_distractors)
        if option not in used_right_options
    ]
    same_question_extra_option = _pick_random(same_question_extra_option_candidates) or ""

    explicit_extra_option = str(question.get("extraOption") or "").strip()

    extra_option_candidate = same_question_extra_option
    if not extra_option_candidate:
        if (
            explicit_extra_option
            and explicit_extra_option not in used_right_options
            and _normalize_task2_comparable(explicit_extra_option) not in exclusions["properties"]
        ):
            extra_option_candidate = explicit_extra_option
        else:
            extra_option_candidate = _pick_random([option for option in distractor_pool if option not in used_right_options]) or ""

    fallback_extra_option = "Лишний вариант" if TASK2_EXTRA_OPTION_FALLBACK in used_right_options else TASK2_EXTRA_OPTION_FALLBACK
    extra_option = extra_option_candidate if extra_option_candidate and extra_option_candidate not in used_right_options else fallback_extra_option

    options_with_ids = list(zip(right_options + [extra_option], right_option_ids + [""]))
    shuffled = _shuffle(options_with_ids)

    next_question = copy.deepcopy(question)
    next_question["pairPropertyType"] = property_category
    next_question["pairs"] = pairs
    next_question["extraOption"] = extra_option
    next_question["shuffledRightOptions"] = [o for o, _ in shuffled]
    next_question["shuffledRightOptionIds"] = [pid for _, pid in shuffled]
    return next_question


def _build_runtime_task2_replacement_candidates(
    work: dict[str, Any],
    question: dict[str, Any],
    property_category: Literal["phrases", "characteristics"],
    exclusions: dict[str, set[str]],
    normalized_pairs: list[dict[str, Any]],
    current_pairs: list[dict[str, Any]],
    pair_index: int,
    action: Literal["character", "property"],
) -> list[dict[str, Any]]:
    if not current_pairs or pair_index < 0 or pair_index >= len(current_pairs):
        return []

    selected_pair = current_pairs[pair_index]
    selected_character = _normalize_task2_comparable(str(selected_pair.get("character") or ""))
    selected_property = _normalize_task2_comparable(_first_task2_property(selected_pair))

    other_characters = {
        _normalize_task2_comparable(str(pair.get("character") or ""))
        for index, pair in enumerate(current_pairs)
        if index != pair_index
    }
    other_properties = {
        _normalize_task2_comparable(_first_task2_property(pair))
        for index, pair in enumerate(current_pairs)
        if index != pair_index
    }
    other_tags = {
        str(pair.get("tag") or "").strip().lower()
        for index, pair in enumerate(current_pairs)
        if index != pair_index
    } - {""}

    pair_pool = _build_task2_pair_pool(work, question, property_category, exclusions, normalized_pairs)
    candidates: list[dict[str, Any]] = []
    seen: set[str] = set()

    if action == "character":
        for pool_pair in pair_pool:
            candidate_character = _normalize_task2_comparable(str(pool_pair.get("character") or ""))
            if (
                not candidate_character
                or candidate_character == selected_character
                or candidate_character in other_characters
            ):
                continue
            candidate_tag = str(pool_pair.get("tag") or "").strip().lower()
            if candidate_tag and candidate_tag in other_tags:
                continue

            pool_id_lookup = _build_property_id_lookup(pool_pair)
            for property_value in pool_pair.get("properties") or []:
                if not isinstance(property_value, str) or not property_value.strip():
                    continue
                normalized_property = _normalize_task2_comparable(property_value)
                if normalized_property in other_properties:
                    continue

                identity = f"{candidate_character}::{normalized_property}"
                if identity in seen:
                    continue
                seen.add(identity)

                next_pair = copy.deepcopy(pool_pair)
                next_pair["properties"] = [property_value.strip()]
                next_pair["propertyIds"] = [pool_id_lookup.get(property_value.strip(), "")]
                candidates.append(next_pair)

                if len(candidates) >= TASK2_PARTIAL_REFRESH_MAX_CANDIDATES:
                    return candidates

        return candidates

    for pool_pair in pair_pool:
        candidate_character = _normalize_task2_comparable(str(pool_pair.get("character") or ""))
        if candidate_character != selected_character:
            continue

        pool_id_lookup = _build_property_id_lookup(pool_pair)
        for property_value in pool_pair.get("properties") or []:
            if not isinstance(property_value, str) or not property_value.strip():
                continue
            normalized_property = _normalize_task2_comparable(property_value)
            if (
                normalized_property == selected_property
                or normalized_property in other_properties
            ):
                continue

            identity = f"{candidate_character}::{normalized_property}"
            if identity in seen:
                continue
            seen.add(identity)

            next_pair = copy.deepcopy(selected_pair)
            next_pair["properties"] = [property_value.strip()]
            next_pair["propertyIds"] = [pool_id_lookup.get(property_value.strip(), "")]
            candidates.append(next_pair)

            if len(candidates) >= TASK2_PARTIAL_REFRESH_MAX_CANDIDATES:
                return candidates

    return candidates


def _build_runtime_task2_all_properties_candidates(
    work: dict[str, Any],
    question: dict[str, Any],
    property_category: Literal["phrases", "characteristics"],
    exclusions: dict[str, set[str]],
    normalized_pairs: list[dict[str, Any]],
    current_pairs: list[dict[str, Any]],
) -> list[list[dict[str, Any]]]:
    if not current_pairs:
        return []

    pair_pool = _build_task2_pair_pool(work, question, property_category, exclusions, normalized_pairs)
    properties_by_character: dict[str, list[str]] = {}
    prop_ids_by_character: dict[str, dict[str, str]] = {}
    for pair in pair_pool:
        normalized_character = _normalize_task2_comparable(str(pair.get("character") or ""))
        if not normalized_character:
            continue
        values = [
            str(value).strip()
            for value in pair.get("properties") or []
            if isinstance(value, str) and str(value).strip()
        ]
        if values:
            properties_by_character[normalized_character] = list(dict.fromkeys(values))
            char_id_map = prop_ids_by_character.setdefault(normalized_character, {})
            pool_id_lookup = _build_property_id_lookup(pair)
            for v in values:
                pid = pool_id_lookup.get(v, "")
                if pid:
                    char_id_map.setdefault(v, pid)

    candidates: list[list[dict[str, Any]]] = []
    seen_signatures: set[str] = set()
    attempts = max(80, TASK2_PARTIAL_REFRESH_MAX_CANDIDATES)

    for _ in range(attempts):
        next_pairs = copy.deepcopy(current_pairs)
        used_properties: set[str] = set()
        changed = False
        valid = True
        randomized_indices = list(range(len(next_pairs)))
        random.shuffle(randomized_indices)

        for index in randomized_indices:
            pair = next_pairs[index]
            normalized_character = _normalize_task2_comparable(str(pair.get("character") or ""))
            if not normalized_character:
                valid = False
                break

            pool = properties_by_character.get(normalized_character, [])
            if not pool:
                valid = False
                break

            current_value = _first_task2_property(pair)
            current_normalized = _normalize_task2_comparable(current_value)

            available_new = [
                value
                for value in pool
                if _normalize_task2_comparable(value) != current_normalized
                and _normalize_task2_comparable(value) not in used_properties
            ]
            available_any = [
                value
                for value in pool
                if _normalize_task2_comparable(value) not in used_properties
            ]

            selected = ""
            if available_new:
                selected = _pick_random(available_new) or ""
            elif available_any:
                selected = _pick_random(available_any) or ""
            elif current_normalized and current_normalized not in used_properties:
                selected = current_value

            if not selected:
                valid = False
                break

            selected_normalized = _normalize_task2_comparable(selected)
            if selected_normalized != current_normalized:
                changed = True

            used_properties.add(selected_normalized)
            pair["properties"] = [selected]
            pair["propertyIds"] = [prop_ids_by_character.get(normalized_character, {}).get(selected, "")]

        if not valid or not changed:
            continue

        signature = "||".join(
            f"{_normalize_task2_comparable(str(pair.get('character') or ''))}::{_normalize_task2_comparable(_first_task2_property(pair))}"
            for pair in next_pairs
        )
        if signature in seen_signatures:
            continue
        seen_signatures.add(signature)
        candidates.append(next_pairs)
        if len(candidates) >= TASK2_PARTIAL_REFRESH_MAX_CANDIDATES:
            break

    return candidates


def _build_runtime_task2(work: dict[str, Any], question: dict[str, Any] | None, excerpt_tasks: dict[str, Any] | None = None) -> dict[str, Any] | None:
    if not question:
        return None

    excerpt_tasks = excerpt_tasks or {}
    property_category = _resolve_task2_property_category(question, work)
    exclusions = _build_task2_runtime_exclusions(excerpt_tasks)
    normalized_pairs = _get_prepared_task2_pairs(work, question, property_category, exclusions)

    configured_pair_count = _get_task2_configured_character_count(question)
    limited_pairs = (
        _pick_many_random(normalized_pairs, min(configured_pair_count, len(normalized_pairs)))
        if configured_pair_count
        else normalized_pairs
    )

    base_pairs = limited_pairs if limited_pairs else _build_task2_pairs_from_characters(work, question, property_category, exclusions)
    pairs = _pick_task2_pairs_with_single_options(base_pairs)

    if configured_pair_count and len(pairs) < configured_pair_count:
        return None

    return _build_runtime_task2_with_pairs(
        work,
        question,
        excerpt_tasks,
        property_category,
        exclusions,
        normalized_pairs,
        pairs,
    )


def _create_runtime_id(base: str, suffix: int = 0) -> str:
    del suffix
    return base


def _dedupe_two_gap_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for entry in entries:
        key = "::".join(
            [
                str(entry.get("id") or ""),
                str(entry.get("part1") or ""),
                str(entry.get("answer1") or ""),
                str(entry.get("part2") or ""),
                str(entry.get("answer2") or ""),
            ]
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(entry)
    return result


def _extract_two_gap_term_tokens(entry: dict[str, Any]) -> set[str]:
    tokens: set[str] = set()

    for raw in [entry.get("termId1"), entry.get("termId2")]:
        for token in _split_values(str(raw or "")):
            normalized = token.lower().strip()
            if normalized:
                tokens.add(normalized)

    for tag in _split_values(str(entry.get("tags") or "")):
        normalized_tag = tag.strip().lower()
        if not normalized_tag.startswith("термин:"):
            continue
        payload = normalized_tag[len("термин:") :]
        for token in _split_values(payload):
            normalized = token.lower().strip()
            if normalized:
                tokens.add(normalized)

    return tokens


def _extract_two_gap_tags(entry: dict[str, Any]) -> set[str]:
    return {tag.lower().lstrip("#").strip() for tag in _split_values(str(entry.get("tags") or "")) if tag.strip()}


def _has_token_overlap(left: set[str], right: set[str]) -> bool:
    return any(token in right for token in left)


def _has_own_second_gap(entry: dict[str, Any]) -> bool:
    return bool(str(entry.get("part2") or "").strip() or str(entry.get("answer2") or "").strip() or str(entry.get("termId2") or "").strip())


def _build_single_runtime_two_gap(entry: dict[str, Any], runtime_key: str) -> dict[str, Any]:
    return {
        "id": _create_runtime_id(f"{runtime_key}-{entry.get('id')}") ,
        "part1": entry.get("part1") or "",
        "part2": str(entry.get("part2") or "").strip() or "_____",
        "answer1": entry.get("answer1") or "",
        "answer2": entry.get("answer2") or "",
        "termId1": entry.get("termId1"),
        "termId2": entry.get("termId2") or "",
        "tags": entry.get("tags"),
        "withoutAuthor": entry.get("withoutAuthor"),
    }


def _build_paired_runtime_two_gap(first: dict[str, Any], second: dict[str, Any], runtime_key: str) -> dict[str, Any]:
    return {
        "id": _create_runtime_id(f"{runtime_key}-{first.get('id')}-{second.get('id')}") ,
        "part1": first.get("part1") or "",
        "part2": str(second.get("part1") or "").strip() or "_____",
        "answer1": first.get("answer1") or "",
        "answer2": second.get("answer1") or "",
        "termId1": first.get("termId1"),
        "termId2": second.get("termId1"),
        "tags": ", ".join([value for value in [first.get("tags"), second.get("tags")] if value]),
        "withoutAuthor": bool(first.get("withoutAuthor") or second.get("withoutAuthor")),
    }


def _build_runtime_two_gap_candidates(entries: list[dict[str, Any]], runtime_key: str) -> list[dict[str, Any]]:
    if not entries:
        return []

    valid_entries = [entry for entry in entries if _is_two_gap_valid(entry)]
    if not valid_entries:
        return []

    standalone_candidates = [
        _build_single_runtime_two_gap(entry, runtime_key)
        for entry in valid_entries
        if _has_own_second_gap(entry) and not entry.get("withoutAuthor")
    ]

    pairable_entries = [entry for entry in valid_entries if not _has_own_second_gap(entry)]
    paired_candidates: list[dict[str, Any]] = []

    for first in pairable_entries:
        if first.get("withoutAuthor"):
            continue

        first_term_tokens = _extract_two_gap_term_tokens(first)
        first_tags = _extract_two_gap_tags(first)
        first_has_author_tag = any(_is_author_tag(tag) for tag in _get_tags(first))

        for second in pairable_entries:
            if str(first.get("id")) == str(second.get("id")):
                continue
            if not str(second.get("part1") or "").strip():
                continue

            if second.get("withoutAuthor") and not first_has_author_tag:
                continue

            second_term_tokens = _extract_two_gap_term_tokens(second)
            second_tags = _extract_two_gap_tags(second)
            runtime_question = _build_paired_runtime_two_gap(first, second, runtime_key)

            if (
                _has_token_overlap(first_term_tokens, second_term_tokens)
                or _has_token_overlap(first_tags, second_tags)
                or not _is_two_gap_valid(runtime_question)
            ):
                continue

            paired_candidates.append(runtime_question)

    if paired_candidates:
        return _dedupe_two_gap_entries(paired_candidates + standalone_candidates)

    fallback = [
        _build_single_runtime_two_gap(entry, runtime_key)
        for entry in valid_entries
        if not entry.get("withoutAuthor")
    ]
    if fallback:
        return _dedupe_two_gap_entries(fallback)

    return _dedupe_two_gap_entries([_build_single_runtime_two_gap(entry, runtime_key) for entry in valid_entries])


def _build_runtime_two_gap(entries: list[dict[str, Any]], runtime_key: str) -> dict[str, Any] | None:
    return _pick_random(_build_runtime_two_gap_candidates(entries, runtime_key))


def _build_task_pools(
    work: dict[str, Any],
    excerpt: dict[str, Any],
    task1_filters: dict[str, bool],
    works: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    excerpt_tasks = excerpt.get("tasks") if isinstance(excerpt.get("tasks"), dict) else {}

    task1_id_exclusions = _build_id_exclusion_set(excerpt_tasks.get("excludeTask1Ids"))
    task1_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask1TermIds"))
    task2_id_exclusions = _build_id_exclusion_set(excerpt_tasks.get("excludeTask2Ids"))
    task2_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask2TermIds"))
    task3_id_exclusions = _build_id_exclusion_set(excerpt_tasks.get("excludeTask3Ids"))
    task3_term_exclusions = _build_identifier_exclusion_set(excerpt_tasks.get("excludeTask3TermIds"))

    def matches_excluded_term(value: Any, excluded: set[str], fallback_prefix: str) -> bool:
        return bool(excluded) and any(token in excluded for token in _extract_term_tokens(value, fallback_prefix))

    def matches_excluded_id(value: str, excluded: set[str]) -> bool:
        return _has_excluded_id(excluded, value)

    work_common_tasks = work.get("commonTasks") if isinstance(work.get("commonTasks"), dict) else {}

    task1_raw = (
        _filter_active_items(work_common_tasks.get("task1") or [])
        + _filter_active_items(excerpt_tasks.get("customTask1") or [])
    )
    task1_raw = [
        question
        for question in task1_raw
        if not matches_excluded_id(str(question.get("id") or ""), task1_id_exclusions)
        and not matches_excluded_term(question, task1_term_exclusions, "excerpt-task1")
    ]
    task1 = _filter_task1_by_settings(task1_raw, task1_filters)

    task2 = (
        _filter_active_items(work_common_tasks.get("task2") or [])
        + _filter_active_items(excerpt_tasks.get("customTask2") or [])
    )
    task2 = [
        question
        for question in task2
        if not matches_excluded_id(str(question.get("id") or ""), task2_id_exclusions)
        and not matches_excluded_term(question, task2_term_exclusions, "excerpt-task2")
    ]

    local_task3 = (
        _filter_active_items(work_common_tasks.get("task3") or [])
        + _filter_active_items(excerpt_tasks.get("customTask3") or [])
    )
    local_task3 = [
        question
        for question in local_task3
        if not matches_excluded_id(str(question.get("id") or ""), task3_id_exclusions)
        and not matches_excluded_term(question, task3_term_exclusions, "excerpt-task3")
        and _is_two_gap_valid(question)
    ]

    task3 = _dedupe_two_gap_entries(local_task3)

    return {
        "task1": task1,
        "task2": task2,
        "task3": task3,
        "task4_1": _filter_active_items(excerpt_tasks.get("task4_1") or []),
        "task4_2": _filter_active_items(excerpt_tasks.get("task4_2") or []),
        "task5": _filter_active_items(excerpt_tasks.get("task5") or []),
    }


def _build_poem_pools(
    poem: dict[str, Any],
    poets: list[dict[str, Any]],
    selected_theme_id: str = "",
    excluded_theme_tokens: set[str] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    poem_tasks = poem.get("tasks") if isinstance(poem.get("tasks"), dict) else {}

    active_task10 = _filter_active_items(poem_tasks.get("task10") or [])
    if selected_theme_id:
        filtered_task10 = [
            task
            for task in active_task10
            if task.get("theme1Id") == selected_theme_id
            or task.get("theme2Id") == selected_theme_id
        ]
    else:
        filtered_task10 = active_task10

    if excluded_theme_tokens:
        def _has_excluded_theme(task: dict[str, Any]) -> bool:
            return bool(excluded_theme_tokens.intersection(_extract_theme_tokens(task, "task10")))
        narrowed = [task for task in filtered_task10 if not _has_excluded_theme(task)]
        if narrowed:
            filtered_task10 = narrowed

    local_task6 = [entry for entry in _filter_active_items(poem_tasks.get("task6") or []) if _is_two_gap_valid(entry)]
    return {
        "task6": _dedupe_two_gap_entries(local_task6),
        "task7": _filter_active_items(poem_tasks.get("task7") or []),
        "task8": _filter_active_items(poem_tasks.get("task8") or []),
        "task9_1": _filter_active_items(poem_tasks.get("task9_1") or []),
        "task9_2": _filter_active_items(poem_tasks.get("task9_2") or []),
        "task10": filtered_task10,
    }


def _option_key(option: dict[str, Any]) -> str:
    return f"{option.get('termId') or ''}::{option.get('term') or ''}"


def _build_task8_options(base_question: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not base_question or not isinstance(base_question.get("options"), list):
        return []

    deduped: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    for index, option in enumerate(base_question.get("options") or []):
        if not isinstance(option, dict):
            continue
        term = str(option.get("term") or "").strip()
        if not term:
            continue
        normalized = {**option, "id": option.get("id") or f"task8-opt-{index + 1}", "term": term}
        key = _option_key(normalized)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(normalized)

    correct = _shuffle([option for option in deduped if bool(option.get("isCorrect"))])
    incorrect = _shuffle([option for option in deduped if not bool(option.get("isCorrect"))])

    target_total = min(TASK8_MAX_OPTIONS, len(deduped))
    if target_total <= 1 or not correct or not incorrect:
        return _shuffle(deduped)[:target_total]

    min_correct_by_pool = max(1, target_total - len(incorrect))
    max_correct_by_pool = min(len(correct), target_total - 1)
    preferred_min_correct = min(TASK8_MIN_CORRECT_OPTIONS, target_total - 1)
    preferred_max_correct = min(TASK8_MAX_CORRECT_OPTIONS, target_total - 1)

    min_correct = max(min_correct_by_pool, preferred_min_correct)
    max_correct = min(max_correct_by_pool, preferred_max_correct)

    if min_correct > max_correct:
        fallback_correct_count = min(max_correct_by_pool, max(min_correct_by_pool, preferred_min_correct))
        if fallback_correct_count <= 0:
            return _shuffle(deduped)[:target_total]
        min_correct = fallback_correct_count
        max_correct = fallback_correct_count

    correct_count = min_correct if min_correct == max_correct else random.randint(min_correct, max_correct)
    incorrect_count = target_total - correct_count

    return _shuffle(correct[:correct_count] + incorrect[:incorrect_count])


def _get_task8_options_signature(options: list[dict[str, Any]]) -> str:
    return "|".join(
        f"{index}:{option.get('id')}:{option.get('termId') or ''}:{option.get('term') or ''}:{1 if option.get('isCorrect') else 0}"
        for index, option in enumerate(options)
    )


def _filter_with_fallback(items: list[dict[str, Any]], predicate: Callable[[dict[str, Any]], bool]) -> list[dict[str, Any]]:
    filtered = [item for item in items if predicate(item)]
    return filtered if filtered else items


def _build_block3_pools(
    block3: dict[str, list[dict[str, Any]]],
    preferred_author_id: str,
    excluded_author_ids: list[str] | None = None,
    excluded_theme_tokens: list[str] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    excluded_author_token_set = set(_parse_identifier_tokens(excluded_author_ids or []))
    excluded_theme_token_set = set(_parse_identifier_tokens(excluded_theme_tokens or []))

    def exclude_authors_and_themes(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not excluded_author_token_set and not excluded_theme_token_set:
            return items

        def is_allowed(question: dict[str, Any]) -> bool:
            if excluded_author_token_set:
                if any(token in excluded_author_token_set for token in _extract_author_tokens(question)):
                    return False
            if excluded_theme_token_set:
                if any(token in excluded_theme_token_set for token in _extract_theme_tokens(question, "block3")):
                    return False
            return True

        return _filter_with_fallback(items, is_allowed)

    filtered = {
        "task11_1": exclude_authors_and_themes(_filter_active_items(block3.get("task11_1") or [])),
        "task11_2_3": exclude_authors_and_themes(_filter_active_items(block3.get("task11_2_3") or [])),
        "task11_4": exclude_authors_and_themes(_filter_active_items(block3.get("task11_4") or [])),
        "task11_5": exclude_authors_and_themes(_filter_active_items(block3.get("task11_5") or [])),
    }

    if not preferred_author_id:
        return filtered

    preferred_author_tokens = set(_parse_identifier_tokens(preferred_author_id))

    def matches_preferred_author(question: dict[str, Any]) -> bool:
        return any(token in preferred_author_tokens for token in _extract_author_tokens(question))

    return {
        "task11_1": _filter_with_fallback(filtered["task11_1"], matches_preferred_author),
        "task11_2_3": _filter_with_fallback(filtered["task11_2_3"], matches_preferred_author),
        "task11_4": _filter_with_fallback(filtered["task11_4"], matches_preferred_author),
        "task11_5": _filter_with_fallback(filtered["task11_5"], matches_preferred_author),
    }


NON_BLOCK3_TASK_KEYS = [
    "task1", "task2", "task3", "task4_1", "task4_2", "task5",
    "task6", "task7", "task8", "task9_1", "task9_2", "task10",
]


def _get_theme_tokens(entry: dict[str, Any] | None) -> set[str]:
    """Extract theme tokens from an excerpt or poem via its themeInternalId AND theme tags."""
    if not entry:
        return set()
    tokens: set[str] = set()
    for token in _parse_identifier_tokens(entry.get("themeInternalId")):
        tokens.add(token)
    for token in _extract_theme_tokens(entry, "entity"):
        tokens.add(token)
    return tokens


def _poem_has_no_theme_conflict(poem: dict[str, Any], blocked_themes: set[str]) -> bool:
    """Return True if a poem does not share any theme token with the blocked set."""
    if not blocked_themes:
        return True
    return not blocked_themes.intersection(_get_theme_tokens(poem))


def _collect_non_block3_theme_tokens(variant: dict[str, Any]) -> set[str]:
    """Collect theme tokens already committed to by blocks 1 and 2."""
    used: set[str] = set()
    for token in _get_theme_tokens(variant.get("excerpt")):
        used.add(token)
    for token in _get_theme_tokens(variant.get("poem")):
        used.add(token)
    for key in NON_BLOCK3_TASK_KEYS:
        task = variant.get(key)
        if task:
            for token in _extract_theme_tokens(task, key):
                used.add(token)
    return used


def _collect_non_block3_custom_tags(variant: dict[str, Any]) -> set[str]:
    """Collect custom (non-structural) tags already committed to by blocks 1 and 2."""
    used: set[str] = set()
    for key in NON_BLOCK3_TASK_KEYS:
        task = variant.get(key)
        if task:
            for tag in _extract_custom_internal_tags(task):
                used.add(tag)
    return used


def _filter_block3_pools_by_variant_context(
    pools: dict[str, list[dict[str, Any]]],
    variant: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    """Filter block 3 pools to exclude questions whose theme tokens or custom tags
    conflict with tokens already used in blocks 1 and 2.  Falls back to the
    unfiltered pool when filtering removes all candidates for a given slot."""
    used_themes = _collect_non_block3_theme_tokens(variant)
    used_custom_tags = _collect_non_block3_custom_tags(variant)

    if not used_themes and not used_custom_tags:
        return pools

    def no_conflict(question: dict[str, Any]) -> bool:
        if used_themes:
            for token in _extract_theme_tokens(question, "block3"):
                if token in used_themes:
                    return False
        if used_custom_tags:
            for tag in _extract_custom_internal_tags(question):
                if tag in used_custom_tags:
                    return False
        return True

    return {
        key: _filter_with_fallback(questions, no_conflict)
        for key, questions in pools.items()
    }


def _get_variant_task_identity(variant: dict[str, Any], key: VariantTaskKey) -> str:
    if key == "task8":
        return f"{((variant.get('task8') or {}).get('id') if isinstance(variant.get('task8'), dict) else 'task8-empty')}::{_get_task8_options_signature(variant.get('task8Options') or [])}"

    if key == "task2":
        task_value = variant.get("task2")
        if not isinstance(task_value, dict):
            return "task2-empty"

        pair_signature = "||".join(
            f"{_normalize_task2_comparable(str(pair.get('character') or ''))}::{_normalize_task2_comparable(_first_task2_property(pair))}"
            for pair in task_value.get("pairs") or []
            if isinstance(pair, dict)
        )
        options_signature = "::".join(
            sorted(
                _normalize_task2_comparable(str(option))
                for option in (task_value.get("shuffledRightOptions") or [])
                if isinstance(option, str) and option.strip()
            )
        )
        extra_signature = _normalize_task2_comparable(str(task_value.get("extraOption") or ""))
        return f"{str(task_value.get('id') or 'task2-empty')}::{pair_signature}::{extra_signature}::{options_signature}"

    task_value = variant.get(key)
    if isinstance(task_value, dict) and isinstance(task_value.get("id"), str):
        return task_value["id"]

    return f"{key}-empty"


def _get_variant_task_entries(variant: dict[str, Any]) -> list[dict[str, Any]]:
    work = variant.get("work") if isinstance(variant.get("work"), dict) else {}
    poet = variant.get("poet") if isinstance(variant.get("poet"), dict) else {}
    work_author_id = str(work.get("authorId") or "")
    poem_author_id = str(poet.get("authorId") or "")

    runtime_task8 = None
    if isinstance(variant.get("task8"), dict):
        runtime_task8 = {**variant["task8"], "options": variant.get("task8Options") or []}

    return [
        {"key": "task1", "value": variant.get("task1"), "fallbackAuthorId": work_author_id},
        {"key": "task2", "value": variant.get("task2"), "fallbackAuthorId": work_author_id},
        {"key": "task3", "value": variant.get("task3"), "fallbackAuthorId": work_author_id},
        {"key": "task4_1", "value": variant.get("task4_1"), "fallbackAuthorId": work_author_id},
        {"key": "task4_2", "value": variant.get("task4_2"), "fallbackAuthorId": work_author_id},
        {"key": "task5", "value": variant.get("task5"), "fallbackAuthorId": work_author_id},
        {"key": "task6", "value": variant.get("task6"), "fallbackAuthorId": poem_author_id},
        {"key": "task7", "value": variant.get("task7"), "fallbackAuthorId": poem_author_id},
        {"key": "task8", "value": runtime_task8, "fallbackAuthorId": poem_author_id},
        {"key": "task9_1", "value": variant.get("task9_1"), "fallbackAuthorId": poem_author_id},
        {"key": "task9_2", "value": variant.get("task9_2"), "fallbackAuthorId": poem_author_id},
        {"key": "task10", "value": variant.get("task10"), "fallbackAuthorId": poem_author_id},
        {"key": "task11_1", "value": variant.get("task11_1")},
        {"key": "task11_2", "value": variant.get("task11_2")},
        {"key": "task11_3", "value": variant.get("task11_3")},
        {"key": "task11_4", "value": variant.get("task11_4")},
        {"key": "task11_5", "value": variant.get("task11_5")},
    ]


def _collect_by_keys(
    entries_map: dict[str, dict[str, Any]],
    keys: list[str],
    extractor: Callable[[dict[str, Any], str], list[str]],
) -> set[str]:
    values: set[str] = set()
    for key in keys:
        entry = entries_map.get(key)
        if not entry:
            continue
        value = entry.get("value")
        if not value:
            continue
        for token in extractor(entry, key):
            values.add(token)
    return values


def _count_duplicate_tokens(counts: dict[str, int]) -> int:
    return sum(max(0, count - 1) for count in counts.values())


def evaluate_variant_rules(variant: dict[str, Any]) -> dict[str, Any]:
    entries = _get_variant_task_entries(variant)
    entries_map: dict[str, dict[str, Any]] = {}
    prepared_entries: list[dict[str, Any]] = []

    for entry in entries:
        key = str(entry.get("key") or "")
        value = entry.get("value")
        fallback_author_id = entry.get("fallbackAuthorId")

        if value:
            tags = _get_tags(value)
            term_tokens = _extract_term_tokens(value, key)
            theme_tokens = _extract_theme_tokens(value, key)
            author_tokens = _extract_author_tokens(value)
            author_tokens_with_fallback = _extract_author_tokens(value, fallback_author_id)
            service_tags = _extract_service_tags(value)
            has_character_tag = _has_character_tag(value)
            custom_tags = _extract_custom_internal_tags(value)
            has_author_tag = any(_is_author_tag(tag) for tag in tags)
            has_no_author_tag = any(tag in NO_AUTHOR_TAGS for tag in tags)
        else:
            tags = []
            term_tokens = []
            theme_tokens = []
            author_tokens = []
            author_tokens_with_fallback = []
            service_tags = []
            has_character_tag = False
            custom_tags = []
            has_author_tag = False
            has_no_author_tag = False

        prepared = {
            "key": key,
            "value": value,
            "termTokens": term_tokens,
            "themeTokens": theme_tokens,
            "authorTokens": author_tokens,
            "authorTokensWithFallback": author_tokens_with_fallback,
            "serviceTags": service_tags,
            "hasCharacterTag": has_character_tag,
            "customTags": custom_tags,
            "hasAuthorTag": has_author_tag,
            "hasNoAuthorTag": has_no_author_tag,
            "hasAuthorIdentity": bool(author_tokens),
        }

        prepared_entries.append(prepared)
        entries_map[key] = prepared

    conditions: list[bool] = []

    block1_author_present = bool(((variant.get("work") or {}).get("authorId")))
    task5_second_author_present = bool(((variant.get("task5") or {}).get("authorId")))
    block2_author_present = bool(((variant.get("poet") or {}).get("authorId")))

    block11_1_entry = entries_map.get("task11_1")
    block11_2_entry = entries_map.get("task11_2")
    block11_3_entry = entries_map.get("task11_3")
    block11_4_entry = entries_map.get("task11_4")
    block11_5_entry = entries_map.get("task11_5")

    block11_primary_authors_present = all(
        bool(entry and entry.get("value")) and bool(entry and entry.get("hasAuthorIdentity"))
        for entry in [block11_1_entry, block11_5_entry]
    )
    block11_optional_authors_valid = all(
        (not entry) or (not entry.get("value")) or bool(entry.get("hasAuthorIdentity"))
        for entry in [block11_2_entry, block11_3_entry]
    )
    task11_4_authors_distinct = len(set((block11_4_entry or {}).get("authorTokens") or [])) >= 3

    conditions.append(
        block1_author_present
        and task5_second_author_present
        and block2_author_present
        and block11_primary_authors_present
        and block11_optional_authors_valid
        and task11_4_authors_distinct
    )

    no_author_tag_in_author_pair = True
    for entry in prepared_entries:
        if not entry.get("value"):
            continue

        if not entry.get("hasNoAuthorTag"):
            continue

        if not (entry.get("hasAuthorTag") and entry.get("authorTokensWithFallback")):
            no_author_tag_in_author_pair = False
            break

    conditions.append(no_author_tag_in_author_pair)

    term_token_counts: dict[str, int] = {}
    for entry in prepared_entries:
        for token in entry.get("termTokens") or []:
            term_token_counts[token] = term_token_counts.get(token, 0) + 1
    duplicate_term_tokens_count = _count_duplicate_tokens(term_token_counts)
    conditions.append(duplicate_term_tokens_count == 0)

    themes_group1 = {
        token
        for key in THEME_GROUP_1_KEYS
        for token in (entries_map.get(key) or {}).get("themeTokens") or []
    }
    themes_group2 = {
        token
        for key in THEME_GROUP_2_KEYS
        for token in (entries_map.get(key) or {}).get("themeTokens") or []
    }
    themes_group3 = {
        token
        for key in THEME_GROUP_3_KEYS
        for token in (entries_map.get(key) or {}).get("themeTokens") or []
    }

    conditions.append(len(themes_group1) >= 1)
    conditions.append(len(themes_group2) >= 1)
    conditions.append(len(themes_group3) >= 1)

    theme_token_counts: dict[str, int] = {}
    for entry in prepared_entries:
        for token in entry.get("themeTokens") or []:
            theme_token_counts[token] = theme_token_counts.get(token, 0) + 1
    duplicate_theme_tokens_count = _count_duplicate_tokens(theme_token_counts)
    conditions.append(duplicate_theme_tokens_count == 0)

    excerpt_themes = _get_theme_tokens(variant.get("excerpt"))
    poem_themes = _get_theme_tokens(variant.get("poem"))
    cross_block_theme_overlap_count = len(excerpt_themes & poem_themes)
    conditions.append(cross_block_theme_overlap_count == 0)

    author_token_counts: dict[str, int] = {}
    for token in _parse_identifier_tokens((variant.get("work") or {}).get("authorId")):
        author_token_counts[token] = author_token_counts.get(token, 0) + 1
    for token in _parse_identifier_tokens((variant.get("poet") or {}).get("authorId")):
        author_token_counts[token] = author_token_counts.get(token, 0) + 1

    for entry in prepared_entries:
        for token in entry.get("authorTokens") or []:
            author_token_counts[token] = author_token_counts.get(token, 0) + 1

    duplicate_author_tokens_count = _count_duplicate_tokens(author_token_counts)
    conditions.append(duplicate_author_tokens_count == 0)

    block11_signature = _evaluate_block11_requirements(variant)
    block11_rod_counts = block11_signature.get("rodCounts") or {}
    block11_rod_duplicate_count = sum(max(0, int(count) - 1) for count in block11_rod_counts.values())
    block11_rod_uniqueness = bool(block11_signature.get("requiredRodUniqueness"))
    block11_required_rod_coverage = bool(block11_signature.get("requiredRodCoverage"))
    conditions.append(block11_rod_uniqueness)
    conditions.append(block11_required_rod_coverage)

    service_tags_only_in_task3_and6 = True
    for entry in prepared_entries:
        if entry.get("serviceTags") and entry.get("key") not in SERVICE_TAG_ALLOWED_KEYS:
            service_tags_only_in_task3_and6 = False
            break

    service_tag_uniqueness = True
    for entry in prepared_entries:
        per_task_counts: dict[str, int] = {}
        for tag in entry.get("serviceTags") or []:
            per_task_counts[tag] = per_task_counts.get(tag, 0) + 1
        if any(count > 1 for count in per_task_counts.values()):
            service_tag_uniqueness = False
            break
    conditions.append(service_tags_only_in_task3_and6 and service_tag_uniqueness)

    character_tags_only_in_allowed_tasks = True
    for entry in prepared_entries:
        if entry.get("hasCharacterTag") and entry.get("key") not in CHARACTER_TAG_ALLOWED_KEYS:
            character_tags_only_in_allowed_tasks = False
            break

    character_tag_count = len(
        [
            entry
            for entry in prepared_entries
            if entry.get("value")
            and entry.get("key") in CHARACTER_TAG_ALLOWED_KEYS
            and entry.get("hasCharacterTag")
        ]
    )
    conditions.append(character_tags_only_in_allowed_tasks and character_tag_count <= 1)

    custom_tag_counts: dict[str, int] = {}
    for entry in prepared_entries:
        for tag in entry.get("customTags") or []:
            custom_tag_counts[tag] = custom_tag_counts.get(tag, 0) + 1

    duplicate_custom_tags_count = sum(max(0, count - 1) for count in custom_tag_counts.values())
    conditions.append(duplicate_custom_tags_count == 0)

    block11_key_set = set(BLOCK11_KEYS)
    block11_author_counts: dict[str, int] = {}
    for entry in prepared_entries:
        if not entry.get("value") or entry.get("key") not in block11_key_set:
            continue
        for token in entry.get("authorTokens") or []:
            block11_author_counts[token] = block11_author_counts.get(token, 0) + 1

    block11_authors_unique = _count_duplicate_tokens(block11_author_counts) == 0
    conditions.append(block11_authors_unique)

    block11_exclusive_questions_count = int(block11_signature.get("exclusiveCount", 0))
    conditions.append(block11_exclusive_questions_count == 1)
    block11_exclusive_questions_distance = int(block11_signature.get("exclusiveDistance", abs(block11_exclusive_questions_count - 1)))

    block11_special_coverage_count = len(
        set(
            [token for token in block11_rod_counts.keys() if token in ROD_SINGLE_USE_IN_BLOCK11]
            + (["искл вопрос"] if block11_exclusive_questions_count > 0 else [])
        )
    )

    score = sum(1 for condition in conditions if condition)
    critical_duplicate_tokens_count = (
        duplicate_term_tokens_count
        + duplicate_custom_tags_count
        + duplicate_theme_tokens_count
        + duplicate_author_tokens_count
        + block11_rod_duplicate_count
        + cross_block_theme_overlap_count
    )

    return {
        "ok": all(conditions),
        "score": score,
        "duplicateCustomTagsCount": duplicate_custom_tags_count,
        "duplicateTermTokensCount": duplicate_term_tokens_count,
        "duplicateThemeTokensCount": duplicate_theme_tokens_count,
        "crossBlockThemeOverlapCount": cross_block_theme_overlap_count,
        "duplicateAuthorTokensCount": duplicate_author_tokens_count,
        "block11RodDuplicateCount": block11_rod_duplicate_count,
        "block11ExclusiveQuestionsCount": block11_exclusive_questions_count,
        "block11ExclusiveQuestionsDistance": block11_exclusive_questions_distance,
        "block11SpecialCoverageCount": block11_special_coverage_count,
        "criticalDuplicateTokensCount": critical_duplicate_tokens_count,
    }


def _is_better_evaluation(next_eval: dict[str, Any], current_eval: dict[str, Any]) -> bool:
    if bool(next_eval.get("ok")) != bool(current_eval.get("ok")):
        return bool(next_eval.get("ok"))

    if int(next_eval.get("block11ExclusiveQuestionsDistance", 0)) != int(current_eval.get("block11ExclusiveQuestionsDistance", 0)):
        return int(next_eval.get("block11ExclusiveQuestionsDistance", 0)) < int(current_eval.get("block11ExclusiveQuestionsDistance", 0))

    for key in [
        "criticalDuplicateTokensCount",
        "duplicateTermTokensCount",
        "duplicateCustomTagsCount",
        "duplicateThemeTokensCount",
        "duplicateAuthorTokensCount",
    ]:
        if int(next_eval.get(key, 0)) != int(current_eval.get(key, 0)):
            return int(next_eval.get(key, 0)) < int(current_eval.get(key, 0))

    if int(next_eval.get("block11SpecialCoverageCount", 0)) != int(current_eval.get("block11SpecialCoverageCount", 0)):
        return int(next_eval.get("block11SpecialCoverageCount", 0)) > int(current_eval.get("block11SpecialCoverageCount", 0))

    return int(next_eval.get("score", 0)) > int(current_eval.get("score", 0))


def _get_block3_question_tokens(question: dict[str, Any]) -> set[str]:
    return set(
        _extract_author_tokens(question)
        + _extract_term_tokens(question, "task11")
        + _extract_block11_special_tokens(question)
        + _extract_custom_internal_tags(question)
    )


def _get_token_overlap_count(left: set[str], right: set[str]) -> int:
    return sum(1 for token in left if token in right)


def _get_block3_pair_score(first: dict[str, Any], second: dict[str, Any]) -> int:
    first_tokens = _get_block3_question_tokens(first)
    second_tokens = _get_block3_question_tokens(second)
    token_overlap = _get_token_overlap_count(first_tokens, second_tokens)

    first_authors = set(_extract_author_tokens(first))
    second_authors = set(_extract_author_tokens(second))
    author_overlap = _get_token_overlap_count(first_authors, second_authors)

    return author_overlap * 100 + token_overlap


def _has_block3_author_overlap(first: dict[str, Any], second: dict[str, Any]) -> bool:
    first_authors = set(_extract_author_tokens(first))
    second_authors = set(_extract_author_tokens(second))
    return _get_token_overlap_count(first_authors, second_authors) > 0


def _build_block3_pair_pools(items: list[dict[str, Any]]) -> dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]]:
    pools: dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]] = {
        "preferred": [],
        "fallback": [],
    }

    if not items:
        return pools
    if len(items) == 1:
        single = (items[0], None)
        pools["fallback"] = [single]
        return pools

    source = _shuffle(items)
    pairs: list[dict[str, Any]] = []

    for first_index in range(len(source)):
        for second_index in range(first_index + 1, len(source)):
            first = source[first_index]
            second = source[second_index]
            pairs.append(
                {
                    "first": first,
                    "second": second,
                    "score": _get_block3_pair_score(first, second),
                    "authorOverlap": _has_block3_author_overlap(first, second),
                }
            )

    no_author_overlap_pairs = [entry for entry in pairs if not entry["authorOverlap"]]
    if no_author_overlap_pairs:
        sorted_pairs = sorted(no_author_overlap_pairs, key=lambda entry: entry["score"])
        best_score = sorted_pairs[0]["score"]
        near_best = [entry for entry in sorted_pairs if entry["score"] <= best_score + 1]
        top_pool = near_best[:12]
        pools["preferred"] = [(entry["first"], entry["second"]) for entry in top_pool]

    if pairs:
        sorted_pairs = sorted(pairs, key=lambda entry: entry["score"])
        fallback: list[tuple[dict[str, Any] | None, dict[str, Any] | None]] = []
        seen_first_ids: set[str] = set()
        for entry in sorted_pairs:
            first = entry["first"]
            first_id = str(first.get("id") or "")
            if first_id and first_id in seen_first_ids:
                continue
            if first_id:
                seen_first_ids.add(first_id)
            fallback.append((first, None))
            if len(fallback) >= 12:
                break
        pools["fallback"] = fallback

    if not pools["fallback"]:
        first = _pick_random(items)
        if first:
            pools["fallback"] = [(first, None)]

    return pools


def _pick_two_distinct_block3_questions(
    items: list[dict[str, Any]],
    prebuilt_pools: dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]] | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    pools = prebuilt_pools or _build_block3_pair_pools(items)
    if pools["preferred"]:
        picked = _pick_random(pools["preferred"])
        if picked:
            return picked

    if pools["fallback"]:
        picked = _pick_random(pools["fallback"])
        if picked:
            return picked

    return (None, None)


def _group_block3_pool_by_rod(questions: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """Group block 3 questions by their required rod token.

    Questions with a required rod (лирика/пьеса/поэма) are indexed under that rod.
    Questions with no required rod (e.g. проза) go under "_other".
    """
    result: dict[str, list[dict[str, Any]]] = {}
    for question in questions:
        rods = [r for r in _extract_rod_tokens(question) if r in ROD_SINGLE_USE_IN_BLOCK11]
        if rods:
            for rod in rods:
                result.setdefault(rod, []).append(question)
        else:
            result.setdefault("_other", []).append(question)
    return result


def _build_block11_candidate_variant(
    base_variant: dict[str, Any],
    pools: dict[str, list[dict[str, Any]]],
    pair_pools: dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]],
) -> dict[str, Any]:
    task11_2, task11_3 = _pick_two_distinct_block3_questions(
        pools["task11_2_3"],
        prebuilt_pools=pair_pools,
    )
    return {
        **base_variant,
        "task11_1": _pick_random(pools["task11_1"]),
        "task11_2": task11_2,
        "task11_3": task11_3,
        "task11_4": _pick_random(pools["task11_4"]),
        "task11_5": _pick_random(pools["task11_5"]),
    }


def _build_block11_rod_aware_candidate(
    base_variant: dict[str, Any],
    pools: dict[str, list[dict[str, Any]]],
    rod_preference: dict[str, str] | None = None,
) -> dict[str, Any] | None:
    """Build a block 11 candidate with guaranteed rod coverage by
    pre-assigning required rods (лирика/пьеса/поэма) to slots.

    If rod_preference is provided (e.g. {"task11_1": "лирика", "task11_3": "пьеса", ...}),
    the preferred assignment is tried first before falling back to random assignments.

    Returns None if no valid assignment can be found.
    """
    slot_keys = BLOCK11_KEYS
    slot_pool_keys = ["task11_1", "task11_2_3", "task11_2_3", "task11_4", "task11_5"]
    slot_pools = [pools.get(key, []) for key in slot_pool_keys]
    grouped = [_group_block3_pool_by_rod(pool) for pool in slot_pools]

    required_rods = list(ROD_SINGLE_USE_IN_BLOCK11)

    candidate_assignments: list[dict[int, str]] = []

    if rod_preference and isinstance(rod_preference, dict):
        pref_assignment: dict[int, str] = {}
        pref_used_slots: set[int] = set()
        pref_ok = True
        for slot_idx, slot_key in enumerate(slot_keys):
            pref_rod = rod_preference.get(slot_key)
            if pref_rod and _normalize_rod(pref_rod) in ROD_SINGLE_USE_IN_BLOCK11:
                norm_rod = _normalize_rod(pref_rod)
                if slot_idx in pref_used_slots:
                    pref_ok = False
                    break
                if not grouped[slot_idx].get(norm_rod):
                    pref_ok = False
                    break
                pref_assignment[slot_idx] = norm_rod
                pref_used_slots.add(slot_idx)
        if pref_ok and set(pref_assignment.values()) >= ROD_SINGLE_USE_IN_BLOCK11:
            candidate_assignments.append(pref_assignment)

    for _ in range(30):
        random.shuffle(required_rods)
        assignment: dict[int, str] = {}
        used_slots: set[int] = set()
        success = True

        for rod in required_rods:
            slot_order = list(range(5))
            random.shuffle(slot_order)
            assigned = False
            for slot in slot_order:
                if slot in used_slots:
                    continue
                if grouped[slot].get(rod):
                    assignment[slot] = rod
                    used_slots.add(slot)
                    assigned = True
                    break
            if not assigned:
                success = False
                break

        if not success:
            continue

        candidate_assignments.append(assignment)

    for assignment in candidate_assignments:

        picks: list[dict[str, Any] | None] = [None] * 5
        for slot in range(5):
            if slot in assignment:
                picks[slot] = _pick_random(grouped[slot][assignment[slot]])
            else:
                picks[slot] = _pick_random(slot_pools[slot])

        if (
            picks[1] and picks[2]
            and isinstance(picks[1], dict) and isinstance(picks[2], dict)
            and str(picks[1].get("id") or "") == str(picks[2].get("id") or "")
        ):
            excluded_id = str(picks[1].get("id") or "")
            if 2 in assignment:
                alt = [q for q in grouped[2].get(assignment[2], []) if str(q.get("id") or "") != excluded_id]
            else:
                alt = [q for q in slot_pools[2] if str(q.get("id") or "") != excluded_id]
            if alt:
                picks[2] = _pick_random(alt)
            else:
                continue

        return {
            **base_variant,
            "task11_1": picks[0],
            "task11_2": picks[1],
            "task11_3": picks[2],
            "task11_4": picks[3],
            "task11_5": picks[4],
        }

    return None


def _find_best_block11_compliant_variant(
    base_variant: dict[str, Any],
    pools: dict[str, list[dict[str, Any]]],
    pair_pools: dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]],
    attempts: int = BLOCK11_COMPLIANCE_ATTEMPTS,
    rod_preference: dict[str, str] | None = None,
) -> dict[str, Any] | None:
    best_variant: dict[str, Any] | None = None
    best_evaluation: dict[str, Any] | None = None

    for i in range(max(1, attempts)):
        if i % 2 == 0:
            candidate = _build_block11_rod_aware_candidate(base_variant, pools, rod_preference=rod_preference)
            if candidate is None:
                candidate = _build_block11_candidate_variant(base_variant, pools, pair_pools)
        else:
            candidate = _build_block11_candidate_variant(base_variant, pools, pair_pools)

        if not _has_required_block11_signature(candidate):
            continue

        evaluation = evaluate_variant_rules(candidate)
        if evaluation.get("ok"):
            return candidate

        if best_variant is None or best_evaluation is None or _is_better_evaluation(evaluation, best_evaluation):
            best_variant = candidate
            best_evaluation = evaluation

    return best_variant


def _build_variant_candidate(
    chosen_work: dict[str, Any],
    chosen_excerpt: dict[str, Any],
    chosen_poet: dict[str, Any],
    chosen_poem: dict[str, Any],
    block3: dict[str, list[dict[str, Any]]],
    works: list[dict[str, Any]],
    poets: list[dict[str, Any]],
    task1_filters: dict[str, bool],
    selected_theme_id: str,
    selected_block3_author_id: str,
) -> dict[str, Any]:
    work_pools = _build_task_pools(chosen_work, chosen_excerpt, task1_filters, works)
    _excerpt_theme_tokens_for_poem = _get_theme_tokens(chosen_excerpt)
    poem_pools = _build_poem_pools(
        chosen_poem,
        poets,
        selected_theme_id,
        excluded_theme_tokens=_excerpt_theme_tokens_for_poem,
    )
    task5 = _pick_random(work_pools["task5"])
    _excerpt_poem_theme_tokens = list(_get_theme_tokens(chosen_excerpt) | _get_theme_tokens(chosen_poem))
    block3_pools = _build_block3_pools(
        block3,
        selected_block3_author_id,
        [
            str(chosen_work.get("authorId") or ""),
            str(chosen_poet.get("authorId") or ""),
            str((task5 or {}).get("authorId") or ""),
        ],
        excluded_theme_tokens=_excerpt_poem_theme_tokens,
    )

    task8 = _pick_random(poem_pools["task8"])
    task8_options = _build_task8_options(task8)
    task11_2, task11_3 = _pick_two_distinct_block3_questions(block3_pools["task11_2_3"])

    task2 = None
    for question in _shuffle(work_pools["task2"]):
        runtime_task2 = _build_runtime_task2(chosen_work, question, chosen_excerpt.get("tasks") or {})
        if runtime_task2 is not None:
            task2 = runtime_task2
            break

    return {
        "work": chosen_work,
        "excerpt": chosen_excerpt,
        "task1": _pick_random(work_pools["task1"]),
        "task2": task2,
        "task3": _build_runtime_two_gap(work_pools["task3"], "task3"),
        "task4_1": _pick_random(work_pools["task4_1"]),
        "task4_2": _pick_random(work_pools["task4_2"]),
        "task5": task5,
        "poet": chosen_poet,
        "poem": chosen_poem,
        "task6": _build_runtime_two_gap(poem_pools["task6"], "task6"),
        "task7": _pick_random(poem_pools["task7"]),
        "task8": task8,
        "task8Options": task8_options,
        "task9_1": _pick_random(poem_pools["task9_1"]),
        "task9_2": _pick_random(poem_pools["task9_2"]),
        "task10": _pick_random(poem_pools["task10"]),
        "task11_1": _pick_random(block3_pools["task11_1"]),
        "task11_2": task11_2,
        "task11_3": task11_3,
        "task11_4": _pick_random(block3_pools["task11_4"]),
        "task11_5": _pick_random(block3_pools["task11_5"]),
    }


def _build_variant(
    chosen_work: dict[str, Any],
    chosen_excerpt: dict[str, Any],
    chosen_poet: dict[str, Any],
    chosen_poem: dict[str, Any],
    block3: dict[str, list[dict[str, Any]]],
    works: list[dict[str, Any]],
    poets: list[dict[str, Any]],
    task1_filters: dict[str, bool],
    selected_theme_id: str,
    selected_block3_author_id: str,
) -> dict[str, Any]:
    best_variant: dict[str, Any] | None = None
    best_evaluation: dict[str, Any] | None = None

    work_pools = _build_task_pools(chosen_work, chosen_excerpt, task1_filters, works)
    _excerpt_theme_tokens_for_poem = _get_theme_tokens(chosen_excerpt)
    poem_pools = _build_poem_pools(
        chosen_poem,
        poets,
        selected_theme_id,
        excluded_theme_tokens=_excerpt_theme_tokens_for_poem,
    )
    preferred_author = selected_block3_author_id

    base_block3_excluded_authors = [
        a for a in [str(chosen_work.get("authorId") or ""), str(chosen_poet.get("authorId") or "")]
        if a and a != preferred_author
    ]

    _excerpt_poem_theme_tokens = list(_get_theme_tokens(chosen_excerpt) | _get_theme_tokens(chosen_poem))
    base_block3_pools = _build_block3_pools(
        block3,
        preferred_author,
        base_block3_excluded_authors,
        excluded_theme_tokens=_excerpt_poem_theme_tokens,
    )
    _block3_theme_context: dict[str, Any] = {"excerpt": chosen_excerpt, "poem": chosen_poem}
    base_block3_pools = _filter_block3_pools_by_variant_context(base_block3_pools, _block3_theme_context)

    block3_pools_by_task5_author: dict[str, tuple[dict[str, list[dict[str, Any]]], dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]]]] = {}

    task3_runtime_candidates = _build_runtime_two_gap_candidates(work_pools["task3"], "task3")
    task6_runtime_candidates = _build_runtime_two_gap_candidates(poem_pools["task6"], "task6")

    def _get_block3_pools_for_task5_author(task5_author_id: str) -> tuple[
        dict[str, list[dict[str, Any]]],
        dict[str, list[tuple[dict[str, Any] | None, dict[str, Any] | None]]],
    ]:
        cache_key = task5_author_id or "__none__"
        cached = block3_pools_by_task5_author.get(cache_key)
        if cached is not None:
            return cached

        if task5_author_id:
            pools = _build_block3_pools(
                block3,
                selected_block3_author_id,
                [*base_block3_excluded_authors, task5_author_id],
                excluded_theme_tokens=_excerpt_poem_theme_tokens,
            )
            pools = _filter_block3_pools_by_variant_context(pools, _block3_theme_context)
        else:
            pools = base_block3_pools

        pair_pools = _build_block3_pair_pools(pools["task11_2_3"])
        block3_pools_by_task5_author[cache_key] = (pools, pair_pools)
        return pools, pair_pools

    _initial_builder_call_count = 0

    def _build_candidate_from_prepared() -> dict[str, Any]:
        nonlocal _initial_builder_call_count
        _initial_builder_call_count += 1

        task5 = _pick_random(work_pools["task5"])
        task5_author_id = str((task5 or {}).get("authorId") or "")
        block3_pools, block3_pair_pools = _get_block3_pools_for_task5_author(task5_author_id)

        task8 = _pick_random(poem_pools["task8"])
        task8_options = _build_task8_options(task8)

        task2 = None
        for question in _shuffle(work_pools["task2"]):
            runtime_task2 = _build_runtime_task2(chosen_work, question, chosen_excerpt.get("tasks") or {})
            if runtime_task2 is not None:
                task2 = runtime_task2
                break

        base_candidate = {
            "work": chosen_work,
            "excerpt": chosen_excerpt,
            "task1": _pick_random(work_pools["task1"]),
            "task2": task2,
            "task3": _pick_random(task3_runtime_candidates) if task3_runtime_candidates else None,
            "task4_1": _pick_random(work_pools["task4_1"]),
            "task4_2": _pick_random(work_pools["task4_2"]),
            "task5": task5,
            "poet": chosen_poet,
            "poem": chosen_poem,
            "task6": _pick_random(task6_runtime_candidates) if task6_runtime_candidates else None,
            "task7": _pick_random(poem_pools["task7"]),
            "task8": task8,
            "task8Options": task8_options,
            "task9_1": _pick_random(poem_pools["task9_1"]),
            "task9_2": _pick_random(poem_pools["task9_2"]),
            "task10": _pick_random(poem_pools["task10"]),
        }

        if _initial_builder_call_count % 2 == 0:
            rod_candidate = _build_block11_rod_aware_candidate(base_candidate, block3_pools)
            if rod_candidate is not None:
                return rod_candidate

        task11_2, task11_3 = _pick_two_distinct_block3_questions(
            block3_pools["task11_2_3"],
            prebuilt_pools=block3_pair_pools,
        )
        return {
            **base_candidate,
            "task11_1": _pick_random(block3_pools["task11_1"]),
            "task11_2": task11_2,
            "task11_3": task11_3,
            "task11_4": _pick_random(block3_pools["task11_4"]),
            "task11_5": _pick_random(block3_pools["task11_5"]),
        }

    for _ in range(VARIANT_BUILD_ATTEMPTS):
        candidate = _build_candidate_from_prepared()
        evaluation = evaluate_variant_rules(candidate)
        if evaluation["ok"]:
            return candidate

        if best_variant is None or best_evaluation is None or _is_better_evaluation(evaluation, best_evaluation):
            best_variant = candidate
            best_evaluation = evaluation

    fallback_candidate = best_variant or _build_candidate_from_prepared()
    if _has_required_block11_signature(fallback_candidate):
        return fallback_candidate

    fallback_task5_author_id = str((fallback_candidate.get("task5") or {}).get("authorId") or "")
    repair_block3_pools, repair_block3_pair_pools = _get_block3_pools_for_task5_author(fallback_task5_author_id)

    repaired_block11_variant = _find_best_block11_compliant_variant(
        fallback_candidate,
        repair_block3_pools,
        repair_block3_pair_pools,
    )
    if repaired_block11_variant is not None:
        return repaired_block11_variant

    if base_block3_excluded_authors:
        unrestricted_pools = _build_block3_pools(block3, selected_block3_author_id, [])
        unrestricted_pair_pools = _build_block3_pair_pools(unrestricted_pools["task11_2_3"])
        unrestricted_repaired = _find_best_block11_compliant_variant(
            fallback_candidate,
            unrestricted_pools,
            unrestricted_pair_pools,
        )
        if unrestricted_repaired is not None:
            return unrestricted_repaired

    return fallback_candidate


def _build_best_partial_variant(builder: Callable[[], dict[str, Any]], attempts: int = PARTIAL_VARIANT_BUILD_ATTEMPTS) -> dict[str, Any]:
    best_variant: dict[str, Any] | None = None
    best_evaluation: dict[str, Any] | None = None

    for _ in range(attempts):
        candidate = builder()
        evaluation = evaluate_variant_rules(candidate)
        if evaluation["ok"]:
            return candidate

        if best_variant is None or best_evaluation is None:
            best_variant = candidate
            best_evaluation = evaluation
            continue

        if _is_better_evaluation(evaluation, best_evaluation):
            best_variant = candidate
            best_evaluation = evaluation

    return best_variant or builder()


def _find_by_id(items: list[dict[str, Any]], item_id: str) -> dict[str, Any] | None:
    if not item_id:
        return None
    for item in items:
        if str(item.get("id") or "") == item_id:
            return item
    return None


def _build_id_index(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Build a dict mapping id -> item for O(1) lookups."""
    return {str(item.get("id") or ""): item for item in items if isinstance(item, dict)}


def _find_by_id_in_index(index: dict[str, dict[str, Any]], item_id: str) -> dict[str, Any] | None:
    if not item_id:
        return None
    return index.get(item_id)


def _resolve_work(works: list[dict[str, Any]], selected_work_id: str, fallback_work_id: str = "") -> dict[str, Any] | None:
    return _find_by_id(works, selected_work_id) or _find_by_id(works, fallback_work_id) or (works[0] if works else None)


def _resolve_work_by_author(works: list[dict[str, Any]], author_id: str) -> dict[str, Any] | None:
    if not author_id:
        return None
    for work in works:
        if str(work.get("authorId") or "") == author_id:
            return work
    return None


def _resolve_poet_by_author(poets: list[dict[str, Any]], author_id: str) -> dict[str, Any] | None:
    if not author_id:
        return None
    for poet in poets:
        if str(poet.get("authorId") or "") == author_id:
            return poet
    return None


def _resolve_work_indexed(index: dict[str, dict[str, Any]], works: list[dict[str, Any]], selected_work_id: str, fallback_work_id: str = "") -> dict[str, Any] | None:
    return _find_by_id_in_index(index, selected_work_id) or _find_by_id_in_index(index, fallback_work_id) or (works[0] if works else None)


def _resolve_excerpt(work: dict[str, Any] | None, selected_excerpt_id: str, fallback_excerpt_id: str = "") -> dict[str, Any] | None:
    if not work:
        return None
    all_excerpts = _sort_excerpts_by_order([entry for entry in work.get("excerpts") or [] if isinstance(entry, dict)])
    active_excerpts = _filter_active_items(all_excerpts)
    by_id = _find_by_id(active_excerpts, selected_excerpt_id) or _find_by_id(active_excerpts, fallback_excerpt_id)
    if by_id:
        return by_id
    return (active_excerpts[0] if active_excerpts else None) or (all_excerpts[0] if all_excerpts else None)


def _resolve_poet(poets: list[dict[str, Any]], selected_poet_id: str, fallback_poet_id: str = "") -> dict[str, Any] | None:
    return _find_by_id(poets, selected_poet_id) or _find_by_id(poets, fallback_poet_id) or (poets[0] if poets else None)


def _resolve_poet_indexed(index: dict[str, dict[str, Any]], poets: list[dict[str, Any]], selected_poet_id: str, fallback_poet_id: str = "") -> dict[str, Any] | None:
    return _find_by_id_in_index(index, selected_poet_id) or _find_by_id_in_index(index, fallback_poet_id) or (poets[0] if poets else None)


def _resolve_poem(poet: dict[str, Any] | None, selected_poem_id: str, fallback_poem_id: str = "") -> dict[str, Any] | None:
    if not poet:
        return None
    all_poems = [entry for entry in poet.get("poems") or [] if isinstance(entry, dict)]
    active_poems = _filter_active_items(all_poems)
    by_id = _find_by_id(active_poems, selected_poem_id) or _find_by_id(active_poems, fallback_poem_id)
    if by_id:
        return by_id
    return (active_poems[0] if active_poems else None) or (all_poems[0] if all_poems else None)


def _normalize_task1_filters(filters: dict[str, Any] | None) -> dict[str, bool]:
    filters = filters or {}
    return {
        "includeWorkQuestions": bool(filters.get("includeWorkQuestions", True)),
        "includeTermQuestions": bool(filters.get("includeTermQuestions", True)),
    }


def _normalize_variant(variant: dict[str, Any], works: list[dict[str, Any]], poets: list[dict[str, Any]]) -> dict[str, Any]:
    current = dict(variant)

    works_index = _build_id_index(works)
    poets_index = _build_id_index(poets)

    work = _resolve_work_indexed(
        works_index,
        works,
        str(((current.get("work") or {}).get("id") or "")),
    )
    excerpt = _resolve_excerpt(
        work,
        str(((current.get("excerpt") or {}).get("id") or "")),
    )
    poet = _resolve_poet_indexed(
        poets_index,
        poets,
        str(((current.get("poet") or {}).get("id") or "")),
    )
    poem = _resolve_poem(
        poet,
        str(((current.get("poem") or {}).get("id") or "")),
    )

    if work:
        current["work"] = work
    if excerpt:
        current["excerpt"] = excerpt
    if poet:
        current["poet"] = poet
    if poem:
        current["poem"] = poem

    if not isinstance(current.get("task8Options"), list):
        current["task8Options"] = []

    for key in [
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
    ]:
        current.setdefault(key, None)

    return current


def _pick_best_variant_by_evaluation(
    candidates: list[dict[str, Any]],
    key: VariantTaskKey,
    used_identities: set[str] | None = None,
    evaluation_cache: dict[int, dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    if not candidates:
        return None

    shuffled_candidates = _shuffle(candidates)

    unique_candidates: list[dict[str, Any]] = []
    seen_identities: set[str] = set()
    for candidate in shuffled_candidates:
        identity = _get_variant_task_identity(candidate, key)
        if identity in seen_identities:
            continue
        seen_identities.add(identity)
        unique_candidates.append(candidate)

    used = used_identities or set()
    unseen_candidates = [candidate for candidate in unique_candidates if _get_variant_task_identity(candidate, key) not in used]
    candidate_pool = unseen_candidates if unseen_candidates else unique_candidates
    candidate_pool = _limit_random_items(candidate_pool, MAX_REFRESH_TASK_EVALUATION_ITEMS)

    cache = evaluation_cache if evaluation_cache is not None else {}

    def _evaluate(variant: dict[str, Any]) -> dict[str, Any]:
        cache_key = id(variant)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        evaluation = evaluate_variant_rules(variant)
        cache[cache_key] = evaluation
        return evaluation

    best_evaluation = _evaluate(candidate_pool[0])
    for candidate in candidate_pool[1:]:
        candidate_evaluation = _evaluate(candidate)
        if _is_better_evaluation(candidate_evaluation, best_evaluation):
            best_evaluation = candidate_evaluation

    tied_candidates = [
        candidate
        for candidate in candidate_pool
        if not _is_better_evaluation(best_evaluation, _evaluate(candidate))
        and not _is_better_evaluation(_evaluate(candidate), best_evaluation)
    ]
    if tied_candidates:
        return random.choice(tied_candidates)
    return candidate_pool[0]


def _select_best_candidate(
    current: dict[str, Any],
    candidates: list[dict[str, Any]],
    key: VariantTaskKey,
    require_block11_rules: bool = False,
) -> dict[str, Any]:
    if not candidates:
        return current

    deduped_candidates: list[dict[str, Any]] = []
    seen_identities: set[str] = set()
    for candidate in candidates:
        identity = _get_variant_task_identity(candidate, key)
        if identity in seen_identities:
            continue
        seen_identities.add(identity)
        deduped_candidates.append(candidate)

    if require_block11_rules:
        deduped_candidates = [candidate for candidate in deduped_candidates if _has_required_block11_signature(candidate)]
        if not deduped_candidates:
            return current

    evaluation_cache: dict[int, dict[str, Any]] = {}

    def _evaluate(variant: dict[str, Any]) -> dict[str, Any]:
        cache_key = id(variant)
        cached = evaluation_cache.get(cache_key)
        if cached is not None:
            return cached
        evaluation = evaluate_variant_rules(variant)
        evaluation_cache[cache_key] = evaluation
        return evaluation

    deduped_candidates = _limit_random_items(deduped_candidates, MAX_REFRESH_TASK_EVALUATION_ITEMS)

    compatible_candidates = [
        candidate
        for candidate in deduped_candidates
        if int(_evaluate(candidate).get("criticalDuplicateTokensCount", 0)) == 0
    ]

    best_compatible = _pick_best_variant_by_evaluation(
        compatible_candidates,
        key,
        evaluation_cache=evaluation_cache,
    )
    if best_compatible is not None:
        return best_compatible

    best_fallback = _pick_best_variant_by_evaluation(
        deduped_candidates,
        key,
        evaluation_cache=evaluation_cache,
    )
    if best_fallback is None:
        return current

    current_evaluation = _evaluate(current)
    fallback_evaluation = _evaluate(best_fallback)

    if _is_better_evaluation(fallback_evaluation, current_evaluation):
        return best_fallback

    fallback_not_worse = not _is_better_evaluation(current_evaluation, fallback_evaluation)
    if fallback_not_worse and _get_variant_task_identity(best_fallback, key) != _get_variant_task_identity(current, key):
        return best_fallback

    return current


def generate_variant_runtime(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    works = [entry for entry in kb_payload.get("works") or [] if isinstance(entry, dict)]
    poets = [entry for entry in kb_payload.get("poets") or [] if isinstance(entry, dict)]
    block3 = kb_payload.get("block3") if isinstance(kb_payload.get("block3"), dict) else {
        "task11_1": [],
        "task11_2_3": [],
        "task11_4": [],
        "task11_5": [],
    }

    if not works or not poets:
        raise ValueError("Недостаточно данных для генерации варианта")

    use_selected = bool(payload.get("useSelected", True))
    selected_work_id = str(payload.get("selectedWorkId") or "")
    selected_excerpt_id = str(payload.get("selectedExcerptId") or "")
    selected_poet_id = str(payload.get("selectedPoetId") or "")
    selected_poem_id = str(payload.get("selectedPoemId") or "")
    selected_theme_id = str(payload.get("selectedThemeId") or "")
    selected_block3_author_id = str(payload.get("selectedBlock3AuthorId") or "")
    task1_filters = _normalize_task1_filters(payload.get("task1Filters"))

    works_index = _build_id_index(works)
    poets_index = _build_id_index(poets)

    if use_selected and selected_block3_author_id:
        if not selected_work_id:
            matching_work = _resolve_work_by_author(works, selected_block3_author_id)
            if matching_work:
                selected_work_id = str(matching_work.get("id") or "")
        if not selected_poet_id:
            matching_poet = _resolve_poet_by_author(poets, selected_block3_author_id)
            if matching_poet:
                selected_poet_id = str(matching_poet.get("id") or "")

    chosen_work = _resolve_work_indexed(works_index, works, selected_work_id if use_selected else "")
    chosen_poet = _resolve_poet_indexed(poets_index, poets, selected_poet_id if use_selected else "")

    if not chosen_work or not chosen_poet:
        raise ValueError("Не удалось выбрать произведение или автора для варианта")

    chosen_excerpt = _resolve_excerpt(chosen_work, selected_excerpt_id if use_selected else "")
    chosen_poem = _resolve_poem(chosen_poet, selected_poem_id if use_selected else "")

    if not chosen_excerpt or not chosen_poem:
        raise ValueError("Не удалось выбрать отрывок или стихотворение для варианта")

    if not use_selected:
        random_work = _pick_random(works)
        random_poet = _pick_random(poets)
        if random_work:
            chosen_work = random_work
        if random_poet:
            chosen_poet = random_poet

        all_excerpts = [entry for entry in chosen_work.get("excerpts") or [] if isinstance(entry, dict)]
        active_excerpts = _filter_active_items(all_excerpts)
        random_excerpt = _pick_random(active_excerpts) or _pick_random(all_excerpts)
        if random_excerpt:
            chosen_excerpt = random_excerpt

        excerpt_themes = _get_theme_tokens(chosen_excerpt)
        all_poems = _filter_active_items([entry for entry in chosen_poet.get("poems") or [] if isinstance(entry, dict)])
        if excerpt_themes:
            non_conflicting_poems = [p for p in all_poems if _poem_has_no_theme_conflict(p, excerpt_themes)]
            random_poem = _pick_random(non_conflicting_poems) or _pick_random(all_poems)
        else:
            random_poem = _pick_random(all_poems)
        if random_poem:
            chosen_poem = random_poem

    variant = _build_variant(
        chosen_work,
        chosen_excerpt,
        chosen_poet,
        chosen_poem,
        block3,
        works,
        poets,
        task1_filters,
        selected_theme_id,
        selected_block3_author_id,
    )

    return {"variant": variant, "evaluation": evaluate_variant_rules(variant)}


def refresh_block_runtime(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    works = [entry for entry in kb_payload.get("works") or [] if isinstance(entry, dict)]
    poets = [entry for entry in kb_payload.get("poets") or [] if isinstance(entry, dict)]
    block3 = kb_payload.get("block3") if isinstance(kb_payload.get("block3"), dict) else {
        "task11_1": [],
        "task11_2_3": [],
        "task11_4": [],
        "task11_5": [],
    }

    variant_input = payload.get("variant")
    if not isinstance(variant_input, dict):
        raise ValueError("Текущий вариант не передан")

    block = str(payload.get("block") or "")
    selected_work_id = str(payload.get("selectedWorkId") or "")
    selected_excerpt_id = str(payload.get("selectedExcerptId") or "")
    selected_poet_id = str(payload.get("selectedPoetId") or "")
    selected_poem_id = str(payload.get("selectedPoemId") or "")
    selected_theme_id = str(payload.get("selectedThemeId") or "")
    selected_block3_author_id = str(payload.get("selectedBlock3AuthorId") or "")
    task1_filters = _normalize_task1_filters(payload.get("task1Filters"))

    current = _normalize_variant(variant_input, works, poets)

    works_index = _build_id_index(works)
    poets_index = _build_id_index(poets)

    if block == "block1":
        target_work = _resolve_work_indexed(works_index, works, selected_work_id, str((current.get("work") or {}).get("id") or ""))
        target_excerpt = _resolve_excerpt(
            target_work,
            selected_excerpt_id,
            str((current.get("excerpt") or {}).get("id") or ""),
        )

        if not target_work or not target_excerpt:
            raise ValueError("Не удалось обновить блок 1–5: отсутствуют произведение или отрывок")

        pools = _build_task_pools(target_work, target_excerpt, task1_filters, works)
        task3_runtime_candidates = _build_runtime_two_gap_candidates(pools["task3"], "task3")

        replace_poem = False
        target_poet: dict[str, Any] = current.get("poet") or {}
        target_poem: dict[str, Any] = current.get("poem") or {}
        excerpt_theme_tokens = _get_theme_tokens(target_excerpt)

        if payload.get("replaceConflictingPoem") and excerpt_theme_tokens:
            current_poem_themes = _get_theme_tokens(target_poem)
            if excerpt_theme_tokens & current_poem_themes:
                all_poet_poems = _filter_active_items([
                    entry for entry in (target_poet.get("poems") or [])
                    if isinstance(entry, dict)
                ])
                non_conflicting = [
                    p for p in all_poet_poems
                    if _poem_has_no_theme_conflict(p, excerpt_theme_tokens)
                ]
                new_poem = _pick_random(non_conflicting)
                if new_poem:
                    target_poem = new_poem
                    replace_poem = True

        _b1_theme_tokens = list(_get_theme_tokens(target_excerpt) | _get_theme_tokens(target_poem))
        block11_pools = _build_block3_pools(
            block3,
            selected_block3_author_id,
            [
                str(target_work.get("authorId") or ""),
                str(target_poet.get("authorId") or ""),
            ],
            excluded_theme_tokens=_b1_theme_tokens,
        )
        block11_theme_context = {
            **current,
            "work": target_work,
            "excerpt": target_excerpt,
            "poem": target_poem,
        }
        block11_pools = _filter_block3_pools_by_variant_context(block11_pools, block11_theme_context)
        block11_pair_pools = _build_block3_pair_pools(block11_pools["task11_2_3"])

        _b1_excluded_themes = _collect_non_block3_theme_tokens(block11_theme_context)

        def _get_task11_if_valid(key: str) -> dict[str, Any] | None:
            task = current.get(key)
            if not task:
                return None
            authors = _extract_author_tokens(task)
            if any(token in _parse_identifier_tokens(target_work.get("authorId") or "") for token in authors):
                return None
            if any(token in _parse_identifier_tokens(target_poet.get("authorId") or "") for token in authors):
                return None
            if _b1_excluded_themes:
                task_themes = _extract_theme_tokens(task, "block3")
                if any(token in _b1_excluded_themes for token in task_themes):
                    return None
            return task

        poem_pools: dict[str, list[dict[str, Any]]] | None = None
        task6_runtime_candidates: list[dict[str, Any]] | None = None
        if replace_poem:
            poem_pools = _build_poem_pools(
                target_poem,
                poets,
                selected_theme_id,
                excluded_theme_tokens=_get_theme_tokens(target_excerpt),
            )
            task6_runtime_candidates = _build_runtime_two_gap_candidates(poem_pools["task6"], "task6")

        def builder() -> dict[str, Any]:
            task2 = None
            for question in _shuffle(pools["task2"]):
                runtime_task2 = _build_runtime_task2(target_work, question, target_excerpt.get("tasks") or {})
                if runtime_task2 is not None:
                    task2 = runtime_task2
                    break

            task11_2 = _get_task11_if_valid("task11_2")
            task11_3 = _get_task11_if_valid("task11_3")
            if not task11_2 and not task11_3:
                task11_2, task11_3 = _pick_two_distinct_block3_questions(
                    block11_pools["task11_2_3"],
                    prebuilt_pools=block11_pair_pools,
                )
            elif not task11_2:
                _excl_id = str((task11_3 or {}).get("id") or "")
                _pool = [q for q in block11_pools["task11_2_3"] if str(q.get("id") or "") != _excl_id] or block11_pools["task11_2_3"]
                task11_2 = _pick_random_preserving_rod(_pool, current.get("task11_2"))
            elif not task11_3:
                _excl_id = str((task11_2 or {}).get("id") or "")
                _pool = [q for q in block11_pools["task11_2_3"] if str(q.get("id") or "") != _excl_id] or block11_pools["task11_2_3"]
                task11_3 = _pick_random_preserving_rod(_pool, current.get("task11_3"))

            result: dict[str, Any] = {
                **current,
                "work": target_work,
                "excerpt": target_excerpt,
                "task1": _pick_random(pools["task1"]),
                "task2": task2,
                "task3": _pick_random(task3_runtime_candidates) if task3_runtime_candidates else None,
                "task4_1": _pick_random(pools["task4_1"]),
                "task4_2": _pick_random(pools["task4_2"]),
                "task5": _pick_random(pools["task5"]),
                "task11_1": _get_task11_if_valid("task11_1") or _pick_random_preserving_rod(block11_pools["task11_1"], current.get("task11_1")),
                "task11_2": task11_2,
                "task11_3": task11_3,
                "task11_4": _get_task11_if_valid("task11_4") or _pick_random_preserving_rod(block11_pools["task11_4"], current.get("task11_4")),
                "task11_5": _get_task11_if_valid("task11_5") or _pick_random_preserving_rod(block11_pools["task11_5"], current.get("task11_5")),
            }

            if replace_poem and poem_pools is not None:
                task8 = _pick_random(poem_pools["task8"])
                result.update({
                    "poet": target_poet,
                    "poem": target_poem,
                    "task6": _pick_random(task6_runtime_candidates) if task6_runtime_candidates else None,
                    "task7": _pick_random(poem_pools["task7"]),
                    "task8": task8,
                    "task8Options": _build_task8_options(task8),
                    "task9_1": _pick_random(poem_pools["task9_1"]),
                    "task9_2": _pick_random(poem_pools["task9_2"]),
                    "task10": _pick_random(poem_pools["task10"]),
                })

            return result

        updated = _build_best_partial_variant(builder)
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if block == "block2":
        target_poet = _resolve_poet_indexed(poets_index, poets, selected_poet_id, str((current.get("poet") or {}).get("id") or ""))
        target_poem = _resolve_poem(
            target_poet,
            selected_poem_id,
            str((current.get("poem") or {}).get("id") or ""),
        )

        if not target_poet or not target_poem:
            raise ValueError("Не удалось обновить блок 6–10: отсутствуют автор или стихотворение")

        pools = _build_poem_pools(
            target_poem,
            poets,
            selected_theme_id,
            excluded_theme_tokens=_get_theme_tokens(current.get("excerpt")),
        )
        task6_runtime_candidates = _build_runtime_two_gap_candidates(pools["task6"], "task6")

        _b2_theme_tokens_for_block3 = list(_get_theme_tokens(current.get("excerpt")) | _get_theme_tokens(target_poem))
        block11_pools = _build_block3_pools(
            block3,
            selected_block3_author_id,
            [
                str((current.get("work") or {}).get("authorId") or ""),
                str(target_poet.get("authorId") or ""),
            ],
            excluded_theme_tokens=_b2_theme_tokens_for_block3,
        )
        block11_theme_context = {
            **current,
            "poet": target_poet,
            "poem": target_poem,
        }
        block11_pools = _filter_block3_pools_by_variant_context(block11_pools, block11_theme_context)
        block11_pair_pools = _build_block3_pair_pools(block11_pools["task11_2_3"])

        _b2_excluded_themes = _collect_non_block3_theme_tokens(block11_theme_context)

        def _get_task11_if_valid(key: str) -> dict[str, Any] | None:
            task = current.get(key)
            if not task:
                return None
            authors = _extract_author_tokens(task)
            if any(token in _parse_identifier_tokens(target_poet.get("authorId") or "") for token in authors):
                return None
            if any(token in _parse_identifier_tokens((current.get("work") or {}).get("authorId") or "") for token in authors):
                return None
            if _b2_excluded_themes:
                task_themes = _extract_theme_tokens(task, "block3")
                if any(token in _b2_excluded_themes for token in task_themes):
                    return None
            return task

        def builder() -> dict[str, Any]:
            task8 = _pick_random(pools["task8"])

            task11_2 = _get_task11_if_valid("task11_2")
            task11_3 = _get_task11_if_valid("task11_3")
            if not task11_2 and not task11_3:
                task11_2, task11_3 = _pick_two_distinct_block3_questions(
                    block11_pools["task11_2_3"],
                    prebuilt_pools=block11_pair_pools,
                )
            elif not task11_2:
                _excl_id = str((task11_3 or {}).get("id") or "")
                _pool = [q for q in block11_pools["task11_2_3"] if str(q.get("id") or "") != _excl_id] or block11_pools["task11_2_3"]
                task11_2 = _pick_random_preserving_rod(_pool, current.get("task11_2"))
            elif not task11_3:
                _excl_id = str((task11_2 or {}).get("id") or "")
                _pool = [q for q in block11_pools["task11_2_3"] if str(q.get("id") or "") != _excl_id] or block11_pools["task11_2_3"]
                task11_3 = _pick_random_preserving_rod(_pool, current.get("task11_3"))

            return {
                **current,
                "poet": target_poet,
                "poem": target_poem,
                "task6": _pick_random(task6_runtime_candidates) if task6_runtime_candidates else None,
                "task7": _pick_random(pools["task7"]),
                "task8": task8,
                "task8Options": _build_task8_options(task8),
                "task9_1": _pick_random(pools["task9_1"]),
                "task9_2": _pick_random(pools["task9_2"]),
                "task10": _pick_random(pools["task10"]),
                "task11_1": _get_task11_if_valid("task11_1") or _pick_random_preserving_rod(block11_pools["task11_1"], current.get("task11_1")),
                "task11_2": task11_2,
                "task11_3": task11_3,
                "task11_4": _get_task11_if_valid("task11_4") or _pick_random_preserving_rod(block11_pools["task11_4"], current.get("task11_4")),
                "task11_5": _get_task11_if_valid("task11_5") or _pick_random_preserving_rod(block11_pools["task11_5"], current.get("task11_5")),
            }

        updated = _build_best_partial_variant(builder)
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if block == "block3":
        pinned_b3: dict[str, dict[str, Any]] = {}
        raw_pinned_b3 = payload.get("pinnedBlock3Tasks")
        if isinstance(raw_pinned_b3, dict):
            for _slot in BLOCK11_KEYS:
                _pt = raw_pinned_b3.get(_slot)
                if isinstance(_pt, dict):
                    pinned_b3[_slot] = _pt

        pinned_b3_author_tokens: list[str] = []
        for _pt in pinned_b3.values():
            pinned_b3_author_tokens.extend(_extract_author_tokens(_pt))

        _b3_theme_tokens = list(_get_theme_tokens(current.get("excerpt")) | _get_theme_tokens(current.get("poem")))
        pools = _build_block3_pools(
            block3,
            selected_block3_author_id,
            [
                str((current.get("work") or {}).get("authorId") or ""),
                str((current.get("poet") or {}).get("authorId") or ""),
                str((current.get("task5") or {}).get("authorId") or ""),
                *pinned_b3_author_tokens,
            ],
            excluded_theme_tokens=_b3_theme_tokens,
        )
        pools = _filter_block3_pools_by_variant_context(pools, current)
        pair_pools = _build_block3_pair_pools(pools["task11_2_3"])

        block11_rod_preference = payload.get("block11RodPreference")
        if not isinstance(block11_rod_preference, dict):
            block11_rod_preference = None

        _block3_builder_call_count = 0

        def builder() -> dict[str, Any]:
            nonlocal _block3_builder_call_count
            _block3_builder_call_count += 1

            if _block3_builder_call_count % 2 == 0:
                rod_candidate = _build_block11_rod_aware_candidate(current, pools, rod_preference=block11_rod_preference)
                if rod_candidate is not None:
                    if pinned_b3:
                        return {**rod_candidate, **pinned_b3}
                    return rod_candidate

            _p2 = pinned_b3.get("task11_2")
            _p3 = pinned_b3.get("task11_3")
            if _p2 and _p3:
                task11_2, task11_3 = _p2, _p3
            elif _p2:
                _others = [q for q in pools["task11_2_3"] if str(q.get("id") or "") != str(_p2.get("id") or "")]
                task11_3 = _pick_random(_others) if _others else _pick_random(pools["task11_2_3"])
                task11_2 = _p2
            elif _p3:
                _others = [q for q in pools["task11_2_3"] if str(q.get("id") or "") != str(_p3.get("id") or "")]
                task11_2 = _pick_random(_others) if _others else _pick_random(pools["task11_2_3"])
                task11_3 = _p3
            else:
                task11_2, task11_3 = _pick_two_distinct_block3_questions(
                    pools["task11_2_3"],
                    prebuilt_pools=pair_pools,
                )

            return {
                **current,
                "task11_1": pinned_b3.get("task11_1") or _pick_random(pools["task11_1"]),
                "task11_2": task11_2,
                "task11_3": task11_3,
                "task11_4": pinned_b3.get("task11_4") or _pick_random(pools["task11_4"]),
                "task11_5": pinned_b3.get("task11_5") or _pick_random(pools["task11_5"]),
            }

        updated = _build_best_partial_variant(builder)
        if _has_required_block11_signature(updated):
            best_diverse = updated
            best_diverse_eval = evaluate_variant_rules(updated)
            best_diversity_score = _get_block11_diversity_score(current, updated)

            max_rod_rotation = len(ROD_SINGLE_USE_IN_BLOCK11) * 10

            for _ in range(50):
                candidate = builder()
                if not _has_required_block11_signature(candidate):
                    continue

                candidate_eval = evaluate_variant_rules(candidate)
                candidate_diversity_score = _get_block11_diversity_score(current, candidate)

                if _is_better_evaluation(candidate_eval, best_diverse_eval):
                    best_diverse = candidate
                    best_diverse_eval = candidate_eval
                    best_diversity_score = candidate_diversity_score
                    continue

                same_quality = (
                    not _is_better_evaluation(best_diverse_eval, candidate_eval)
                    and not _is_better_evaluation(candidate_eval, best_diverse_eval)
                )
                if not same_quality:
                    continue

                if candidate_diversity_score > best_diversity_score:
                    best_diverse = candidate
                    best_diverse_eval = candidate_eval
                    best_diversity_score = candidate_diversity_score
                    continue

                if candidate_diversity_score == best_diversity_score and random.random() < 0.5:
                    best_diverse = candidate
                    best_diverse_eval = candidate_eval
                    best_diversity_score = candidate_diversity_score

                if bool(best_diverse_eval.get("ok")) and best_diversity_score >= max_rod_rotation + 5:
                    break

            updated = best_diverse

        if not _has_required_block11_signature(updated):
            repaired = _find_best_block11_compliant_variant(current, pools, pair_pools, rod_preference=block11_rod_preference)
            if repaired is not None:
                updated = repaired
            elif _has_required_block11_signature(current):
                updated = current

        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    raise ValueError("Неизвестный блок для обновления")


def _filter_and_limit_pool_for_refresh(pool: list[dict[str, Any]], excluded_ids: set[str], current_id: str) -> list[dict[str, Any]]:
    valid = [q for q in pool if str(q.get("id") or "") not in excluded_ids]
    if not valid:
        valid = pool
    limited = _limit_random_items(valid, MAX_REFRESH_TASK_POOL_ITEMS)
    return [q for q in limited if str(q.get("id") or "") != current_id]


def refresh_task_runtime(kb_payload: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    works = [entry for entry in kb_payload.get("works") or [] if isinstance(entry, dict)]
    poets = [entry for entry in kb_payload.get("poets") or [] if isinstance(entry, dict)]
    block3 = kb_payload.get("block3") if isinstance(kb_payload.get("block3"), dict) else {
        "task11_1": [],
        "task11_2_3": [],
        "task11_4": [],
        "task11_5": [],
    }

    variant_input = payload.get("variant")
    if not isinstance(variant_input, dict):
        raise ValueError("Текущий вариант не передан")

    key = str(payload.get("taskKey") or "")
    if key not in {
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
    }:
        raise ValueError("Неизвестный ключ задания")

    typed_key = key

    selected_theme_id = str(payload.get("selectedThemeId") or "")
    selected_block3_author_id = str(payload.get("selectedBlock3AuthorId") or "")
    task1_filters = _normalize_task1_filters(payload.get("task1Filters"))
    excluded_task_ids_set = set(str(eid) for eid in (payload.get("excludedTaskIds") or []))

    current = _normalize_variant(variant_input, works, poets)

    if typed_key == "task1":
        pools = _build_task_pools(current["work"], current["excerpt"], task1_filters, works)
        candidates = [
            {**current, "task1": question}
            for question in _filter_and_limit_pool_for_refresh(pools["task1"], excluded_task_ids_set, str((current.get("task1") or {}).get("id") or ""))
        ]
        updated = _select_best_candidate(current, candidates, "task1")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key == "task2":
        pools = _build_task_pools(current["work"], current["excerpt"], task1_filters, works)
        task2_action = str(payload.get("task2Action") or "full").strip().lower()

        _current_excerpt_id = str((current.get("excerpt") or {}).get("id") or "")
        _fresh_excerpt = _resolve_excerpt(current.get("work"), _current_excerpt_id)
        _fresh_excerpt_tasks = (_fresh_excerpt.get("tasks") if isinstance((_fresh_excerpt or {}).get("tasks"), dict) else {}) if _fresh_excerpt else {}

        if task2_action == "reroll":
            current_task2 = current.get("task2")
            if not isinstance(current_task2, dict):
                raise ValueError("Задание 2 отсутствует в текущем варианте")

            current_task2_id = str(current_task2.get("id") or "")
            base_question = _find_by_id(pools["task2"], current_task2_id) or current_task2
            excerpt_tasks = _fresh_excerpt_tasks

            current_identity = _get_variant_task_identity(current, "task2")
            candidates: list[dict[str, Any]] = []
            for _ in range(max(48, TASK2_PARTIAL_REFRESH_MAX_CANDIDATES)):
                runtime_task2 = _build_runtime_task2(current["work"], base_question, excerpt_tasks)
                if runtime_task2 is None:
                    continue
                candidate = {**current, "task2": runtime_task2}
                if _get_variant_task_identity(candidate, "task2") == current_identity:
                    continue
                candidates.append(candidate)
                if len(candidates) >= TASK2_PARTIAL_REFRESH_MAX_CANDIDATES:
                    break

            updated = _select_best_candidate(current, candidates, "task2")
            if _get_variant_task_identity(updated, "task2") == current_identity:
                raise ValueError("Не удалось обновить персонажей и свойства в задании 2")

            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        if task2_action == "properties":
            current_task2 = current.get("task2")
            if not isinstance(current_task2, dict):
                raise ValueError("Задание 2 отсутствует в текущем варианте")

            current_pairs = _normalize_runtime_task2_pairs(current_task2.get("pairs"))
            if not current_pairs:
                raise ValueError("В задании 2 нет доступных пар для обновления")

            current_task2_id = str(current_task2.get("id") or "")
            base_question = _find_by_id(pools["task2"], current_task2_id) or current_task2
            excerpt_tasks = _fresh_excerpt_tasks

            property_category = _resolve_task2_property_category(base_question, current["work"])
            exclusions = _build_task2_runtime_exclusions(excerpt_tasks)
            normalized_pairs = _get_prepared_task2_pairs(current["work"], base_question, property_category, exclusions)

            replacement_sets = _build_runtime_task2_all_properties_candidates(
                current["work"],
                base_question,
                property_category,
                exclusions,
                normalized_pairs,
                current_pairs,
            )
            if not replacement_sets:
                raise ValueError("Не удалось обновить свойства: для текущих персонажей нет новых сочетаний")

            current_identity = _get_variant_task_identity(current, "task2")
            candidates: list[dict[str, Any]] = []
            for next_pairs in replacement_sets:
                runtime_task2 = _build_runtime_task2_with_pairs(
                    current["work"],
                    base_question,
                    excerpt_tasks,
                    property_category,
                    exclusions,
                    normalized_pairs,
                    next_pairs,
                )
                if runtime_task2 is None:
                    continue
                candidate = {**current, "task2": runtime_task2}
                if _get_variant_task_identity(candidate, "task2") == current_identity:
                    continue
                candidates.append(candidate)

            updated = _select_best_candidate(current, candidates, "task2")
            if _get_variant_task_identity(updated, "task2") == current_identity:
                raise ValueError("Не удалось обновить свойства: подходящих замен не найдено")

            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        if task2_action in {"character", "property"}:
            current_task2 = current.get("task2")
            if not isinstance(current_task2, dict):
                raise ValueError("Задание 2 отсутствует в текущем варианте")

            current_pairs = _normalize_runtime_task2_pairs(current_task2.get("pairs"))
            if not current_pairs:
                raise ValueError("В задании 2 нет доступных пар для обновления")

            raw_pair_index = payload.get("task2PairIndex")
            try:
                pair_index = int(raw_pair_index)
            except (TypeError, ValueError):
                pair_index = -1
            if pair_index < 0 or pair_index >= len(current_pairs):
                pair_index = random.randrange(len(current_pairs))

            current_task2_id = str(current_task2.get("id") or "")
            base_question = _find_by_id(pools["task2"], current_task2_id) or current_task2
            excerpt_tasks = _fresh_excerpt_tasks

            property_category = _resolve_task2_property_category(base_question, current["work"])
            exclusions = _build_task2_runtime_exclusions(excerpt_tasks)
            normalized_pairs = _get_prepared_task2_pairs(current["work"], base_question, property_category, exclusions)
            action_literal: Literal["character", "property"] = "character" if task2_action == "character" else "property"
            replacement_pairs = _build_runtime_task2_replacement_candidates(
                current["work"],
                base_question,
                property_category,
                exclusions,
                normalized_pairs,
                current_pairs,
                pair_index,
                action_literal,
            )

            if not replacement_pairs:
                raise ValueError("Не нашёл другой вариант для выбранного героя или свойства")

            candidates: list[dict[str, Any]] = []
            for replacement_pair in _shuffle(replacement_pairs):
                next_pairs = copy.deepcopy(current_pairs)
                next_pairs[pair_index] = replacement_pair
                runtime_task2 = _build_runtime_task2_with_pairs(
                    current["work"],
                    base_question,
                    excerpt_tasks,
                    property_category,
                    exclusions,
                    normalized_pairs,
                    next_pairs,
                )
                if runtime_task2 is None:
                    continue
                candidates.append({**current, "task2": runtime_task2})
                if len(candidates) >= TASK2_PARTIAL_REFRESH_MAX_CANDIDATES:
                    break

            updated = _select_best_candidate(current, candidates, "task2")
            if _get_variant_task_identity(updated, "task2") == _get_variant_task_identity(current, "task2"):
                raise ValueError("Не удалось обновить задание 2: подходящих замен не найдено")

            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        candidates = []
        for question in _filter_and_limit_pool_for_refresh(pools["task2"], excluded_task_ids_set, str((current.get("task2") or {}).get("id") or "")):
            runtime_task2 = _build_runtime_task2(current["work"], question, (current.get("excerpt") or {}).get("tasks") or {})
            if runtime_task2 is None:
                continue
            candidates.append({**current, "task2": runtime_task2})
        updated = _select_best_candidate(current, candidates, "task2")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key == "task3":
        pools = _build_task_pools(current["work"], current["excerpt"], task1_filters, works)
        runtime_candidates = _build_runtime_two_gap_candidates(pools["task3"], "task3")
        candidates = [
            {**current, "task3": question}
            for question in _filter_and_limit_pool_for_refresh(runtime_candidates, excluded_task_ids_set, str((current.get("task3") or {}).get("id") or ""))
        ]
        updated = _select_best_candidate(current, candidates, "task3")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key in {"task4_1", "task4_2", "task5"}:
        pools = _build_task_pools(current["work"], current["excerpt"], task1_filters, works)
        pool = pools[typed_key]
        current_id = str((current.get(typed_key) or {}).get("id") or "")
        candidates = [
            {**current, typed_key: question}
            for question in _filter_and_limit_pool_for_refresh(pool, excluded_task_ids_set, current_id)
        ]
        updated = _select_best_candidate(current, candidates, typed_key)
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key in {"task6", "task7", "task8", "task9_1", "task9_2", "task10"}:
        pools = _build_poem_pools(
            current["poem"],
            poets,
            selected_theme_id,
            excluded_theme_tokens=_get_theme_tokens(current.get("excerpt")),
        )

        if typed_key == "task6":
            runtime_candidates = _build_runtime_two_gap_candidates(pools["task6"], "task6")
            candidates = [
                {**current, "task6": question}
                for question in _filter_and_limit_pool_for_refresh(runtime_candidates, excluded_task_ids_set, str((current.get("task6") or {}).get("id") or ""))
            ]
            updated = _select_best_candidate(current, candidates, "task6")
            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        if typed_key == "task7":
            candidates = [
                {**current, "task7": question}
                for question in _filter_and_limit_pool_for_refresh(pools["task7"], excluded_task_ids_set, str((current.get("task7") or {}).get("id") or ""))
            ]
            updated = _select_best_candidate(current, candidates, "task7")
            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        if typed_key == "task8":
            question_candidates = [
                {
                    **current,
                    "task8": question,
                    "task8Options": _build_task8_options(question),
                }
                for question in _filter_and_limit_pool_for_refresh(pools["task8"], excluded_task_ids_set, str((current.get("task8") or {}).get("id") or ""))
            ]

            active_task8 = current.get("task8") or (pools["task8"][0] if pools["task8"] else None)
            previous_signature = _get_task8_options_signature(current.get("task8Options") or [])
            reshuffled_candidates = []
            if active_task8:
                for _ in range(24):
                    candidate = {
                        **current,
                        "task8": active_task8,
                        "task8Options": _build_task8_options(active_task8),
                    }
                    if _get_task8_options_signature(candidate["task8Options"]) != previous_signature:
                        reshuffled_candidates.append(candidate)

            candidates = question_candidates + reshuffled_candidates
            if not candidates and active_task8:
                updated = {
                    **current,
                    "task8": active_task8,
                    "task8Options": _build_task8_options(active_task8),
                }
                return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

            updated = _select_best_candidate(current, candidates, "task8")
            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        if typed_key == "task9_1":
            candidates = [
                {**current, "task9_1": question}
                for question in _filter_and_limit_pool_for_refresh(pools["task9_1"], excluded_task_ids_set, str((current.get("task9_1") or {}).get("id") or ""))
            ]
            updated = _select_best_candidate(current, candidates, "task9_1")
            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        if typed_key == "task9_2":
            candidates = [
                {**current, "task9_2": question}
                for question in _filter_and_limit_pool_for_refresh(pools["task9_2"], excluded_task_ids_set, str((current.get("task9_2") or {}).get("id") or ""))
            ]
            updated = _select_best_candidate(current, candidates, "task9_2")
            return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

        candidates = [
            {**current, "task10": question}
            for question in _filter_and_limit_pool_for_refresh(pools["task10"], excluded_task_ids_set, str((current.get("task10") or {}).get("id") or ""))
        ]
        updated = _select_best_candidate(current, candidates, "task10")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    _task_refresh_theme_tokens = list(_get_theme_tokens(current.get("excerpt")) | _get_theme_tokens(current.get("poem")))
    pools = _build_block3_pools(
        block3,
        selected_block3_author_id,
        [
            str((current.get("work") or {}).get("authorId") or ""),
            str((current.get("poet") or {}).get("authorId") or ""),
            str((current.get("task5") or {}).get("authorId") or ""),
        ],
        excluded_theme_tokens=_task_refresh_theme_tokens,
    )
    pools = _filter_block3_pools_by_variant_context(pools, current)

    def _select_block11_preserving(
        base: dict[str, Any],
        candidates: list[dict[str, Any]],
        key: VariantTaskKey,
    ) -> dict[str, Any]:
        """Pick a candidate that keeps a valid block11 signature (rod + exclusive locked).

        Prefer candidates with the same rod signature as the current task.
        If no same-rod candidate produces a different question, fall back to
        any candidate — never get stuck returning the same question forever.
        """
        if not candidates:
            return base

        old_task = base.get(key)
        old_signature = _get_block11_special_signature(old_task) if old_task else ""

        filtered_candidates = [
            c for c in candidates
            if (_get_block11_special_signature(c.get(key)) if c.get(key) else "") == old_signature
        ]

        if filtered_candidates:
            strict = _select_best_candidate(base, filtered_candidates, key, require_block11_rules=True)
            if _get_variant_task_identity(strict, key) != _get_variant_task_identity(base, key):
                return strict

        fallback = _select_best_candidate(base, candidates, key, require_block11_rules=True)
        if _get_variant_task_identity(fallback, key) != _get_variant_task_identity(base, key):
            return fallback

        return base

    if typed_key == "task11_1":
        base_candidates = [
            {**current, "task11_1": question}
            for question in _filter_and_limit_pool_for_refresh(pools["task11_1"], excluded_task_ids_set, str((current.get("task11_1") or {}).get("id") or ""))
        ]
        updated = _select_block11_preserving(current, base_candidates, "task11_1")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key == "task11_2":
        normalized_prev = (
            {**current, "task11_3": None}
            if isinstance(current.get("task11_2"), dict)
            and isinstance(current.get("task11_3"), dict)
            and _has_block3_author_overlap(current["task11_2"], current["task11_3"])
            else current
        )

        excluded = {str((current.get("task11_2") or {}).get("id") or ""), str((current.get("task11_3") or {}).get("id") or "")}
        base_candidates = []
        for question in _filter_and_limit_pool_for_refresh(pools["task11_2_3"], excluded_task_ids_set, ""):
            if str(question.get("id") or "") in excluded:
                continue
            base_candidates.append({**normalized_prev, "task11_2": question})

        updated = _select_block11_preserving(normalized_prev, base_candidates, "task11_2")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key == "task11_3":
        normalized_prev = (
            {**current, "task11_3": None}
            if isinstance(current.get("task11_2"), dict)
            and isinstance(current.get("task11_3"), dict)
            and _has_block3_author_overlap(current["task11_2"], current["task11_3"])
            else current
        )

        excluded = {str((current.get("task11_3") or {}).get("id") or ""), str((current.get("task11_2") or {}).get("id") or "")}
        base_candidates = []
        for question in _filter_and_limit_pool_for_refresh(pools["task11_2_3"], excluded_task_ids_set, ""):
            if str(question.get("id") or "") in excluded:
                continue
            base_candidates.append({**normalized_prev, "task11_3": question})

        updated = _select_block11_preserving(normalized_prev, base_candidates, "task11_3")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key == "task11_4":
        base_candidates = [
            {**current, "task11_4": question}
            for question in _filter_and_limit_pool_for_refresh(pools["task11_4"], excluded_task_ids_set, str((current.get("task11_4") or {}).get("id") or ""))
        ]
        updated = _select_block11_preserving(current, base_candidates, "task11_4")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    if typed_key == "task11_5":
        base_candidates = [
            {**current, "task11_5": question}
            for question in _filter_and_limit_pool_for_refresh(pools["task11_5"], excluded_task_ids_set, str((current.get("task11_5") or {}).get("id") or ""))
        ]
        updated = _select_block11_preserving(current, base_candidates, "task11_5")
        return {"variant": updated, "evaluation": evaluate_variant_rules(updated)}

    raise ValueError("Неизвестный ключ задания")
