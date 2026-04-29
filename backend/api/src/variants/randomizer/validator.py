import re
from typing import Any

from .constants import (
    ALL_TASK_KEYS,
    BLOCK11_KEYS,
    SERVICE_TAGS,
    SERVICE_TAG_ALLOWED_KEYS,
    CHARACTER_TAG_ALLOWED_KEYS,
    NO_AUTHOR_TAGS,
    ROD_SINGLE_USE_IN_BLOCK11,
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
    _is_exclusive_question,
    _is_rod_tag,
    _tag_matches_kind,
)
from .tasks import _normalize_task2_comparable

def _check_missing_tasks(variant: dict[str, Any], errors: list[str]):
    for key in ALL_TASK_KEYS:
        if not variant.get(key):
            errors.append(f"Отсутствует обязательное задание {key}")

def _check_excerpt_and_work_match(variant: dict[str, Any], errors: list[str]):
    work_id = variant.get("work", {}).get("id") or variant.get("work", {}).get("workId")
    excerpt_work_id = variant.get("excerpt", {}).get("workId") or variant.get("excerpt", {}).get("work_id")

    if work_id and excerpt_work_id and work_id != excerpt_work_id:
        errors.append(f"Отрывок не относится к выбранному произведению: {excerpt_work_id} != {work_id}")

def _check_poem_and_poet_match(variant: dict[str, Any], errors: list[str]):
    poet_author = variant.get("poet", {}).get("authorId")
    poem_author = variant.get("poem", {}).get("authorId")

    if poet_author and poem_author and poet_author != poem_author:
        errors.append(f"Стихотворение не относится к выбранному поэту: {poem_author} != {poet_author}")

def _check_author_uniqueness(variant: dict[str, Any], used_authors: set[str], errors: list[str]):
    work_authors = _extract_author_tokens(variant.get("work"))
    poet_authors = _extract_author_tokens(variant.get("poet"))
    
    for a in work_authors:
        if a in used_authors: errors.append(f"Дубликат автора произведения: {a}")
        used_authors.add(a)
    for a in poet_authors:
        if a in used_authors: errors.append(f"Дубликат автора поэта: {a}")
        used_authors.add(a)

def _check_theme_uniqueness_and_conflict(variant: dict[str, Any], used_themes: set[str], errors: list[str]):
    excerpt_themes = _extract_theme_tokens(variant.get("excerpt"), "excerpt")
    poem_themes = _extract_theme_tokens(variant.get("poem"), "poem")
    
    if set(excerpt_themes) & set(poem_themes):
        errors.append(f"Конфликт тем: Отрывок ({excerpt_themes}) и Стихотворение ({poem_themes})")
        
    for t in excerpt_themes: used_themes.add(t)
    for t in poem_themes: used_themes.add(t)

def _check_tasks_constraints(variant: dict[str, Any], used_authors: set[str], used_themes: set[str], used_terms: set[str], errors: list[str]):
    character_tag_count = 0
    
    for key in ALL_TASK_KEYS:
        q = variant.get(key)
        if not q: continue
        
        q_authors = _extract_author_tokens(q)
        for a in q_authors:
            if a in used_authors: errors.append(f"Дубликат автора {a} в {key}")
            used_authors.add(a)
            
        q_themes = _extract_theme_tokens(q, key)
        for t in q_themes:
            if t in used_themes: errors.append(f"Дубликат темы {t} в {key}")
            used_themes.add(t)
            
        if key == "task8":
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
            
        s_tags = [t for t in _get_tags(q) if t in SERVICE_TAGS]
        if s_tags and key not in SERVICE_TAG_ALLOWED_KEYS:
            errors.append(f"Сервисные теги {s_tags} запрещены в {key}")
            
        if _has_character_tag(q):
            character_tag_count += 1
            if key not in CHARACTER_TAG_ALLOWED_KEYS:
                errors.append(f"Тег персонажа запрещен в {key}")

    if character_tag_count > 1:
        errors.append(f"Слишком много тегов персонажа в варианте: {character_tag_count}")

def _check_block11_rods(variant: dict[str, Any], rod_counts: dict[str, int], errors: list[str]):
    rods_in_b11 = []
    for key in BLOCK11_KEYS:
        q = variant.get(key)
        if not q or not isinstance(q, dict): continue
        
        q_rods = _extract_rod_tokens(q)
        if len(q_rods) != 1:
            errors.append(f"Задание {key} в Блоке 11 должно иметь ровно один rod-тег (найдено: {len(q_rods)})")
        rods_in_b11.extend(q_rods)
            
    rod_counts.update({r: rods_in_b11.count(r) for r in ["лирика", "пьеса", "поэма", "проза"]})
    
    if rod_counts.get("проза", 0) != 2:
        errors.append(f"В Блоке 11 должно быть ровно 2 задания прозы (найдено: {rod_counts.get('проза', 0)})")
        
    for r in ["лирика", "пьеса", "поэма"]:
        if rod_counts.get(r, 0) != 1:
            errors.append(f"В Блоке 11 должно быть ровно 1 задание {r} (найдено: {rod_counts.get(r, 0)})")

