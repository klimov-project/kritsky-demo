import copy
import random
import re
from typing import Any, Literal

from .constants import (
    TASK2_PAIR_PICK_ATTEMPTS,
    TASK8_MAX_OPTIONS,
    TASK8_MIN_CORRECT_OPTIONS,
    TASK8_MAX_CORRECT_OPTIONS,
    SERVICE_TAGS,
    NO_AUTHOR_TAGS,
)
from .tokens import (
    _extract_term_tokens,
    _extract_custom_internal_tags,
    _extract_rod_tokens,
    _extract_author_tokens,
    _is_exclusive_question,
    _get_tags,
    _is_author_tag,
)
from .context import (
    SelectionContext,
    _can_select_question,
    _shuffle,
    _pick_many_random,
)

# --- Task 2 Helpers ---

def _normalize_task2_comparable(value: str) -> str:
    cleaned = str(value).replace("&nbsp;", " ").replace("\xa0", " ")
    cleaned = re.sub(r"<[^>]*>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip().lower()

def _build_text_exclusion_set(values: list[str] | None) -> set[str]:
    tokens: set[str] = set()
    for value in values or []:
        normalized = _normalize_task2_comparable(value)
        if normalized: tokens.add(normalized)
    return tokens

def _build_task2_runtime_exclusions(excerpt_tasks: dict[str, Any] | None) -> dict[str, set[str]]:
    excerpt_tasks = excerpt_tasks or {}
    return {
        "characters": _build_text_exclusion_set(excerpt_tasks.get("excludeTask2Characters")),
        "properties": _build_text_exclusion_set(excerpt_tasks.get("excludeTask2Properties")),
    }

def _build_property_id_lookup(pair: dict[str, Any]) -> dict[str, str]:
    ids = pair.get("propertyIds")
    if not isinstance(ids, list): return {}
    mapping = {}
    for field in ("properties", "phrases", "characteristics"):
        raw = pair.get(field)
        if not isinstance(raw, list): continue
        for i, val in enumerate(raw):
            if not isinstance(val, str) or not val.strip(): continue
            key = val.strip()
            if key not in mapping and i < len(ids) and isinstance(ids[i], str) and ids[i].strip():
                mapping[key] = ids[i].strip()
    return mapping

def _get_property_id_at(pair: dict[str, Any], index: int) -> str:
    ids = pair.get("propertyIds")
    if isinstance(ids, list) and index < len(ids) and isinstance(ids[index], str):
        return ids[index].strip()
    return ""

def _is_property_excluded(property_value: str, property_id: str, exclusion_set: set[str]) -> bool:
    if _normalize_task2_comparable(property_value) in exclusion_set: return True
    if property_id and _normalize_task2_comparable(property_id) in exclusion_set: return True
    return False

def _get_pair_properties_by_category(pair: dict[str, Any], category: Literal["phrases", "characteristics"]) -> list[str]:
    def norm_list(val):
        if not isinstance(val, list): return []
        return [str(item).strip() for item in val if isinstance(item, str) and str(item).strip()]
    typed = norm_list(pair.get("phrases") if category == "phrases" else pair.get("characteristics"))
    if typed: return typed
    return norm_list(pair.get("properties"))

def _resolve_task2_property_category(question: dict[str, Any], work: dict[str, Any]) -> Literal["phrases", "characteristics"]:
    pair_property_type = question.get("pairPropertyType")
    if pair_property_type in ("phrases", "characteristics"): return pair_property_type
    character_source = question.get("characterSource")
    if character_source == "quotes": return "phrases"
    if character_source == "facts": return "characteristics"
    return "phrases"

def _get_prepared_task2_pairs(work: dict[str, Any], question: dict[str, Any], category: Literal["phrases", "characteristics"], exclusions: dict[str, set[str]]) -> list[dict[str, Any]]:
    result = []
    for pair in question.get("pairs") or []:
        if not isinstance(pair, dict): continue
        name = str(pair.get("character") or "")
        if _normalize_task2_comparable(name) in exclusions["characters"]: continue
        props = _get_pair_properties_by_category(pair, category)
        allowed = [p for i, p in enumerate(props) if not _is_property_excluded(p, _get_property_id_at(pair, i), exclusions["properties"])]
        if not name.strip() or not allowed: continue
        lookup = _build_property_id_lookup(pair)
        np = copy.deepcopy(pair)
        np["properties"] = allowed
        np["propertyIds"] = [lookup.get(p, "") for p in allowed]
        result.append(np)
    return result

def _pick_task2_pairs_with_single_options(pairs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not pairs: return []
    for _ in range(TASK2_PAIR_PICK_ATTEMPTS):
        used_options, used_tags, attempt_pairs = set(), set(), []
        shuffled_candidates = _shuffle(copy.deepcopy(pairs))
        for pair in shuffled_candidates:
            tag = str(pair.get("tag") or "").strip().lower()
            if tag and tag in used_tags: continue
            props = pair.get("properties") or []
            indices = _shuffle(list(range(len(props))))
            sel_idx = next((i for i in indices if props[i] not in used_options), None)
            if sel_idx is None: continue
            selected = props[sel_idx]
            used_options.add(selected)
            if tag: used_tags.add(tag)
            np = copy.deepcopy(pair)
            np["properties"] = [selected]
            lookup = _build_property_id_lookup(pair)
            np["propertyIds"] = [lookup.get(selected, "")]
            attempt_pairs.append(np)
            if len(attempt_pairs) == 3:
                return attempt_pairs
    return []

def _build_runtime_task2(work: dict[str, Any], question: dict[str, Any] | None, excerpt_tasks: dict[str, Any] | None = None) -> dict[str, Any] | None:
    if not question: return None
    category = _resolve_task2_property_category(question, work)
    exclusions = _build_task2_runtime_exclusions(excerpt_tasks)
    prep = _get_prepared_task2_pairs(work, question, category, exclusions)
    pairs = _pick_task2_pairs_with_single_options(prep)
    if len(pairs) < 3: return None
    
    used_props = {p["properties"][0] for p in pairs}
    potential_props = set()
    for pair in prep:
        for p in pair.get("properties", []):
            if p not in used_props:
                potential_props.add(p)
                
    if not potential_props:
        return None
        
    extra_option = _shuffle(list(potential_props))[0]
    
    options = []
    for p in pairs:
        options.append(p["properties"][0])
    options.append(extra_option)
    options = _shuffle(options)
    
    next_q = copy.deepcopy(question)
    next_q["pairs"] = pairs
    next_q["extraOption"] = extra_option
    next_q["options"] = options
    return next_q

# --- Two-Gap Helpers ---

def _is_two_gap_valid(question: dict[str, Any]) -> bool:
    answer1 = str(question.get("answer1") or "")
    answer2 = str(question.get("answer2") or "")
    return len(re.sub(r"\s+", "", f"{answer1}{answer2}")) <= 17

def _build_paired_runtime_two_gap(first: dict[str, Any], second: dict[str, Any], runtime_key: str) -> dict[str, Any]:
    # Deduplicate tags while preserving order, and filter out "no author" tags
    # because the combined task always has author context from the first part.
    tags1 = [t.strip() for t in (first.get("tags") or "").split(",") if t.strip()]
    tags2 = [t.strip() for t in (second.get("tags") or "").split(",") if t.strip()]
    unique_tags = []
    seen_tags = set()
    for t in tags1 + tags2:
        norm_t = t.lower()
        if norm_t not in seen_tags and norm_t not in NO_AUTHOR_TAGS:
            unique_tags.append(t)
            seen_tags.add(norm_t)

    return {
        "id": f"{runtime_key}-{first.get('id')}-{second.get('id')}",
        "part1": first.get("part1") or "",
        "part2": second.get("part1") or "_____",
        "answer1": first.get("answer1") or "",
        "answer2": second.get("answer1") or "",  # second is a single-gap question; its answer lives in answer1
        "termId1": first.get("termId1") or first.get("termId"),
        "termId2": second.get("termId1") or second.get("termId"),
        "tags": ", ".join(unique_tags),
        # The combined task names the author in Part 1, so it's not "withoutAuthor".
        "withoutAuthor": bool(first.get("withoutAuthor")),
        # Copy metadata for the validator
        "authorId": first.get("authorId"),
        "authorIds": first.get("authorIds"),
        "workId": first.get("workId"),
    }

def _build_runtime_two_gap_candidates(entries: list[dict[str, Any]], runtime_key: str, ctx: SelectionContext) -> list[dict[str, Any]]:
    valid = [e for e in entries if _is_two_gap_valid(e)]
    pairs = []
    for i, first in enumerate(valid):
        if first.get("withoutAuthor") or not _can_select_question(first, runtime_key, ctx): continue
        first_tags = set(_extract_custom_internal_tags(first))
        for j, second in enumerate(valid):
            if i == j or not second.get("part1"): continue
            
            # Prevent double author mentions in text (by tags)
            first_has_author = any(_is_author_tag(t) for t in _get_tags(first))
            second_has_author = any(_is_author_tag(t) for t in _get_tags(second))
            if first_has_author and second_has_author: continue
            
            if second.get("withoutAuthor") and not first_has_author: continue
            if not _can_select_question(second, runtime_key, ctx): continue
            
            # Check for compatibility tag collisions within the pair
            second_tags = set(_extract_custom_internal_tags(second))
            if first_tags & second_tags: continue
            
            # Prevent SERVICE_TAGS repetition within the pair
            first_service = {t for t in _get_tags(first) if t in SERVICE_TAGS}
            second_service = {t for t in _get_tags(second) if t in SERVICE_TAGS}
            if first_service & second_service: continue
            
            term1 = str(first.get("termId1") or first.get("termId") or "").strip().lower()
            term2 = str(second.get("termId1") or second.get("termId") or "").strip().lower()
            if term1 and term2 and term1 == term2: continue
            
            candidate = _build_paired_runtime_two_gap(first, second, runtime_key)
            if _is_two_gap_valid(candidate): pairs.append(candidate)
            
    with_terms = [p for p in pairs if _extract_term_tokens(p, runtime_key)]
    final_candidates = with_terms if with_terms else pairs
    import logging
    logging.getLogger("randomizer").info(f"[RANDOMIZER POOL] Slot {runtime_key}: {len(final_candidates)} valid candidates formed.")
    return final_candidates

# --- Task 8 Options ---

def _task8_correct_terms(question: dict[str, Any]) -> set[str]:
    """Extract term tokens from correct options of a task8 question."""
    if not question or not isinstance(question.get("options"), list): return set()
    terms: set[str] = set()
    for o in question["options"]:
        if isinstance(o, dict) and o.get("isCorrect") and o.get("isActive") is not False:
            terms.update(_extract_term_tokens(o, "task8-option"))
    return terms

def _task8_has_term_conflict(question: dict[str, Any], ctx: SelectionContext) -> bool:
    """GAP-1: Check if task8 question's correct answers conflict with already used terms."""
    correct_terms = _task8_correct_terms(question)
    return bool(correct_terms & ctx.used_term_tokens)

def _build_task8_options(question: dict[str, Any] | None, ctx: SelectionContext) -> list[dict[str, Any]]:
    if not question or not isinstance(question.get("options"), list): return []
    options = [o for o in question["options"] if isinstance(o, dict) and o.get("isActive") is not False]
    
    correct = [o for o in options if o.get("isCorrect")]
    incorrect = [o for o in options if not o.get("isCorrect")]
    
    if not correct: return []
    
    def is_option_allowed(o):
        o_terms = set(_extract_term_tokens(o, "task8-option"))
        return not (o_terms & ctx.used_term_tokens)
        
    allowed_incorrect = [o for o in incorrect if is_option_allowed(o)]
    
    valid_pairs = []
    for nc in range(2, min(len(correct), 6) + 1):
        ni = 7 - nc
        if ni >= 1 and ni <= 5:
            valid_pairs.append((nc, ni))
            
    if not valid_pairs:
        for nc in range(1, len(correct) + 1):
            ni = 7 - nc
            if ni >= 0:
                valid_pairs.append((nc, ni))
                
    if not valid_pairs:
        all_shuffled = _shuffle(correct + incorrect)
        return all_shuffled[:7]
        
    nc, ni = random.choice(valid_pairs)
    picked_correct = _pick_many_random(correct, nc)
    
    picked_incorrect = _pick_many_random(allowed_incorrect, ni)
    if len(picked_incorrect) < ni:
        remaining = ni - len(picked_incorrect)
        used_ids = {str(o.get("id")) for o in picked_incorrect}
        fallback_incorrect = [o for o in incorrect if str(o.get("id")) not in used_ids]
        extra_incorrect = _pick_many_random(fallback_incorrect, remaining)
        picked_incorrect.extend(extra_incorrect)
        
    if len(picked_correct) + len(picked_incorrect) < 7:
        used_c_ids = {str(o.get("id")) for o in picked_correct}
        fallback_correct = [o for o in correct if str(o.get("id")) not in used_c_ids]
        extra_correct = _pick_many_random(fallback_correct, 7 - (len(picked_correct) + len(picked_incorrect)))
        picked_correct.extend(extra_correct)
        
    final_options = []
    for o in picked_correct:
        oc = copy.deepcopy(o)
        oc["isCorrect"] = True
        final_options.append(oc)
        
    for o in picked_incorrect:
        oc = copy.deepcopy(o)
        if "isCorrect" not in oc:
            oc["isCorrect"] = False
        final_options.append(oc)
        
    final_options = _shuffle(final_options)
    
    for o in final_options:
        for t in _extract_term_tokens(o, "task8-option"):
            ctx.used_term_tokens.add(t)
            
    return final_options

# --- Rod Layout for Block 3 ---

ROD_LAYOUT_BASE = ["лирика", "пьеса", "поэма", "проза", "проза"]

def _generate_rod_layout() -> list[str]: return _shuffle(ROD_LAYOUT_BASE)

def _rotate_rod_layout(layout: list[str]) -> list[str]:
    """GAP-2: Cyclic rotation of rod layout for full Block 11 refresh."""
    if not layout or len(layout) < 2: return list(layout)
    return layout[1:] + layout[:1]

def _group_pool_by_rod(pool: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = {"лирика": [], "пьеса": [], "поэма": [], "проза": []}
    for q in pool:
        found, rods = False, _extract_rod_tokens(q)
        for r in ["лирика", "пьеса", "поэма", "проза"]:
            if r in rods:
                groups[r].append(q)
                found = True
                break
        if not found: groups["проза"].append(q)
    return groups

def _find_exclusive_slot(rod_layout: list[str], rod_groups: dict[str, list[dict[str, Any]]]) -> int:
    """GAP-4: Find a slot index where exclusive questions exist for the assigned rod."""
    candidates = []
    for i, rod in enumerate(rod_layout):
        pool = rod_groups.get(rod) or []
        if any(_is_exclusive_question(q) for q in pool):
            candidates.append(i)
    if candidates:
        return random.choice(candidates)
    return random.randint(0, len(rod_layout) - 1)  # Fallback: no exclusive questions at all
