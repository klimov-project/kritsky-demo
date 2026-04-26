from typing import Any
import re
from .constants import (
    SERVICE_TAGS, ROD_SINGLE_USE_IN_BLOCK11, NO_AUTHOR_TAGS,
    HTML_TAG_PATTERN, SPLIT_PATTERN
)

def _is_object_record(value: Any) -> bool:
    return isinstance(value, dict)

def _normalize_tag(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"^тег\.?\s*", "", value.lower().lstrip("#"))).strip()

def _normalize_tag_kind_token(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[._-]+", " ", _normalize_tag(value))).strip()

def _tag_matches_kind(value: str, expected_kind: str) -> bool:
    normalized = _normalize_tag(value)
    normalized_kind = _normalize_tag_kind_token(expected_kind)
    if not normalized_kind: return False
    return (
        normalized == normalized_kind
        or normalized.startswith(f"{normalized_kind}:")
        or normalized.startswith(f"{normalized_kind}.")
        or normalized.startswith(f"{normalized_kind} ")
    )

def _get_structured_tag_payload(value: str, expected_kind: str) -> str:
    normalized = _normalize_tag(value)
    normalized_kind = _normalize_tag_kind_token(expected_kind)
    if not normalized_kind or normalized == normalized_kind: return ""
    if normalized.startswith(f"{normalized_kind}:") or normalized.startswith(f"{normalized_kind}."):
        return normalized[len(normalized_kind) + 1 :].strip()
    if normalized.startswith(f"{normalized_kind} "):
        return normalized[len(normalized_kind) + 1 :].strip()
    return ""

def _split_values(value: str) -> list[str]:
    return [entry.strip() for entry in SPLIT_PATTERN.split(value) if entry and entry.strip()]

def _parse_tag_value(value: Any) -> list[str]:
    if value is None: return []
    chunks = []
    if isinstance(value, str): chunks.append(value)
    elif isinstance(value, list): chunks.extend([e for e in value if isinstance(e, str)])
    normalized = [_normalize_tag(e) for chunk in chunks for e in _split_values(chunk)]
    unique, seen = [], set()
    for e in normalized:
        if not e or e in seen: continue
        seen.add(e)
        unique.append(e)
    return unique

def _parse_identifier_tokens(value: Any) -> list[str]:
    if value is None: return []
    chunks = []
    if isinstance(value, str): chunks.append(value)
    elif isinstance(value, list): chunks.extend([e for e in value if isinstance(e, str)])
    normalized = [e.strip().lower() for chunk in chunks for e in _split_values(chunk)]
    unique, seen = [], set()
    for e in normalized:
        if not e or e in seen: continue
        seen.add(e)
        unique.append(e)
    return unique

def _read_identifier_field(value: Any, field: str) -> list[str]:
    if not _is_object_record(value): return []
    return _parse_identifier_tokens(value.get(field))

def _read_string_field(value: Any, field: str) -> str:
    if not _is_object_record(value): return ""
    raw = value.get(field)
    return raw.strip() if isinstance(raw, str) else ""

def _get_tags(value: Any) -> list[str]:
    if not _is_object_record(value): return []
    return _parse_tag_value(value.get("tags")) + [
        e for e in _parse_tag_value(value.get("tag")) if e not in _parse_tag_value(value.get("tags"))
    ]

def _is_author_tag(tag: str) -> bool: return _tag_matches_kind(tag, "автор")
def _is_term_tag(tag: str) -> bool: return _tag_matches_kind(tag, "термин")
def _is_theme_tag(tag: str) -> bool: return _tag_matches_kind(tag, "тема")
def _is_rod_tag(tag: str) -> bool: return _tag_matches_kind(tag, "род")
def _is_character_tag(tag: str) -> bool: return _tag_matches_kind(tag, "персонаж")

def _is_exclusive_question_tag(tag: str) -> bool:
    return (
        _tag_matches_kind(tag, "искл вопрос")
        or _tag_matches_kind(tag, "исключительный вопрос")
        or _tag_matches_kind(tag, "спец вопрос")
    )

def _is_exclusive_question(value: Any) -> bool:
    if _is_object_record(value) and value.get("special") is True: return True
    return any(_is_exclusive_question_tag(tag) for tag in _get_tags(value))

def _extract_term_tokens(value: Any, fallback_token_prefix: str) -> list[str]:
    tokens: set[str] = set()
    for field in ("termId", "termId1", "termId2", "term", "term1", "term2"):
        for token in _read_identifier_field(value, field):
            tokens.add(token)
    if _is_object_record(value) and isinstance(value.get("options"), list):
        for option in value["options"]:
            for field in ("termId", "termId1", "termId2", "term", "term1", "term2"):
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

def _build_id_exclusion_set(values: list[str] | None) -> set[str]:
    return {str(v).strip().lower() for v in values or [] if str(v).strip()}

def _build_identifier_exclusion_set(values: list[str] | None) -> set[str]:
    return {str(v).strip().lower() for v in values or [] if str(v).strip()}

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
    if "лири" in normalized: return "лирика"
    if "пьес" in normalized: return "пьеса"
    if "поэм" in normalized: return "поэма"
    if "проз" in normalized: return "проза"
    return normalized

def _extract_rod_tokens(value: Any) -> list[str]:
    tokens: set[str] = set()
    rod_id = _read_string_field(value, "rodId")
    if rod_id: tokens.add(_normalize_rod(rod_id))
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

def _extract_custom_internal_tags(value: Any) -> list[str]:
    result: list[str] = []
    for tag in _get_tags(value):
        if _is_structural_tag(tag): continue
        result.append("искл вопрос" if _is_exclusive_question_tag(tag) else tag)
    return result

def _is_structural_tag(tag: str) -> bool:
    if tag in SERVICE_TAGS: return True
    if tag in NO_AUTHOR_TAGS: return True
    if _is_author_tag(tag): return True
    if _is_term_tag(tag): return True
    if _is_theme_tag(tag): return True
    if _is_rod_tag(tag): return True
    if _is_character_tag(tag): return True
    return False

def _has_character_tag(value: Any) -> bool:
    return any(_is_character_tag(tag) for tag in _get_tags(value))

def _filter_active_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in items if item.get("isActive") is not False]
