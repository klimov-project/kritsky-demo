from typing import Any

from .constants import (
    ALL_TASK_KEYS,
    BLOCK11_KEYS,
    SERVICE_TAGS,
    SERVICE_TAG_ALLOWED_KEYS,
    CHARACTER_TAG_ALLOWED_KEYS,
)
from .tokens import (
    _extract_author_tokens,
    _extract_theme_tokens,
    _extract_term_tokens,
    _extract_rod_tokens,
    _get_tags,
    _has_character_tag,
    _read_identifier_field,
    _get_structured_tag_payload,
    _parse_identifier_tokens,
)

def evaluate_variant_rules2(variant: dict[str, Any]) -> dict[str, Any]:
    errors = []
    
    # 1. Author uniqueness
    used_authors = set()
    work_authors = _extract_author_tokens(variant.get("work"))
    poet_authors = _extract_author_tokens(variant.get("poet"))
    
    for a in work_authors:
        if a in used_authors: errors.append(f"Дубликат автора произведения: {a}")
        used_authors.add(a)
    for a in poet_authors:
        if a in used_authors: errors.append(f"Дубликат автора поэта: {a}")
        used_authors.add(a)
        
    # 2. Theme uniqueness + Excerpt/Poem conflict
    used_themes = set()
    excerpt_themes = _extract_theme_tokens(variant.get("excerpt"), "excerpt")
    poem_themes = _extract_theme_tokens(variant.get("poem"), "poem")
    
    if set(excerpt_themes) & set(poem_themes):
        errors.append(f"Конфликт тем: Отрывок ({excerpt_themes}) и Стихотворение ({poem_themes})")
        
    for t in excerpt_themes: used_themes.add(t)
    for t in poem_themes: used_themes.add(t)
    
    # 3. Term uniqueness
    used_terms = set()
    
    # 5. Character tag limit
    character_tag_count = 0
    
    # Check all tasks
    for key in ALL_TASK_KEYS:
        q = variant.get(key)
        if not q: continue
        
        # Authors in questions
        q_authors = _extract_author_tokens(q)
        for a in q_authors:
            if a in used_authors: errors.append(f"Дубликат автора {a} в {key}")
            used_authors.add(a)
            
        # Themes in questions
        q_themes = _extract_theme_tokens(q, key)
        for t in q_themes:
            if t in used_themes: errors.append(f"Дубликат темы {t} в {key}")
            used_themes.add(t)
            
        # Terms in questions (GAP-6: skip task8 options, only check task8 question itself)
        if key == "task8":
            # For task8, check only question-level terms, not individual options
            q_terms = []
            for f in ("termId", "termId1", "termId2", "term", "term1", "term2"):
                q_terms.extend(_read_identifier_field(q, f))
            for tag in _get_tags(q):
                payload_val = _get_structured_tag_payload(tag, "термин")
                if payload_val:
                    q_terms.extend(_parse_identifier_tokens(payload_val))
        else:
            q_terms = _extract_term_tokens(q, key)
        for t in q_terms:
            if t in used_terms: errors.append(f"Дубликат термина {t} в {key}")
            used_terms.add(t)
            
        # Service tags rule
        s_tags = [t for t in _get_tags(q) if t in SERVICE_TAGS]
        if s_tags and key not in SERVICE_TAG_ALLOWED_KEYS:
            errors.append(f"Сервисные теги {s_tags} запрещены в {key}")
            
        # Character tag rule
        if _has_character_tag(q):
            character_tag_count += 1
            if key not in CHARACTER_TAG_ALLOWED_KEYS:
                errors.append(f"Тег персонажа запрещен в {key}")

    if character_tag_count > 1:
        errors.append(f"Слишком много тегов персонажа в варианте: {character_tag_count}")

    # 6. Block 11 Rods (2 prose, 1 lyric, 1 play, 1 poem)
    rods_in_b11 = []
    for key in BLOCK11_KEYS:
        rods_in_b11.extend(_extract_rod_tokens(variant.get(key)))
    
    rod_counts = {r: rods_in_b11.count(r) for r in ["лирика", "пьеса", "поэма", "проза"]}
    if rod_counts.get("проза", 0) < 2: errors.append(f"Недостаточно прозы в Блоке 11 (найдено {rod_counts.get('проза')})")
    for r in ["лирика", "пьеса", "поэма"]:
        if rod_counts.get(r, 0) < 1: errors.append(f"Отсутствует обязательный род {r} в Блоке 11")

    return {
        "ok": len(errors) == 0,
        "errors": errors,
        "criticalDuplicateTokensCount": len(errors),
        "rodCounts": rod_counts
    }