def _check_task1_integrity(variant: dict[str, Any], errors: list[str]):
    task1 = variant.get("task1")
    if not task1:
        errors.append("Отсутствует задание task1")
        return
        
    if not isinstance(task1, dict):
        errors.append("Задание task1 не является объектом")
        return
        
    t1_id = str(task1.get("id") or "").strip()
    if not t1_id:
        errors.append("Задание task1 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    ex_tasks = excerpt.get("tasks") or {}
    
    valid_ids = set()
    for q in (work.get("commonTasks") or {}).get("task1") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
    for q in ex_tasks.get("customTask1") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
            
    if t1_id and t1_id not in valid_ids:
        errors.append(f"Задание task1 ({t1_id}) взято не из допустимого пула (commonTasks.task1 или customTask1)")
        
    if task1.get("isTermQuestion"):
        if not str(task1.get("termId") or "").strip():
            errors.append(f"У задания task1 ({t1_id}) с флагом isTermQuestion отсутствует termId")
            
    if not str(task1.get("text") or "").strip():
        errors.append(f"У задания task1 ({t1_id}) отсутствует текст")
        
    if not str(task1.get("answer") or "").strip():
        errors.append(f"У задания task1 ({t1_id}) отсутствует ответ")

def _check_excerpt_block1_exclusions(variant: dict[str, Any], errors: list[str]):
    excerpt = variant.get("excerpt")
    if not excerpt: return

    task1 = variant.get("task1", {})
    task2 = variant.get("task2", {})
    task3 = variant.get("task3", {})

    ex_tasks = excerpt.get("tasks") or {}
    
    # Task 1
    exclude_t1_ids = [str(x) for x in (ex_tasks.get("excludeTask1Ids") or excerpt.get("excludeTask1Ids") or []) if x]
    exclude_t1_terms = [str(x) for x in (ex_tasks.get("excludeTask1TermIds") or excerpt.get("excludeTask1TermIds") or []) if x]
    
    t1_id = str(task1.get("id") or "")
    if t1_id and t1_id in exclude_t1_ids:
        errors.append(f"Задание task1 ({t1_id}) входит в список исключений excludeTask1Ids")
        
    t1_term = str(task1.get("termId") or "")
    if t1_term and t1_term in exclude_t1_terms:
        errors.append(f"Термин задания task1 ({t1_term}) входит в список исключений excludeTask1TermIds")

    # Task 2
    exclude_t2_ids = [str(x) for x in (ex_tasks.get("excludeTask2Ids") or excerpt.get("excludeTask2Ids") or []) if x]
    exclude_t2_terms = [str(x) for x in (ex_tasks.get("excludeTask2TermIds") or excerpt.get("excludeTask2TermIds") or []) if x]
    exclude_t2_chars = [_normalize_task2_comparable(x) for x in (ex_tasks.get("excludeTask2Characters") or excerpt.get("excludeTask2Characters") or []) if x]
    exclude_t2_props = [_normalize_task2_comparable(x) for x in (ex_tasks.get("excludeTask2Properties") or excerpt.get("excludeTask2Properties") or []) if x]

    t2_id = str(task2.get("id") or "")
    if t2_id and t2_id in exclude_t2_ids:
        errors.append(f"Задание task2 ({t2_id}) входит в список исключений excludeTask2Ids")
        
    t2_term = str(task2.get("termId") or "")
    if t2_term and t2_term in exclude_t2_terms:
        errors.append(f"Термин задания task2 ({t2_term}) входит в список исключений excludeTask2TermIds")

    pairs = task2.get("pairs", [])
    if isinstance(pairs, list):
        for pair in pairs:
            if not isinstance(pair, dict): continue
            char = _normalize_task2_comparable(pair.get("character") or "")
            if char and char in exclude_t2_chars:
                errors.append(f"Персонаж {pair.get('character')} из задания task2 входит в список исключений excludeTask2Characters")
            
            props = pair.get("properties") or []
            prop_ids = pair.get("propertyIds") or []
            if isinstance(props, list):
                for i, p in enumerate(props):
                    p_str = _normalize_task2_comparable(p)
                    if p_str and p_str in exclude_t2_props:
                        errors.append(f"Свойство {p} из задания task2 входит в список исключений excludeTask2Properties")
                    if isinstance(prop_ids, list) and i < len(prop_ids) and prop_ids[i]:
                        pid_str = _normalize_task2_comparable(prop_ids[i])
                        if pid_str and pid_str in exclude_t2_props:
                            errors.append(f"Свойство с ID {prop_ids[i]} из задания task2 входит в список исключений excludeTask2Properties")

    # Task 3
    exclude_t3_ids = [str(x) for x in (ex_tasks.get("excludeTask3Ids") or excerpt.get("excludeTask3Ids") or []) if x]
    exclude_t3_terms = [str(x) for x in (ex_tasks.get("excludeTask3TermIds") or excerpt.get("excludeTask3TermIds") or []) if x]

    t3_id = str(task3.get("id") or "")
    if t3_id and t3_id in exclude_t3_ids:
        errors.append(f"Задание task3 ({t3_id}) входит в список исключений excludeTask3Ids")
        
    t3_term1 = str(task3.get("termId1") or "")
    if t3_term1 and t3_term1 in exclude_t3_terms:
        errors.append(f"Термин termId1 ({t3_term1}) задания task3 входит в список исключений excludeTask3TermIds")
        
    t3_term2 = str(task3.get("termId2") or "")
    if t3_term2 and t3_term2 in exclude_t3_terms:
        errors.append(f"Термин termId2 ({t3_term2}) задания task3 входит в список исключений excludeTask3TermIds")


def _check_task_id_uniqueness(variant: dict[str, Any], errors: list[str]):
    seen_ids = {}
    for key in ALL_TASK_KEYS:
        q = variant.get(key)
        if not q or not isinstance(q, dict): continue
        
        q_id = q.get("id")
        if not q_id: continue
        
        q_id_str = str(q_id)
        if q_id_str in seen_ids:
            errors.append(f"Задание {q_id_str} используется в нескольких слотах: {seen_ids[q_id_str]} и {key}")
        else:
            seen_ids[q_id_str] = key


def _check_task3_task6_answer_lengths(variant: dict[str, Any], errors: list[str]):
    for key in ["task3", "task6"]:
        q = variant.get(key)
        if not q or not isinstance(q, dict): continue
        
        ans1 = str(q.get("answer1") or "")
        ans2 = str(q.get("answer2") or "")
        
        if len(ans1) > 17:
            errors.append(f"Ответ answer1 задания {key} превышает 17 символов (длина: {len(ans1)})")
        if len(ans2) > 17:
            errors.append(f"Ответ answer2 задания {key} превышает 17 символов (длина: {len(ans2)})")


def _check_without_author_rules(variant: dict[str, Any], errors: list[str]):
    for key in ALL_TASK_KEYS:
        q = variant.get(key)
        if not q or not isinstance(q, dict): continue
        
        tags = _get_tags(q)
        is_wa = any(t in NO_AUTHOR_TAGS for t in tags)
            
        if is_wa and key not in ["task3", "task6"]:
            errors.append(f"Теги без автора не допускаются в задании {key}")


def _check_task2_structure_integrity(variant: dict[str, Any], errors: list[str]):
    task2 = variant.get("task2")
    if not task2:
        errors.append("Отсутствует задание task2")
        return
        
    if not isinstance(task2, dict):
        errors.append("Задание task2 не является объектом")
        return
        
    t2_id = str(task2.get("id") or "").strip()
    if not t2_id:
        errors.append("Задание task2 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    ex_tasks = excerpt.get("tasks") or {}
    
    valid_ids = set()
    for q in (work.get("commonTasks") or {}).get("task2") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
    for q in ex_tasks.get("customTask2") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
            
    if t2_id and t2_id not in valid_ids:
        errors.append(f"Задание task2 ({t2_id}) взято не из допустимого пула (commonTasks.task2 или customTask2)")
        
    if not str(task2.get("prompt") or "").strip() and not str(task2.get("text") or "").strip():
        errors.append("В задании task2 отсутствует и prompt, и text")
        
    pairs = task2.get("pairs")
    if not isinstance(pairs, list):
        errors.append("В задании task2 отсутствует поле pairs или оно не список")
        return
        
    if len(pairs) != 3:
        errors.append(f"В задании task2 должно быть ровно 3 персонажа (найдено: {len(pairs)})")
        
    exclude_t2_chars = [_normalize_task2_comparable(x) for x in (ex_tasks.get("excludeTask2Characters") or excerpt.get("excludeTask2Characters") or []) if x]
    exclude_t2_props = [_normalize_task2_comparable(x) for x in (ex_tasks.get("excludeTask2Properties") or excerpt.get("excludeTask2Properties") or []) if x]

    seen_chars = set()
    pair_tags = []
    correct_props = []
    
    for i, pair in enumerate(pairs):
        if not isinstance(pair, dict):
            errors.append(f"В задании task2 элемент pairs[{i}] не словарь")
            continue
            
        if not str(pair.get("id") or "").strip():
            errors.append(f"В задании task2 у пары {i+1} отсутствует id")
            
        char = str(pair.get("character") or "").strip()
        if not char:
            errors.append(f"В задании task2 у пары {i+1} отсутствует персонаж")
        else:
            if char in seen_chars:
                errors.append(f"В задании task2 дублируется персонаж {char}")
            seen_chars.add(char)
            
            char_norm = _normalize_task2_comparable(char)
            if char_norm in exclude_t2_chars:
                errors.append(f"Персонаж {char} из задания task2 входит в список исключений excludeTask2Characters")
                
        props = pair.get("properties")
        chars_list = pair.get("characteristics")
        phrases = pair.get("phrases")
        
        prop_value = ""
        if isinstance(props, list) and props and str(props[0]).strip():
            prop_value = str(props[0]).strip()
        elif isinstance(chars_list, list) and chars_list and str(chars_list[0]).strip():
            prop_value = str(chars_list[0]).strip()
        elif isinstance(phrases, list) and phrases and str(phrases[0]).strip():
            prop_value = str(phrases[0]).strip()
            
        if not prop_value:
            errors.append(f"В задании task2 у пары {i+1} отсутствуют свойства")
        else:
            correct_props.append(prop_value)
            prop_norm = _normalize_task2_comparable(prop_value)
            if prop_norm in exclude_t2_props:
                errors.append(f"Свойство {prop_value} из задания task2 входит в список исключений excludeTask2Properties")
                
        tag = str(pair.get("tag") or "").strip().lower()
        if tag:
            pair_tags.append(tag)

    if len(correct_props) != len(set(correct_props)):
        errors.append("В задании task2 выбранные свойства пар пересекаются")
        
    if len(pair_tags) != len(set(pair_tags)):
        errors.append("В задании task2 повторяются теги пар")
        
    extra = str(task2.get("extraOption") or "").strip()
    all_options = []
    if "shuffledRightOptions" in task2 and isinstance(task2["shuffledRightOptions"], list):
        all_options = [str(o).strip() for o in task2["shuffledRightOptions"] if str(o).strip()]
    else:
        all_options = list(correct_props)
        if extra:
            all_options.append(extra)
            
    if len(all_options) != 4:
        errors.append(f"В задании task2 должно быть ровно 4 уникальных свойства справа (найдено: {len(all_options)})")
        
    missing_correct = [p for p in correct_props if p not in all_options]
    if missing_correct:
        errors.append(f"В правых вариантах задания task2 отсутствуют правильные свойства: {missing_correct}")
        
    if extra:
        extra_norm = _normalize_task2_comparable(extra)
        if extra_norm in exclude_t2_props:
            errors.append(f"Лишнее свойство {extra} из задания task2 входит в список исключений excludeTask2Properties")
            
        if extra in correct_props:
            errors.append(f"Лишнее свойство {extra} дублирует правильные свойства")
            
    char_count = task2.get("characterCount")
    if char_count is not None and int(char_count) != 3:
        errors.append(f"characterCount в задании task2 равен {char_count}, ожидалось 3")
        
    if "leftLabel" in task2 and not str(task2.get("leftLabel") or "").strip():
        errors.append("leftLabel в задании task2 пустое")
        
    if "rightLabel" in task2 and not str(task2.get("rightLabel") or "").strip():
        errors.append("rightLabel в задании task2 пустое")
        
    ppt = task2.get("pairPropertyType")
    if ppt and ppt not in ("properties", "characteristics", "phrases"):
        errors.append(f"Недопустимое значение pairPropertyType в task2: {ppt}")
        
    cs = task2.get("characterSource")
    if cs and cs not in ("quotes", "facts", "mixed"):
        errors.append(f"Недопустимое значение characterSource в task2: {cs}")


def _check_task3_integrity(variant: dict[str, Any], errors: list[str]):
    task3 = variant.get("task3")
    if not task3:
        errors.append("Отсутствует задание task3")
        return
        
    if not isinstance(task3, dict):
        errors.append("Задание task3 не является объектом")
        return
        
    t3_id = str(task3.get("id") or "").strip()
    if not t3_id:
        errors.append("Задание task3 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    ex_tasks = excerpt.get("tasks") or {}
    
    valid_ids = set()
    for q in (work.get("commonTasks") or {}).get("task3") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
    for q in ex_tasks.get("customTask3") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
            
    is_valid = False
    if t3_id in valid_ids:
        is_valid = True
    elif t3_id.startswith("task3-"):
        for id1 in valid_ids:
            for id2 in valid_ids:
                if t3_id == f"task3-{id1}-{id2}":
                    is_valid = True
                    break
            if is_valid:
                break
            
    if not is_valid and t3_id:
        errors.append(f"Задание task3 ({t3_id}) взято не из допустимого пула (commonTasks.task3 или customTask3)")
        
    excluded_task_ids = {str(x).strip() for x in ex_tasks.get("excludeTask3Ids", [])}
    if t3_id and t3_id in excluded_task_ids:
        errors.append(f"Задание task3 ({t3_id}) исключено для выбранного отрывка")
        
    part1 = str(task3.get("part1") or "").strip()
    part2 = str(task3.get("part2") or "").strip()
    if not part1:
        errors.append("В задании task3 отсутствует или пустое поле part1")
    if not part2:
        errors.append("В задании task3 отсутствует или пустое поле part2")
        
    if part1 and part2 and part1 == part2:
        errors.append("В задании task3 поля part1 и part2 совпадают")
        
    answer1 = str(task3.get("answer1") or "").strip()
    answer2 = str(task3.get("answer2") or "").strip()
    if not answer1:
        errors.append("В задании task3 отсутствует или пустое поле answer1")
    if not answer2:
        errors.append("В задании task3 отсутствует или пустое поле answer2")
        
    # Считаем длину ответа без пробелов по договорённости с заказчиком
    if len(re.sub(r"\s+", "", answer1)) > 17:
        errors.append(f"Длина ответа answer1 в task3 превышает 17 символов: {answer1}")
    if len(re.sub(r"\s+", "", answer2)) > 17:
        errors.append(f"Длина ответа answer2 в task3 превышает 17 символов: {answer2}")
        
    termId1 = str(task3.get("termId1") or "").strip()
    termId2 = str(task3.get("termId2") or "").strip()
    if not termId1:
        errors.append("В задании task3 отсутствует termId1")
    if not termId2:
        errors.append("В задании task3 отсутствует termId2")
        
    if termId1 and termId2 and termId1 == termId2:
        errors.append(f"В задании task3 совпадают termId1 и termId2: {termId1}")
        
    excluded_term_ids = {str(x).strip() for x in ex_tasks.get("excludeTask3TermIds", [])}
    if termId1 and termId1 in excluded_term_ids:
        errors.append(f"termId1 {termId1} в task3 исключён для выбранного отрывка")
    if termId2 and termId2 in excluded_term_ids:
        errors.append(f"termId2 {termId2} в task3 исключён для выбранного отрывка")
        
    wa = task3.get("withoutAuthor") is True
    tags = _get_tags(task3)
    has_wa_tag = any(t in NO_AUTHOR_TAGS for t in tags)
    
    if wa:
        if not part1 or not part2:
            errors.append("Флаг withoutAuthor в task3 разрешен только для составных заданий из двух частей")
        if not _extract_author_tokens(task3):
            errors.append("В task3 стоит withoutAuthor, но нет явной author-привязки")
            
    if has_wa_tag and not wa:
        errors.append("В task3 есть тег 'без автора', но флаг withoutAuthor не равен true")
    if not has_wa_tag and wa:
        errors.append("В task3 стоит флаг withoutAuthor, но тег 'без автора' отсутствует")
        
    if _has_character_tag(task3):
        errors.append("Задание task3 содержит запрещенный тег персонажа")
        
    if task3.get("isActive") is False:
        errors.append("В задании task3 флаг isActive равен false")

def _check_task4_integrity(variant: dict[str, Any], errors: list[str]):
    task4_1 = variant.get("task4_1")
    task4_2 = variant.get("task4_2")
    
    if not task4_1:
        errors.append("Отсутствует задание task4_1")
    elif not isinstance(task4_1, dict):
        errors.append("Задание task4_1 не является объектом")
    else:
        t4_1_id = str(task4_1.get("id") or "").strip()
        if not t4_1_id:
            errors.append("Задание task4_1 не содержит id")
            
    if not task4_2:
        errors.append("Отсутствует задание task4_2")
    elif not isinstance(task4_2, dict):
        errors.append("Задание task4_2 не является объектом")
    else:
        t4_2_id = str(task4_2.get("id") or "").strip()
        if not t4_2_id:
            errors.append("Задание task4_2 не содержит id")
            
    if task4_1 and task4_2 and isinstance(task4_1, dict) and isinstance(task4_2, dict):
        id1 = str(task4_1.get("id") or "").strip()
        id2 = str(task4_2.get("id") or "").strip()
        if id1 and id2 and id1 == id2:
            errors.append("Задания task4_1 и task4_2 имеют одинаковый id")
            
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    ex_tasks = excerpt.get("tasks") or {}
    
    if task4_1 and isinstance(task4_1, dict):
        t4_1_id = str(task4_1.get("id") or "").strip()
        if t4_1_id:
            valid_4_1_ids = {str(q.get("id")).strip() for q in ex_tasks.get("task4_1", []) if isinstance(q, dict) and q.get("id")}
            if t4_1_id not in valid_4_1_ids:
                errors.append(f"Задание task4_1 ({t4_1_id}) взято не из допустимого пула (excerpt.tasks.task4_1)")
                
            common_4_1_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task4_1", []) if isinstance(q, dict) and q.get("id")}
            if t4_1_id in common_4_1_ids:
                errors.append(f"Задание task4_1 ({t4_1_id}) взято из work.commonTasks")
                
        t4_1_text = str(task4_1.get("text") or "").strip()
        if not t4_1_text:
            errors.append("В задании task4_1 отсутствует или пустой текст")
            
        if task4_1.get("isActive") is False:
            errors.append("В задании task4_1 флаг isActive равен false")
            
        if "tags" in task4_1 and not isinstance(task4_1.get("tags"), (list, str)):
            errors.append("Поле tags в задании task4_1 не является строкой или списком")

    if task4_2 and isinstance(task4_2, dict):
        t4_2_id = str(task4_2.get("id") or "").strip()
        if t4_2_id:
            valid_4_2_ids = {str(q.get("id")).strip() for q in ex_tasks.get("task4_2", []) if isinstance(q, dict) and q.get("id")}
            if t4_2_id not in valid_4_2_ids:
                errors.append(f"Задание task4_2 ({t4_2_id}) взято не из допустимого пула (excerpt.tasks.task4_2)")
                
            common_4_2_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task4_2", []) if isinstance(q, dict) and q.get("id")}
            if t4_2_id in common_4_2_ids:
                errors.append(f"Задание task4_2 ({t4_2_id}) взято из work.commonTasks")
                
        t4_2_text = str(task4_2.get("text") or "").strip()
        if not t4_2_text:
            errors.append("В задании task4_2 отсутствует или пустой текст")
            
        if task4_2.get("isActive") is False:
            errors.append("В задании task4_2 флаг isActive равен false")
            
        if "tags" in task4_2 and not isinstance(task4_2.get("tags"), (list, str)):
            errors.append("Поле tags в задании task4_2 не является строкой или списком")
            
    if task4_1 and task4_2 and isinstance(task4_1, dict) and isinstance(task4_2, dict):
        t4_1_text = str(task4_1.get("text") or "").strip()
        t4_2_text = str(task4_2.get("text") or "").strip()
        if t4_1_text and t4_2_text and t4_1_text == t4_2_text:
            errors.append("Текст заданий task4_1 и task4_2 совпадает")

def _check_task5_integrity(variant: dict[str, Any], errors: list[str]):
    task5 = variant.get("task5")
    if not task5:
        errors.append("Отсутствует задание task5")
        return
        
    if not isinstance(task5, dict):
        errors.append("Задание task5 не является объектом")
        return
        
    t5_id = str(task5.get("id") or "").strip()
    if not t5_id:
        errors.append("Задание task5 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    ex_tasks = excerpt.get("tasks") or {}
    
    if t5_id:
        valid_ids = {str(q.get("id")).strip() for q in ex_tasks.get("task5", []) if isinstance(q, dict) and q.get("id")}
        if t5_id not in valid_ids:
            errors.append(f"Задание task5 ({t5_id}) взято не из допустимого пула (excerpt.tasks.task5)")
            
        common_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task5", []) if isinstance(q, dict) and q.get("id")}
        if t5_id in common_ids:
            errors.append(f"Задание task5 ({t5_id}) взято из work.commonTasks")
            
    t5_text = str(task5.get("text") or "").strip()
    if not t5_text:
        errors.append("В задании task5 отсутствует или пустой текст")
        
    if task5.get("isActive") is False:
        errors.append("В задании task5 флаг isActive равен false")
        
    if "tags" in task5 and not isinstance(task5.get("tags"), (list, str)):
        errors.append("Поле tags в задании task5 не является строкой или списком")

def _check_task6_integrity(variant: dict[str, Any], errors: list[str]):
    task6 = variant.get("task6")
    if not task6:
        errors.append("Отсутствует задание task6")
        return
        
    if not isinstance(task6, dict):
        errors.append("Задание task6 не является объектом")
        return
        
    t6_id = str(task6.get("id") or "").strip()
    if not t6_id:
        errors.append("Задание task6 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    poem = variant.get("poem") or {}
    poem_tasks = poem.get("tasks") or {}
    
    valid_ids = set()
    for q in poem_tasks.get("task6") or []:
        if isinstance(q, dict) and q.get("id"):
            valid_ids.add(str(q["id"]).strip())
            
    is_valid = False
    if t6_id in valid_ids:
        is_valid = True
    elif t6_id.startswith("task6-"):
        for id1 in valid_ids:
            for id2 in valid_ids:
                if t6_id == f"task6-{id1}-{id2}":
                    is_valid = True
                    break
            if is_valid: break
            
    if not is_valid and t6_id:
        errors.append(f"Задание task6 ({t6_id}) взято не из допустимого пула (poem.tasks.task6)")
        
    common_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task6", []) if isinstance(q, dict) and q.get("id")}
    if t6_id in common_ids:
        errors.append("Задание task6 взято из work.commonTasks")
        
    excerpt_ids = {str(q.get("id")).strip() for q in excerpt.get("tasks", {}).get("task6", []) if isinstance(q, dict) and q.get("id")}
    if t6_id in excerpt_ids:
        errors.append("Задание task6 взято из excerpt.tasks")
        
    part1 = str(task6.get("part1") or "").strip()
    part2 = str(task6.get("part2") or "").strip()
    if not part1:
        errors.append("В задании task6 отсутствует или пустое поле part1")
    if not part2:
        errors.append("В задании task6 отсутствует или пустое поле part2")
    if part1 and part2 and part1 == part2:
        errors.append("В задании task6 поля part1 и part2 совпадают")
        
    answer1 = str(task6.get("answer1") or "").strip()
    answer2 = str(task6.get("answer2") or "").strip()
    if not answer1:
        errors.append("В задании task6 отсутствует или пустое поле answer1")
    if not answer2:
        errors.append("В задании task6 отсутствует или пустое поле answer2")
        
    if len(re.sub(r"\s+", "", answer1)) > 17:
        errors.append(f"Длина ответа answer1 в task6 превышает 17 символов: {answer1}")
    if len(re.sub(r"\s+", "", answer2)) > 17:
        errors.append(f"Длина ответа answer2 в task6 превышает 17 символов: {answer2}")
        
    termId1 = str(task6.get("termId1") or "").strip()
    termId2 = str(task6.get("termId2") or "").strip()
    if not termId1:
        errors.append("В задании task6 отсутствует или пустой termId1")
    if not termId2:
        errors.append("В задании task6 отсутствует или пустой termId2")
    if termId1 and termId2 and termId1 == termId2:
        errors.append(f"В задании task6 совпадают termId1 и termId2: {termId1}")
        
    if task6.get("isActive") is False:
        errors.append("В задании task6 флаг isActive равен false")
        
    if "tags" in task6 and not isinstance(task6.get("tags"), (list, str)):
        errors.append("Поле tags в задании task6 не является строкой или списком")
        
    wa = task6.get("withoutAuthor") is True
    tags = _get_tags(task6)
    has_wa_tag = any(t in NO_AUTHOR_TAGS for t in tags)
    
    if wa:
        if not part1 or not part2:
            errors.append("Флаг withoutAuthor в task6 разрешен только для составных заданий из двух частей")
        if not _extract_author_tokens(task6):
            errors.append("В task6 стоит withoutAuthor, но нет явной author-привязки")
            
    if has_wa_tag and not wa:
        errors.append("В task6 есть тег 'без автора', но флаг withoutAuthor не равен true")
    if not has_wa_tag and wa:
        errors.append("В task6 стоит флаг withoutAuthor, но тег 'без автора' отсутствует")

def _check_task7_integrity(variant: dict[str, Any], errors: list[str]):
    task7 = variant.get("task7")
    if not task7:
        errors.append("Отсутствует задание task7")
        return
        
    if not isinstance(task7, dict):
        errors.append("Задание task7 не является объектом")
        return
        
    t7_id = str(task7.get("id") or "").strip()
    if not t7_id:
        errors.append("Задание task7 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    poem = variant.get("poem") or {}
    poem_tasks = poem.get("tasks") or {}
    
    valid_ids = {str(q.get("id")).strip() for q in poem_tasks.get("task7", []) if isinstance(q, dict) and q.get("id")}
    if t7_id and t7_id not in valid_ids:
        errors.append(f"Задание task7 ({t7_id}) взято не из допустимого пула (poem.tasks.task7)")
        
    common_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task7", []) if isinstance(q, dict) and q.get("id")}
    if t7_id in common_ids:
        errors.append("Задание task7 взято из work.commonTasks")
        
    excerpt_ids = {str(q.get("id")).strip() for q in excerpt.get("tasks", {}).get("task7", []) if isinstance(q, dict) and q.get("id")}
    if t7_id in excerpt_ids:
        errors.append("Задание task7 взято из excerpt.tasks")
        
    t7_text = str(task7.get("text") or "").strip()
    if not t7_text:
        errors.append("В задании task7 отсутствует или пустой текст")
        
    t7_ans = str(task7.get("answer") or "").strip()
    if not t7_ans:
        errors.append("В задании task7 отсутствует или пустой answer")
        
    if task7.get("isActive") is False:
        errors.append("В задании task7 флаг isActive равен false")
        
    if "tags" in task7 and not isinstance(task7.get("tags"), (list, str)):
        errors.append("Поле tags в задании task7 не является строкой или списком")
        
    if task7.get("isTermQuestion") is True and not str(task7.get("termId") or "").strip():
        errors.append("В задании task7 флаг isTermQuestion равен true, но отсутствует или пустой termId")
        
    if _has_character_tag(task7):
        errors.append("В задании task7 запрещен тег персонажа")
        
    rods = _extract_rod_tokens(task7)
    if rods:
        errors.append(f"В задании task7 запрещены rod-теги: {rods}")
        
    tags = _get_tags(task7)
    if any(t == "исключительный вопрос" for t in tags):
        errors.append("В задании task7 запрещен service-тег 'исключительный вопрос'")

def _check_task8_structure_integrity(variant: dict[str, Any], errors: list[str]):
    task8 = variant.get("task8")
    task8Options = variant.get("task8Options")
    
    if not task8:
        errors.append("Отсутствует задание task8")
        return
        
    if not isinstance(task8, dict):
        errors.append("Задание task8 не является объектом")
        return
        
    t8_id = str(task8.get("id") or "").strip()
    if not t8_id:
        errors.append("Задание task8 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    poem = variant.get("poem") or {}
    poem_tasks = poem.get("tasks") or {}
    
    if t8_id:
        valid_ids = {str(q.get("id")).strip() for q in poem_tasks.get("task8", []) if isinstance(q, dict) and q.get("id")}
        if t8_id not in valid_ids:
            errors.append(f"Задание task8 ({t8_id}) взято не из допустимого пула (poem.tasks.task8)")
            
        common_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task8", []) if isinstance(q, dict) and q.get("id")}
        if t8_id in common_ids:
            errors.append("Задание task8 взято из work.commonTasks")
            
        excerpt_ids = {str(q.get("id")).strip() for q in excerpt.get("tasks", {}).get("task8", []) if isinstance(q, dict) and q.get("id")}
        if t8_id in excerpt_ids:
            errors.append("Задание task8 взято из excerpt.tasks")
            
    t8_txt = str(task8.get("prompt") or task8.get("text") or "").strip()
    if not t8_txt:
        errors.append("В задании task8 отсутствует или пустое поле prompt/text")
        
    if task8.get("isActive") is False:
        errors.append("В задании task8 флаг isActive равен false")
        
    if "tags" in task8 and not isinstance(task8.get("tags"), (list, str)):
        errors.append("Поле tags в задании task8 не является строкой или списком")
        
    if _has_character_tag(task8):
        errors.append("В задании task8 запрещен тег персонажа")
        
    rods = _extract_rod_tokens(task8)
    if rods:
        errors.append(f"В задании task8 запрещены rod-теги: {rods}")
        
    tags = _get_tags(task8)
    if any(t == "исключительный вопрос" for t in tags):
        errors.append("В задании task8 запрещен service-тег 'исключительный вопрос'")
        
    opts = None
    if isinstance(task8Options, list):
        opts = task8Options
    elif isinstance(task8.get("options"), list):
        opts = task8["options"]
        
    if opts is None:
        errors.append("В задании task8 отсутствуют варианты ответа (options или task8Options)")
        return
        
    if not isinstance(opts, list):
        errors.append("Список вариантов ответа task8 не является списком")
        return
        
    if len(opts) != 7:
        errors.append(f"В вариантах ответа task8 должно быть ровно 7 элементов (найдено: {len(opts)})")
        
    correct_count = 0
    false_count = 0
    option_ids = []
    
    for i, o in enumerate(opts):
        if not isinstance(o, dict):
            errors.append(f"Элемент {i+1} в списке вариантов ответа task8 не является объектом")
            continue
            
        oid = str(o.get("id") or "").strip()
        if not oid:
            errors.append(f"В варианте ответа {i+1} в task8 отсутствует id")
        else:
            option_ids.append(oid)
            
        txt = str(o.get("term") or o.get("text") or "").strip()
        if not txt:
            errors.append(f"В варианте ответа {i+1} в task8 отсутствует term/text")
            
        if "isCorrect" not in o:
            errors.append(f"В варианте ответа {i+1} в task8 отсутствует поле isCorrect")
        else:
            if not isinstance(o["isCorrect"], bool):
                errors.append(f"Поле isCorrect в варианте ответа {i+1} в task8 не является boolean")
            elif o["isCorrect"]:
                correct_count += 1
            else:
                false_count += 1
                
        if "termId" in o and str(o.get("termId")) == "":
            errors.append(f"В варианте ответа {i+1} в task8 поле termId является пустой строкой")
            
    if len(option_ids) != len(set(option_ids)):
        errors.append("ID вариантов ответа в task8 повторяются")
        
    if correct_count < 2 or correct_count > 6:
        errors.append(f"В вариантах ответа task8 должно быть от 2 до 6 правильных ответов (найдено: {correct_count})")
        
    if false_count < 1 or false_count > 5:
        errors.append(f"В вариантах ответа task8 должно быть от 1 до 5 неправильных ответов (найдено: {false_count})")
        
    if isinstance(task8Options, list) and isinstance(task8.get("options"), list):
        t8_opts = task8["options"]
        id_set_opts = {str(o.get("id")).strip() for o in t8_opts if isinstance(o, dict) and o.get("id")}
        id_set_t8opts = {str(o.get("id")).strip() for o in task8Options if isinstance(o, dict) and o.get("id")}
        if id_set_opts != id_set_t8opts:
            errors.append("Наборы ID в task8.options и task8Options не совпадают")
        else:
            opts_map = {str(o.get("id")).strip(): o.get("isCorrect") for o in t8_opts if isinstance(o, dict) and o.get("id")}
            for o in task8Options:
                if not isinstance(o, dict): continue
                oid = str(o.get("id")).strip()
                if oid in opts_map and opts_map[oid] != o.get("isCorrect"):
                    errors.append(f"Несовпадение isCorrect для варианта {oid} в task8.options и task8Options")


def _check_task9_integrity(variant: dict[str, Any], errors: list[str]):
    task9_1 = variant.get("task9_1")
    task9_2 = variant.get("task9_2")
    
    if not task9_1:
        errors.append("Отсутствует задание task9_1")
    if not task9_2:
        errors.append("Отсутствует задание task9_2")
        
    if task9_1 and not isinstance(task9_1, dict):
        errors.append("Задание task9_1 не является объектом")
    if task9_2 and not isinstance(task9_2, dict):
        errors.append("Задание task9_2 не является объектом")
        
    t9_1_id = ""
    t9_2_id = ""
    if isinstance(task9_1, dict):
        t9_1_id = str(task9_1.get("id") or "").strip()
        if not t9_1_id:
            errors.append("Задание task9_1 не содержит id")
            
    if isinstance(task9_2, dict):
        t9_2_id = str(task9_2.get("id") or "").strip()
        if not t9_2_id:
            errors.append("Задание task9_2 не содержит id")
            
    if t9_1_id and t9_2_id and t9_1_id == t9_2_id:
        errors.append("Идентификаторы task9_1 и task9_2 совпадают")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    poem = variant.get("poem") or {}
    poem_tasks = poem.get("tasks") or {}
    
    if t9_1_id:
        valid_ids = {str(q.get("id")).strip() for q in poem_tasks.get("task9_1", []) if isinstance(q, dict) and q.get("id")}
        if t9_1_id not in valid_ids:
            errors.append(f"Задание task9_1 ({t9_1_id}) взято не из допустимого пула (poem.tasks.task9_1)")
            
        common_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task9_1", []) if isinstance(q, dict) and q.get("id")}
        if t9_1_id in common_ids:
            errors.append("Задание task9_1 взято из work.commonTasks")
            
        excerpt_ids = {str(q.get("id")).strip() for q in excerpt.get("tasks", {}).get("task9_1", []) if isinstance(q, dict) and q.get("id")}
        if t9_1_id in excerpt_ids:
            errors.append("Задание task9_1 взято из excerpt.tasks")
            
    if t9_2_id:
        valid_ids2 = {str(q.get("id")).strip() for q in poem_tasks.get("task9_2", []) if isinstance(q, dict) and q.get("id")}
        if t9_2_id not in valid_ids2:
            errors.append(f"Задание task9_2 ({t9_2_id}) взято не из допустимого пула (poem.tasks.task9_2)")
            
        common_ids2 = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task9_2", []) if isinstance(q, dict) and q.get("id")}
        if t9_2_id in common_ids2:
            errors.append("Задание task9_2 взято из work.commonTasks")
            
        excerpt_ids2 = {str(q.get("id")).strip() for q in excerpt.get("tasks", {}).get("task9_2", []) if isinstance(q, dict) and q.get("id")}
        if t9_2_id in excerpt_ids2:
            errors.append("Задание task9_2 взято из excerpt.tasks")
            
    t9_1_txt = ""
    t9_2_txt = ""
    if isinstance(task9_1, dict):
        t9_1_txt = str(task9_1.get("text") or task9_1.get("prompt") or "").strip()
        if not t9_1_txt:
            errors.append("В задании task9_1 отсутствует или пустое поле text")
            
    if isinstance(task9_2, dict):
        t9_2_txt = str(task9_2.get("text") or task9_2.get("prompt") or "").strip()
        if not t9_2_txt:
            errors.append("В задании task9_2 отсутствует или пустое поле text")
            
    if t9_1_txt and t9_2_txt and t9_1_txt == t9_2_txt:
        errors.append("Поле text у заданий task9_1 и task9_2 совпадает")
        
    if isinstance(task9_1, dict):
        if task9_1.get("isActive") is False:
            errors.append("В задании task9_1 флаг isActive равен false")
        if "tags" in task9_1 and not isinstance(task9_1.get("tags"), (list, str)):
            errors.append("Поле tags в задании task9_1 не является строкой или списком")
            
        if _has_character_tag(task9_1):
            errors.append("В задании task9_1 запрещен тег персонажа")
        if _extract_rod_tokens(task9_1):
            errors.append(f"В задании task9_1 запрещены rod-теги")
        if any(t == "исключительный вопрос" for t in _get_tags(task9_1)):
            errors.append("В задании task9_1 запрещен service-тег 'исключительный вопрос'")
            
    if isinstance(task9_2, dict):
        if task9_2.get("isActive") is False:
            errors.append("В задании task9_2 флаг isActive равен false")
        if "tags" in task9_2 and not isinstance(task9_2.get("tags"), (list, str)):
            errors.append("Поле tags в задании task9_2 не является строкой или списком")
            
        if _has_character_tag(task9_2):
            errors.append("В задании task9_2 запрещен тег персонажа")
        if _extract_rod_tokens(task9_2):
            errors.append(f"В задании task9_2 запрещены rod-теги")
        if any(t == "исключительный вопрос" for t in _get_tags(task9_2)):
            errors.append("В задании task9_2 запрещен service-тег 'исключительный вопрос'")


def _check_task10_integrity(variant: dict[str, Any], errors: list[str]):
    task10 = variant.get("task10")
    
    if not task10:
        errors.append("Отсутствует задание task10")
        return
        
    if not isinstance(task10, dict):
        errors.append("Задание task10 не является объектом")
        return
        
    t10_id = str(task10.get("id") or "").strip()
    if not t10_id:
        errors.append("Задание task10 не содержит id")
        
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    poem = variant.get("poem") or {}
    poem_tasks = poem.get("tasks") or {}
    
    if t10_id:
        valid_ids = {str(q.get("id")).strip() for q in poem_tasks.get("task10", []) if isinstance(q, dict) and q.get("id")}
        if t10_id not in valid_ids:
            errors.append(f"Задание task10 ({t10_id}) взято не из допустимого пула (poem.tasks.task10)")
            
        common_ids = {str(q.get("id")).strip() for q in work.get("commonTasks", {}).get("task10", []) if isinstance(q, dict) and q.get("id")}
        if t10_id in common_ids:
            errors.append("Задание task10 взято из work.commonTasks")
            
        excerpt_ids = {str(q.get("id")).strip() for q in excerpt.get("tasks", {}).get("task10", []) if isinstance(q, dict) and q.get("id")}
        if t10_id in excerpt_ids:
            errors.append("Задание task10 взято из excerpt.tasks")
            
    t10_txt = str(task10.get("text") or task10.get("prompt") or "").strip()
    if not t10_txt:
        errors.append("В задании task10 отсутствует или пустое поле text")
        
    if task10.get("isActive") is False:
        errors.append("В задании task10 флаг isActive равен false")
        
    if "tags" in task10 and not isinstance(task10.get("tags"), (list, str)):
        errors.append("Поле tags в задании task10 не является строкой или списком")
        
    if _has_character_tag(task10):
        errors.append("В задании task10 запрещен тег персонажа")
        
    if _extract_rod_tokens(task10):
        errors.append("В задании task10 запрещены rod-теги")
        
    if any(t == "исключительный вопрос" for t in _get_tags(task10)):
        errors.append("В задании task10 запрещен service-тег 'исключительный вопрос'")


def _check_exclusive_question_in_block11(variant: dict[str, Any], errors: list[str]):
    exclusive_count = 0
    for key in BLOCK11_KEYS:
        q = variant.get(key)
        if q and isinstance(q, dict) and _is_exclusive_question(q):
            exclusive_count += 1
            
    if exclusive_count != 1:
        errors.append(f"В Блоке 11 должен быть ровно один исключительный вопрос (найдено: {exclusive_count})")


def _check_internal_duplicates(variant: dict[str, Any], errors: list[str]):
    for key in ALL_TASK_KEYS:
        q = variant.get(key)
        if not q or not isinstance(q, dict): continue
        
        # 1. Check raw Author IDs
        raw_author_ids = []
        if "authorId" in q:
            a = str(q["authorId"]).strip()
            if a: raw_author_ids.append(a.lower())
        if "authorIds" in q:
            a_ids = q["authorIds"]
            if isinstance(a_ids, list):
                for a in a_ids:
                    a_str = str(a).strip()
                    if a_str: raw_author_ids.append(a_str.lower())
            elif isinstance(a_ids, str):
                for a in a_ids.split(","):
                    a_str = a.strip()
                    if a_str: raw_author_ids.append(a_str.lower())
                    
        if len(raw_author_ids) != len(set(raw_author_ids)):
            errors.append(f"Дубликат authorId внутри задания {key}")
            
        # 2. Check raw Theme IDs
        raw_theme_ids = []
        for f in ("theme1Id", "theme2Id", "themeInternalId"):
            if f in q:
                t = str(q[f]).strip()
                if t: raw_theme_ids.append(t.lower())
        if len(raw_theme_ids) != len(set(raw_theme_ids)):
            errors.append(f"Дубликат themeId внутри задания {key}")
            if key == "task10":
                print(f"\n[DEBUG TASK10] Duplicate themeIds found: {raw_theme_ids} in {q}")
            
        # 3. Check raw Term IDs
        if key not in ["task3", "task6"]:
            raw_term_ids = []
            for f in ("termId", "termId1", "termId2", "term", "term1", "term2"):
                if f in q:
                    t = str(q[f]).strip()
                    if t: raw_term_ids.append(t.lower())
            if len(raw_term_ids) != len(set(raw_term_ids)):
                errors.append(f"Дубликат termId внутри задания {key}")


def _check_block11_integrity(variant: dict[str, Any], kb_payload: dict[str, Any] | None, errors: list[str]):
    work = variant.get("work") or {}
    excerpt = variant.get("excerpt") or {}
    poem = variant.get("poem") or {}
    poem_tasks = poem.get("tasks") or {}
    
    block3 = kb_payload.get("block3") or {} if kb_payload else {}
    b11_keys = ["task11_1", "task11_2", "task11_3", "task11_4", "task11_5"]
    
    for key in b11_keys:
        q = variant.get(key)
        if not q:
            continue
            
        if not isinstance(q, dict):
            continue
            
        q_id = str(q.get("id") or "").strip()
        if not q_id:
            errors.append(f"Задание {key} не содержит id")
        else:
            
            if kb_payload:
                valid_pools = []
                if key == "task11_1":
                    valid_pools = block3.get("task11_1") or []
                elif key == "task11_2":
                    valid_pools = (block3.get("task11_2") or []) + (block3.get("task11_2_3") or [])
                elif key == "task11_3":
                    valid_pools = (block3.get("task11_3") or []) + (block3.get("task11_2_3") or [])
                elif key == "task11_4":
                    valid_pools = block3.get("task11_4") or []
                elif key == "task11_5":
                    valid_pools = block3.get("task11_5") or []
                    
                valid_ids = {str(item.get("id")).strip() for item in valid_pools if isinstance(item, dict) and item.get("id")}
                if q_id not in valid_ids:
                    errors.append(f"Задание {key} ({q_id}) взято не из допустимого пула block3")
                    
            c_ids = {str(item.get("id")).strip() for item in work.get("commonTasks", {}).get(key, []) if isinstance(item, dict) and item.get("id")}
            if q_id in c_ids:
                errors.append(f"Задание {key} взято из work.commonTasks")
                
            ex_ids = {str(item.get("id")).strip() for item in excerpt.get("tasks", {}).get(key, []) if isinstance(item, dict) and item.get("id")}
            if q_id in ex_ids:
                errors.append(f"Задание {key} взято из excerpt.tasks")
                
            poem_ids = {str(item.get("id")).strip() for item in poem_tasks.get(key, []) if isinstance(item, dict) and item.get("id")}
            if q_id in poem_ids:
                errors.append(f"Задание {key} взято из poem.tasks")

        txt = str(q.get("text") or q.get("prompt") or "").strip()
        if not txt:
            errors.append(f"В задании {key} отсутствует или пустое поле text")
            
        if q.get("isActive") is False:
            errors.append(f"В задании {key} флаг isActive равен false")
            
        tags = _get_tags(q)
        if any(t in NO_AUTHOR_TAGS for t in tags):
            errors.append(f"Задание {key} содержит запрещенный service-тег 'без автора'")
            
        rod_id = str(q.get("rodId") or "").strip().lower()
        rod_tag = ""
        for t in tags:
            if _is_rod_tag(t):
                rod_tag = _get_structured_tag_payload(t, "род")
                if not rod_tag and (t in ROD_SINGLE_USE_IN_BLOCK11 or t == "проза"):
                    rod_tag = t
                break
        if rod_id and rod_tag and rod_id != rod_tag:
            errors.append(f"Противоречие рода в {key}: rodId={rod_id}, tag={rod_tag}")
            
        spec_field = q.get("special") is True
        spec_tag = any(_tag_matches_kind(t, "исключительный вопрос") or _tag_matches_kind(t, "искл вопрос") or _tag_matches_kind(t, "спец вопрос") for t in tags)
        if "special" in q and spec_tag and spec_field != spec_tag:
            errors.append(f"Противоречие special в {key}: полем={spec_field}, тегом={spec_tag}")


def evaluate_variant_rules2(variant: dict[str, Any], kb_payload: dict[str, Any] | None = None) -> dict[str, Any]:
    errors = []
    used_authors = set()
    used_themes = set()
    used_terms = set()
    rod_counts = {}

    _check_missing_tasks(variant, errors)
    _check_excerpt_and_work_match(variant, errors)
    _check_poem_and_poet_match(variant, errors)
    _check_author_uniqueness(variant, used_authors, errors)
    _check_theme_uniqueness_and_conflict(variant, used_themes, errors)
    _check_task1_integrity(variant, errors)
    _check_excerpt_block1_exclusions(variant, errors)
    _check_task_id_uniqueness(variant, errors)
    _check_task3_task6_answer_lengths(variant, errors)
    _check_without_author_rules(variant, errors)
    _check_task2_structure_integrity(variant, errors)
    _check_task3_integrity(variant, errors)
    _check_task4_integrity(variant, errors)
    _check_task5_integrity(variant, errors)
    _check_task6_integrity(variant, errors)
    _check_task7_integrity(variant, errors)
    _check_task8_structure_integrity(variant, errors)
    _check_task9_integrity(variant, errors)
    _check_task10_integrity(variant, errors)
    _check_block11_integrity(variant, kb_payload, errors)
    _check_internal_duplicates(variant, errors)
    _check_tasks_constraints(variant, used_authors, used_themes, used_terms, errors)
    _check_block11_rods(variant, rod_counts, errors)
    _check_exclusive_question_in_block11(variant, errors)

    return {
        "ok": len(errors) == 0,
        "errors": errors,
        "errorsCount": len(errors),
        "rodCounts": rod_counts
    }
