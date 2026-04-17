from __future__ import annotations
from typing import Optional, List, Iterable

from sqlalchemy import select, delete as sa_delete, update as sa_update, insert as sa_insert
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from db.src.connect import init_session
from .abc import AbcDBRepository
from .mixin import DbMixin

from db.src.models import Book, BookExternalLink, BookAttachment
from ..schemas.core import BookSchema

class DbBooksRepo(DbMixin, AbcDBRepository):
    """Репозиторий для книг."""
    model = Book

    async def aget(self, id: int, session: AsyncSession) -> Optional[Book]:
        result = await session.execute(
            select(Book)
            .options(
                selectinload(Book.cover),
                selectinload(Book.digital_file),
                selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
                selectinload(Book.external_links),
            )
            .where(Book.id == id)
        )
        return result.scalar_one_or_none()
    
    def get(self, id: int) -> Optional[Book]:
        with init_session() as session:
            result = session.execute(
                select(Book)
                .options(
                    selectinload(Book.cover),
                    selectinload(Book.digital_file),
                    selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
                    selectinload(Book.external_links),
                )
                .where(Book.id == id)
            )
            return result.scalar_one_or_none()


    async def alist_with_total(
        self,
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        category: Optional[str] = None,
        fulfillment: Optional[str] = None
    ) -> tuple[List[Book], int]:
        from db.src.models import Book
        from sqlalchemy import func
        
        query = select(Book).options(
            selectinload(Book.cover),
            selectinload(Book.digital_file),
            selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
            selectinload(Book.external_links),
        )
        count_query = select(func.count(Book.id))
        
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(Book.title.ilike(pattern) | Book.author.ilike(pattern))
            count_query = count_query.where(Book.title.ilike(pattern) | Book.author.ilike(pattern))
            
        if category:
            from core.src.repos.books import _parse_category
            parsed_cat = _parse_category(category)
            query = query.where(Book.category == parsed_cat)
            count_query = count_query.where(Book.category == parsed_cat)
            
        if fulfillment:
            from core.src.repos.books import _parse_fulfillment
            parsed_ful = _parse_fulfillment(fulfillment)
            query = query.where(Book.fulfillment_type == parsed_ful)
            count_query = count_query.where(Book.fulfillment_type == parsed_ful)
            
        query = query.order_by(Book.id.desc()).limit(limit).offset(offset)
        
        books = (await session.execute(query)).scalars().all()
        total = (await session.execute(count_query)).scalar_one()
        return list(books), int(total)

    async def alist(
        self,
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None
    ) -> List[BookSchema]:
        """
        Получение списка книг с фильтрацией по названию или автору.
        Подгружает связанные данные (обложку, файлы, ссылки).
        
        Args:
            session (AsyncSession): Сессия БД.
            limit (int): Лимит записей.
            offset (int): Смещение.
            search (str, optional): Строка поиска.
            
        Returns:
            List[BookSchema]: Список схем книг.
        """
        query = select(Book).options(
            selectinload(Book.cover),
            selectinload(Book.digital_file),
            selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
            selectinload(Book.external_links),
        )
        
        if search:
            query = query.where(Book.title.ilike(f"%{search}%") | Book.author.ilike(f"%{search}%"))
            
        query = query.limit(limit).offset(offset)
        result = await session.execute(query)
        return [BookSchema.model_validate(b, from_attributes=True) for b in result.scalars().all()]

    async def asave(self, obj: BaseModel, session: AsyncSession) -> BookSchema:
        db_model = await self._asave(obj, session)
        await session.commit()
        return await self.aget(db_model.id, session)

    def save(self, obj: BaseModel) -> BookSchema:
        with init_session() as session:
            db_model = self._save(obj, session)
            session.commit()
            return self.get(db_model.id)

    async def aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[BookSchema]:
        db_model = await self._aupdate(obj, session, consider_all)
        await session.commit()
        if db_model:
            return await self.aget(db_model.id, session)
        return None

    def update(self, obj: BaseModel, consider_all: bool = False) -> Optional[BookSchema]:
        with init_session() as session:
            db_model = self._update(obj, session, consider_all)
            session.commit()
            if db_model:
                return self.get(db_model.id)
        return None

    async def adelete(self, id: int, session: AsyncSession) -> bool:
        return (await self._adelete(id, session)) is not None

    def delete(self, id: int) -> bool:
        with init_session() as session:
            res = self._delete(id, session)
            session.commit()
            return res is not None

    async def asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[BookSchema]:
        """
        Массовое сохранение книг асинхронно.
        Сохраняет объекты и повторно загружает их со всеми связями.
        
        Args:
            objs (Iterable[BaseModel]): Коллекция моделей для сохранения.
            session (AsyncSession): Сессия БД.
            
        Returns:
            List[BookSchema]: Список созданных схем книг со связями.
        """
        db_models = await self._asave_many(objs, session)
        await session.commit()
        ids = [m.id for m in db_models]
        result = await session.execute(
            select(Book)
            .options(
                selectinload(Book.cover),
                selectinload(Book.digital_file),
                selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
                selectinload(Book.external_links),
            )
            .where(Book.id.in_(ids))
        )
        return [BookSchema.model_validate(b, from_attributes=True) for b in result.scalars().all()]

    def save_many(self, objs: Iterable[BaseModel]) -> List[BookSchema]:
        with init_session() as session:
            db_models = self._save_many(objs, session)
            session.commit()
            ids = [m.id for m in db_models]
            result = session.execute(
                select(Book)
                .options(
                    selectinload(Book.cover),
                    selectinload(Book.digital_file),
                    selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
                    selectinload(Book.external_links),
                )
                .where(Book.id.in_(ids))
            )
            return [BookSchema.model_validate(b, from_attributes=True) for b in result.scalars().all()]

    async def aapply_shop_payload(self, book: Book, payload: Any, session: AsyncSession) -> None:
        """Applies shop payload processing mapping relations directly to the database model."""
        book.title = payload.title.strip()
        book.description = (payload.description or "").strip() or None
        book.author = payload.author.strip()
        book.price = payload.price
        parsed_category = _parse_category(payload.category)
        
        collection_config = getattr(payload, "collectionConfig", None)
        if collection_config:
            collection_config = _normalize_collection_config(collection_config.model_dump())
        
        download_pack_config = getattr(payload, "downloadPackConfig", None)
        if download_pack_config:
            download_pack_config = _normalize_download_pack_config(download_pack_config.model_dump())

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
        
        tags = getattr(payload, "tags", [])
        book.tags = [tag.strip() for tag in tags if tag.strip()] or None
        
        book.collection_config = collection_config if parsed_category == ProductCategoryEnum.COLLECTIONS else None
        book.download_pack_config = download_pack_config if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else None
        
        cover = await _get_or_create_media(session, getattr(payload, "coverUrl", None))
        book.cover_id = cover.id if cover else None
        
        digital_file_name = None if parsed_category == ProductCategoryEnum.DOWNLOAD_PACKS else getattr(payload, "digitalFileName", None)
        digital_file = await _get_or_create_media(session, digital_file_name)
        book.digital_file_id = digital_file.id if digital_file else None
        
        session.add(book)
        await session.flush()
        
        await session.execute(sa_delete(BookAttachment).where(BookAttachment.book_id == book.id))
        gallery = getattr(payload, "gallery", [])
        for image_name in gallery:
            media = await _get_or_create_media(session, image_name)
            if media is None: continue
            session.add(BookAttachment(book_id=book.id, minio_object_id=media.id))
            
        await session.execute(sa_delete(BookExternalLink).where(BookExternalLink.book_id == book.id))
        marketplaces = getattr(payload, "marketplaces", [])
        for marketplace in marketplaces:
            label = marketplace.label.strip()
            url = marketplace.url.strip()
            if not label or not url: continue
            session.add(BookExternalLink(book_id=book.id, label=label, url=url))
            
        await session.flush()

    async def _asave(self, obj: BaseModel, session: AsyncSession) -> Book:
        dump = obj.model_dump(exclude={'id', 'external_links', 'tags'}, exclude_unset=True)
        tags = obj.tags if hasattr(obj, 'tags') else None
        
        db_model = Book(**dump)
        if tags is not None:
            db_model.tags = tags
            
        session.add(db_model)
        await session.flush()
        return db_model

    async def _aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[Book]:
        if not getattr(obj, 'id', None):
             return None
        
        dump = obj.model_dump(exclude={'id', 'external_links', 'tags'}, exclude_unset=not consider_all)
        tags = obj.tags if hasattr(obj, 'tags') else None # TODO: Update tags logic
        
        stmt = sa_update(Book).where(Book.id == obj.id).values(**dump).returning(Book)
        res = await session.execute(stmt)
        db_model = res.scalar_one_or_none()
        
        if db_model and tags is not None:
             db_model.tags = tags
             session.add(db_model)
             await session.flush()
             
        return db_model


    
    def _save(self, obj: BaseModel, session) -> Book:
        dump = obj.model_dump(exclude={'id', 'external_links', 'tags'}, exclude_unset=True)
        tags = obj.tags if hasattr(obj, 'tags') else None
        
        db_model = Book(**dump)
        if tags is not None:
            db_model.tags = tags
            
        session.add(db_model)
        session.flush()
        return db_model

    def _update(self, obj: BaseModel, session, consider_all: bool = False) -> Optional[Book]:
        if not getattr(obj, 'id', None):
             return None
        dump = obj.model_dump(exclude={'id', 'external_links', 'tags'}, exclude_unset=not consider_all)
        stmt = sa_update(Book).where(Book.id == obj.id).values(**dump).returning(Book)
        res = session.execute(stmt)
        db_model = res.scalar_one_or_none()
        
        tags = obj.tags if hasattr(obj, 'tags') else None
        if db_model and tags is not None:
             db_model.tags = tags
             session.add(db_model)
             session.flush()
        return db_model

    def _delete(self, id: int, session) -> Optional[Book]:
        result = session.execute(sa_delete(Book).where(Book.id == id).returning(Book))
        return result.scalar_one_or_none()
        
    def _save_many(self, objs: Iterable[BaseModel], session) -> List[Book]:
        db_models = []
        for obj in objs:
            db_models.append(self._save(obj, session))
        return db_models

    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[Book]:
        db_models = []
        for obj in objs:
            db_models.append(await self._asave(obj, session))
        return db_models

from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import delete
from db.src.enums import ProductCategoryEnum, ProductFulfillmentEnum
from db.src.models import MinioObjects

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

async def _get_or_create_media(session: AsyncSession, name: str | None) -> MinioObjects | None:
    value = (name or "").strip()
    if not value: return None
    query = await session.execute(select(MinioObjects).where(MinioObjects.bucket == "shop-assets", MinioObjects.name == value))
    existing = query.scalar_one_or_none()
    if existing is not None: return existing
    media = MinioObjects(bucket="shop-assets", name=value)
    session.add(media)
    await session.flush()
    return media

