from __future__ import annotations

import random
import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, TypeVar, Optional, List, Dict

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import selectinload

from db.src.enums import ProductCategoryEnum, ProductFulfillmentEnum
from db.src.models import (
    Book,
    BookAttachment,
    BookExternalLink,
    MinioObjects,
    OrderItem,
    Payment,
    FavoriteBook,
    CartItem,
)
from api.src.variants.randomizer import generate_variant_runtime
from .schemas import (
    ShopBook,
    FavoriteBookResponse,
    CartItemResponse,
    PurchasedItemResponse,
    MarketplaceLink,
    CollectionConfig,
    DownloadPackConfig,
)


T = TypeVar("T")
IDENTIFIER_SPLIT_RE = re.compile(r"[,;\n]+")


def _parse_age_limit(value: str | None) -> int | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    digits = "".join(character for character in raw if character.isdigit())
    if not digits:
        return None
    try:
        return int(digits)
    except ValueError:
        return None


def _format_age_limit(value: int | None) -> str | None:
    if value is None:
        return None
    return f"{value}+"


def _map_fulfillment(value: ProductFulfillmentEnum) -> str:
    return "DIGITAL" if value == ProductFulfillmentEnum.DIGITAL else "PHYSICAL"


def _parse_fulfillment(value: str) -> ProductFulfillmentEnum:
    normalized = value.strip().upper()
    if normalized == "DIGITAL":
        return ProductFulfillmentEnum.DIGITAL
    return ProductFulfillmentEnum.PHYSICAL


def _parse_category(value: str) -> ProductCategoryEnum:
    normalized = value.strip().lower()
    for enum_value in ProductCategoryEnum:
        if enum_value.value == normalized:
            return enum_value
    return ProductCategoryEnum.BOOKS


def _map_media_name(media: MinioObjects | None) -> str | None:
    if media is None:
        return None
    return media.name


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


