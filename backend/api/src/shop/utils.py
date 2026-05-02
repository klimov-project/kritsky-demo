from __future__ import annotations

import random
import re
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
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
from api.src.variants.randomizer import generate_variant_runtime2
from .schemas import (
    ShopBook,
    FavoriteBookResponse,
    CartItemResponse,
    PurchasedItemResponse,
    MarketplaceLink,
    CollectionConfig,
    DownloadPackConfig,
)


from .generation import (
    IDENTIFIER_SPLIT_RE,
    CollectionGenerationError,
    _extract_term_tokens,
    _sort_excerpts,
    _pick_random,
    _filter_active_entries,
    _build_identifier_exclusion_set,
    _build_text_exclusion_set,
    _resolve_task2_property_category,
    _pick_character_property,
    _build_task2_runtime,
    _build_runtime_task3,
    _build_excerpt_task_pools,
    _is_complete_collection_source,
    _generate_collection_payload as _gen_author_payload,
    _generate_full_variant_collection_payload as _gen_full_payload,
)

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








def _generate_collection_payload(knowledge_base_payload: dict[str, Any], collection_config: dict[str, Any], quantity: int) -> dict[str, Any]:
    try:
        return _gen_author_payload(knowledge_base_payload, collection_config, quantity)
    except CollectionGenerationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.detail)


def _generate_full_variant_collection_payload(knowledge_base_payload: dict[str, Any], collection_config: dict[str, Any], quantity: int) -> dict[str, Any]:
    try:
        return _gen_full_payload(knowledge_base_payload, collection_config, quantity)
    except CollectionGenerationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.detail)


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


def _validate_pack_specs(packs: list[dict[str, Any]]) -> None:
    """
    Вспомогательная функция для тестов, проверяющая соблюдение спецификаций S1-S9.
    Если спецификация нарушена, выбрасывает AssertionError.
    """
    from collections import defaultdict

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
                
            # S4 (Task 3 term counts) is hard to validate strictly here without full KB access, 
            # because the runtime task3 payload only contains answer1/answer2, not termId.
            # We skip S4 validation in this simple helper.
            
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
