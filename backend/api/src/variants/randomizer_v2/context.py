import random
from typing import Any, Dict, List, Set
from dataclasses import dataclass, field

from .constants import NO_AUTHOR_TAGS
from .tokens import (
    _extract_author_tokens,
    _extract_theme_tokens,
    _extract_term_tokens,
    _extract_custom_internal_tags,
    _has_character_tag,
    _get_tags,
)

def _pick_random(items: list[Any]) -> Any | None:
    if not items: return None
    return random.choice(items)

def _shuffle(items: list[Any]) -> list[Any]:
    next_items = list(items)
    random.shuffle(next_items)
    return next_items

def _pick_many_random(items: list[Any], count: int) -> list[Any]:
    if count <= 0: return []
    return _shuffle(items)[:count]

@dataclass
class SelectionContext:
    used_author_tokens: Set[str] = field(default_factory=set)
    used_theme_tokens: Set[str] = field(default_factory=set)
    used_term_tokens: Set[str] = field(default_factory=set)
    character_tag_count: int = 0
    
    def copy(self):
        return SelectionContext(
            used_author_tokens=set(self.used_author_tokens),
            used_theme_tokens=set(self.used_theme_tokens),
            used_term_tokens=set(self.used_term_tokens),
            character_tag_count=self.character_tag_count
        )

    def add_question_tokens(self, question: Dict[str, Any], key: str):
        if not question: return
        for token in _extract_author_tokens(question):
            self.used_author_tokens.add(token)
        for token in _extract_theme_tokens(question, key):
            self.used_theme_tokens.add(token)
        for token in _extract_term_tokens(question, key):
            self.used_term_tokens.add(token)
        if _has_character_tag(question):
            self.character_tag_count += 1

def _get_question_tokens(question: Dict[str, Any], key: str) -> Dict[str, Set[str]]:
    return {
        "authors": set(_extract_author_tokens(question)),
        "themes": set(_extract_theme_tokens(question, key)),
        "terms": set(_extract_term_tokens(question, key)),
        "custom_tags": set(_extract_custom_internal_tags(question))
    }

def _can_select_question(question: Dict[str, Any], key: str, ctx: SelectionContext) -> bool:
    if not question: return True
    tokens = _get_question_tokens(question, key)
    
    # Author check with "withoutAuthor" exception
    if tokens["authors"] & ctx.used_author_tokens:
        is_without_author = bool(question.get("withoutAuthor"))
        if not is_without_author:
            tags = _get_tags(question)
            is_without_author = any(t in NO_AUTHOR_TAGS for t in tags)
        
        if not is_without_author:
            return False
            
    if tokens["themes"] & ctx.used_theme_tokens: return False
    
    # Term check (including correct options for task8)
    if tokens["terms"] & ctx.used_term_tokens: return False
    
    if _has_character_tag(question) and ctx.character_tag_count >= 1: return False
    return True

def _pick_best_from_pool(pool: List[Dict[str, Any]], key: str, ctx: SelectionContext) -> Dict[str, Any] | None:
    if not pool: return None
    filtered = [q for q in pool if _can_select_question(q, key, ctx)]
    if filtered:
        selected = _pick_random(filtered)
        ctx.add_question_tokens(selected, key)
        return selected
    
    # Fallback: pick one with minimum critical overlaps
    def score(q):
        tokens = _get_question_tokens(q, key)
        s = 0
        s += len(tokens["authors"] & ctx.used_author_tokens) * 100
        s += len(tokens["themes"] & ctx.used_theme_tokens) * 10
        s += len(tokens["terms"] & ctx.used_term_tokens) * 5
        return s
        
    scored = sorted(pool, key=score)
    selected = scored[0] # Pick the one with least overlap
    ctx.add_question_tokens(selected, key)
    return selected