def _normalize_collection_config(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    author_id = str(value.get("authorId") or "").strip()
    author_name = str(value.get("authorName") or "").strip()
    raw_count = value.get("variantsCount")
    try:
        variants_count = int(raw_count)
    except (TypeError, ValueError):
        variants_count = 0
    if not author_id or not author_name or variants_count <= 0:
        return None
    return {
        "authorId": author_id,
        "authorName": author_name,
        "variantsCount": max(1, min(variants_count, 100)),
        "collectionKind": value.get("collectionKind", "author_1_5"),
    }


def _normalize_download_pack_config(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    raw_count = value.get("downloadsCount")
    try:
        downloads_count = int(raw_count)
    except (TypeError, ValueError):
        downloads_count = 0
    if downloads_count <= 0:
        return None
    return {
        "downloadsCount": max(1, min(downloads_count, 10000)),
    }


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
    explicit_extra = str(question.get("extraOption") or "").strip()
    if explicit_extra and explicit_extra.lower() in excluded_properties:
        explicit_extra = ""
    extra_option = (
        _pick_random(list(dict.fromkeys(same_question_extra_candidates)))
        or (explicit_extra if explicit_extra and explicit_extra not in used_properties else "")
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


def _build_collection_variant(work: dict[str, Any], excerpt: dict[str, Any], all_works: list[dict[str, Any]], index: int) -> dict[str, Any] | None:
    pools = _build_excerpt_task_pools(work, excerpt, all_works)
    excerpt_tasks = excerpt.get("tasks") if isinstance(excerpt.get("tasks"), dict) else {}
    task2_runtime = None
    task2_questions = pools["task2"][:]
    random.shuffle(task2_questions)
    for question in task2_questions:
        task2_runtime = _build_task2_runtime(work, question, excerpt_tasks, pools["task2"])
        if task2_runtime is not None:
            break
    task3_runtime = _build_runtime_task3(pools["task3"])
    task1 = _pick_random(pools["task1"])
    task4_1 = _pick_random(pools["task4_1"])
    task4_2 = _pick_random(pools["task4_2"])
    task5 = _pick_random(pools["task5"])
    if task1 is None or task2_runtime is None or task3_runtime is None or (task4_1 is None and task4_2 is None) or task5 is None:
        return None
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
    sources = [(work, excerpt) for work in author_works for excerpt in _sort_excerpts([item for item in work.get("excerpts", []) if isinstance(item, dict)]) if str(excerpt.get("text") or "").strip()]
    complete_sources = [(work, excerpt) for work, excerpt in sources if _is_complete_collection_source(work, excerpt, works)]
    if not sources:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Не удалось собрать сборник: для автора {author_name} нет отрывков.")
    if not complete_sources:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Не удалось собрать сборник: для автора {author_name} нет отрывков с полным набором заданий 1–5.")
    packs = []
    for pack_index in range(quantity):
        shuffled_sources = complete_sources[:]
        random.shuffle(shuffled_sources)
        variants = []
        for variant_index in range(variants_count):
            source = shuffled_sources[variant_index % len(shuffled_sources)]
            variant = _build_collection_variant(source[0], source[1], works, variant_index + 1)
            if variant is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Не удалось собрать сборник: один из отрывков автора {author_name} не даёт полный вариант 1–5.")
            variants.append(variant)
        packs.append({"index": pack_index + 1, "variants": variants})
    return {"kind": "author_collection_1_5", "authorId": author_id, "authorName": author_name, "variantsCount": variants_count, "packs": packs}


def _generate_full_variant_collection_payload(knowledge_base_payload: dict[str, Any], collection_config: dict[str, Any], quantity: int) -> dict[str, Any]:
    variants_count = int(collection_config["variantsCount"])
    packs = []
    for pack_index in range(quantity):
        variants = []
        for variant_index in range(variants_count):
            result = generate_variant_runtime(knowledge_base_payload, {})
            variant = result["variant"]
            variant["id"] = f"full-variant-{pack_index}-{variant_index}"
            variant["index"] = variant_index + 1
            variants.append(variant)
        packs.append({"index": pack_index + 1, "variants": variants})
    return {"kind": "full_variant_collection", "variantsCount": variants_count, "packs": packs}


def _normalize_delivery_type(value: str) -> str:
    normalized = value.strip().lower()
    if normalized in {"with_delivery", "delivery", "courier"}:
        return "with_delivery"
    return "without_delivery"


def _delivery_cost(delivery_type: str) -> Decimal:
    return Decimal("390.00") if _normalize_delivery_type(delivery_type) == "with_delivery" else Decimal("0.00")


def _map_fulfillment_from_raw(value: str | None) -> str:
    if not value: return "PHYSICAL"
    return "DIGITAL" if value.strip().lower() == ProductFulfillmentEnum.DIGITAL.value else "PHYSICAL"


def _book_to_dto(book: Book) -> ShopBook:
    collection_config_raw = _normalize_collection_config(book.collection_config)
    download_pack_config_raw = _normalize_download_pack_config(book.download_pack_config)
    return ShopBook(
        id=book.id,
        title=book.title,
        description=book.description,
        author=book.author,
        price=book.price,
        category=book.category.value,
        fulfillment=_map_fulfillment(book.fulfillment_type),
        format=book.format,
        ageLimit=_format_age_limit(book.age_limit),
        year=book.year,
        pages=book.pages,
        isbn=book.isbn,
        tags=book.tags or [],
        coverUrl=_map_media_name(book.cover),
        gallery=[attachment.minio_object.name for attachment in (book.attachments or []) if attachment.minio_object is not None],
        digitalFileName=_map_media_name(book.digital_file),
        marketplaces=[MarketplaceLink(label=link.label, url=link.url) for link in (book.external_links or [])],
        collectionConfig=CollectionConfig(**collection_config_raw) if collection_config_raw else None,
        downloadPackConfig=DownloadPackConfig(**download_pack_config_raw) if download_pack_config_raw else None,
    )


def _favorite_to_dto(item: FavoriteBook) -> FavoriteBookResponse:
    if item.book is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Favorite book relation is missing")
    return FavoriteBookResponse(id=item.id, bookId=item.book_id, book=_book_to_dto(item.book))


def _cart_item_to_dto(item: CartItem) -> CartItemResponse:
    if item.book is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cart book relation is missing")
    book_dto = _book_to_dto(item.book)
    line_total = item.book.price * item.quantity
    return CartItemResponse(id=item.id, bookId=item.book_id, quantity=item.quantity, lineTotal=line_total, book=book_dto)


def _order_item_to_purchase_dto(item: OrderItem, include_payload: bool = True) -> PurchasedItemResponse:
    if item.order is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Order relation is missing")
    digital_file_name = None
    description = None
    collection_config = None
    download_pack_config = None
    if item.book is not None:
        digital_file_name = _map_media_name(item.book.digital_file)
        description = item.book.description
        collection_config = _normalize_collection_config(item.book.collection_config)
        download_pack_config = _normalize_download_pack_config(item.book.download_pack_config)
    generated_collection = None
    if include_payload and isinstance(item.payload, dict) and item.payload.get("kind") in ("author_collection_1_5", "full_variant_collection"):
        generated_collection = item.payload
        if hasattr(item, "tasks") and item.tasks:
            from api.src.variants.task_links import rebuild_variant_from_links
            tasks_by_variant_idx = {}
            for t in item.tasks:
                tasks_by_variant_idx.setdefault(t.variant_index, []).append(t)
            
            packs = generated_collection.get("packs", [])
            vi = 0
            for pack in packs:
                variants = pack.get("variants", [])
                for i in range(len(variants)):
                    variant_tasks = tasks_by_variant_idx.get(vi, [])
                    variants[i] = rebuild_variant_from_links(variant_tasks, variants[i])
                    vi += 1
    return PurchasedItemResponse(
        id=item.id,
        orderId=item.order_id,
        title=item.title,
        description=description,
        author=item.author,
        category=(item.category or ProductCategoryEnum.BOOKS.value),
        fulfillment=_map_fulfillment_from_raw(item.fulfillment_type),
        purchasedAt=item.order.createdAt,
        price=item.unit_price,
        quantity=item.quantity,
        total=item.line_total,
        coverUrl=item.cover_name,
        digitalFileName=digital_file_name,
        bookId=item.book_id,
        collectionConfig=CollectionConfig(**collection_config) if isinstance(collection_config, dict) else None,
        downloadPackConfig=DownloadPackConfig(**download_pack_config) if isinstance(download_pack_config, dict) else None,
        generatedCollection=generated_collection,
    )


def _resolve_payment_kind(payment: Payment) -> str:
    if payment.order is None: return "subscription"
    categories = {(item.category or "").strip().lower() for item in (payment.order.items or []) if item is not None and item.category}
    if ProductCategoryEnum.DOWNLOAD_PACKS.value in categories: return "download_pack"
    return "shop"


async def _get_or_create_media(session, name: str | None) -> MinioObjects | None:
    value = (name or "").strip()
    if not value: return None
    query = await session.execute(select(MinioObjects).where(MinioObjects.bucket == "shop-assets", MinioObjects.name == value))
    existing = query.scalar_one_or_none()
    if existing is not None: return existing
    media = MinioObjects(bucket="shop-assets", name=value)
    session.add(media)
    await session.flush()
    return media


async def _apply_book_payload(book: Book, payload: Any, session) -> None:
    book.title = payload.title.strip()
    book.description = (payload.description or "").strip() or None
    book.author = payload.author.strip()
    book.price = payload.price
    parsed_category = _parse_category(payload.category)
    collection_config = _normalize_collection_config(payload.collectionConfig.model_dump() if payload.collectionConfig else None)
    download_pack_config = _normalize_download_pack_config(payload.downloadPackConfig.model_dump() if payload.downloadPackConfig else None)
    if parsed_category == ProductCategoryEnum.COLLECTIONS:
        if collection_config is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Для сборника нужно выбрать настройки")
        kind = collection_config.get("collectionKind", "author_1_5")
        if kind == "author_1_5" and not collection_config.get("authorId"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Для сборника по автору нужно выбрать автора")
    if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS and download_pack_config is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Для пакета скачиваний нужно указать количество скачиваний")
    book.category = parsed_category
    book.fulfillment_type = ProductFulfillmentEnum.DIGITAL if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else _parse_fulfillment(payload.fulfillment)
    book.format = None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else (payload.format or "").strip() or None
    book.age_limit = None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else _parse_age_limit(payload.ageLimit)
    book.year = None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else payload.year
    book.pages = None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else payload.pages
    book.isbn = None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else (payload.isbn or "").strip() or None
    book.tags = [tag.strip() for tag in payload.tags if tag.strip()] or None
    book.collection_config = collection_config if parsed_category == ProductCategoryEnum.COLLECTIONS else None
    book.download_pack_config = download_pack_config if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else None
    cover = await _get_or_create_media(session, payload.coverUrl)
    book.cover_id = cover.id if cover else None
    digital_file = await _get_or_create_media(session, None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else payload.digitalFileName)
    book.digital_file_id = digital_file.id if digital_file else None
    session.add(book)
    await session.flush()
    await session.execute(delete(BookAttachment).where(BookAttachment.book_id == book.id))
    for image_name in payload.gallery:
        media = await _get_or_create_media(session, image_name)
        if media is None: continue
        session.add(BookAttachment(book_id=book.id, minio_object_id=media.id))
    await session.execute(delete(BookExternalLink).where(BookExternalLink.book_id == book.id))
    for marketplace in payload.marketplaces:
        label = marketplace.label.strip(); url = marketplace.url.strip()
        if not label or not url: continue
        session.add(BookExternalLink(book_id=book.id, label=label, url=url))
    await session.flush()


async def _load_book_with_relations(session, book_id: int) -> Book | None:
    query = await session.execute(
        select(Book)
        .options(
            selectinload(Book.cover),
            selectinload(Book.digital_file),
            selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
            selectinload(Book.external_links),
        )
        .execution_options(populate_existing=True)
        .where(Book.id == book_id)
    )
    return query.scalar_one_or_none()
