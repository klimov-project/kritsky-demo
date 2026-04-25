from __future__ import annotations
from typing import Optional, List, Iterable

from sqlalchemy import select, delete as sa_delete, update as sa_update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from db.src.connect import init_session
from db.src.models import FavoriteBook, Book
from .abc import AbcDBRepository
from .mixin import DbMixin
from ..schemas.core import FavoriteBookSchema

class DbFavoritesRepo(DbMixin, AbcDBRepository):
    """Репозиторий для избранного."""
    model = FavoriteBook

    async def get_user_favorites(self, user_id: int, session: AsyncSession) -> List[FavoriteBookSchema]:
        """Получить избранное пользователя."""
        items = await self.aget_user_favorites_models(user_id, session)
        return [FavoriteBookSchema.model_validate(item, from_attributes=True) for item in items]

    async def aget_user_favorites_models(self, user_id: int, session: AsyncSession) -> List[FavoriteBook]:
        from db.src.models import BookAttachment, BookExternalLink
        query = (
            select(FavoriteBook)
            .options(
                selectinload(FavoriteBook.book).selectinload(Book.cover),
                selectinload(FavoriteBook.book).selectinload(Book.digital_file),
                selectinload(FavoriteBook.book).selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
                selectinload(FavoriteBook.book).selectinload(Book.external_links),
            )
            .where(FavoriteBook.user_id == user_id)
            .order_by(FavoriteBook.id.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def add_to_favorites(self, user_id: int, book_id: int, session: AsyncSession) -> bool:
        """Добавить книгу в избранное."""
        try:
            item = FavoriteBook(user_id=user_id, book_id=book_id)
            session.add(item)
            await session.commit()
            return True
        except IntegrityError:
            await session.rollback()
            return False

    async def remove_from_favorites(self, user_id: int, book_id: int, session: AsyncSession) -> bool:
        """Удалить книгу из избранного."""
        stmt = sa_delete(FavoriteBook).where(FavoriteBook.user_id == user_id, FavoriteBook.book_id == book_id)
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0



    async def aget(self, id: int, session: AsyncSession) -> Optional[FavoriteBook]:
        result = await session.execute(
            select(FavoriteBook)
            .options(selectinload(FavoriteBook.book).selectinload(Book.cover))
            .where(FavoriteBook.id == id)
        )
        return result.scalar_one_or_none()

    def get(self, id: int) -> Optional[FavoriteBook]:
        with init_session() as session:
            result = session.execute(
                select(FavoriteBook)
                .options(selectinload(FavoriteBook.book).selectinload(Book.cover))
                .where(FavoriteBook.id == id)
            )
            return result.scalar_one_or_none()

    async def asave(self, obj: BaseModel, session: AsyncSession) -> FavoriteBookSchema:
        db_model = await self._asave(obj, session)
        await session.commit()
        return await self.aget(db_model.id, session)

    def save(self, obj: BaseModel) -> FavoriteBookSchema:
        with init_session() as session:
            db_model = self._save(obj, session)
            session.commit()
            return self.get(db_model.id)

    async def aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[FavoriteBookSchema]:
        db_model = await self._aupdate(obj, session, consider_all)
        await session.commit()
        if db_model:
            return await self.aget(db_model.id, session)
        return None

    def update(self, obj: BaseModel, consider_all: bool = False) -> Optional[FavoriteBookSchema]:
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

    async def asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[FavoriteBookSchema]:
        db_models = await self._asave_many(objs, session)
        await session.commit()
        ids = [m.id for m in db_models]
        query = select(FavoriteBook).options(selectinload(FavoriteBook.book).selectinload(Book.cover)).where(FavoriteBook.id.in_(ids))
        result = await session.execute(query)
        return [FavoriteBookSchema.model_validate(item, from_attributes=True) for item in result.scalars().all()]

    def save_many(self, objs: Iterable[BaseModel]) -> List[FavoriteBookSchema]:
        with init_session() as session:
            db_models = self._save_many(objs, session)
            session.commit()
            ids = [m.id for m in db_models]
            query = select(FavoriteBook).options(selectinload(FavoriteBook.book).selectinload(Book.cover)).where(FavoriteBook.id.in_(ids))
            result = session.execute(query)
            return [FavoriteBookSchema.model_validate(item, from_attributes=True) for item in result.scalars().all()]



    def _save(self, obj: BaseModel, session) -> FavoriteBook:
        dump = obj.model_dump(exclude={'id'}, exclude_unset=True)
        db_model = FavoriteBook(**dump)
        session.add(db_model)
        session.flush()
        return db_model

    def _update(self, obj: BaseModel, session, consider_all: bool = False) -> Optional[FavoriteBook]:
        if not getattr(obj, 'id', None):
             return None
        dump = obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)
        stmt = sa_update(FavoriteBook).where(FavoriteBook.id == obj.id).values(**dump).returning(FavoriteBook)
        res = session.execute(stmt)
        return res.scalar_one_or_none()

    def _delete(self, id: int, session) -> Optional[FavoriteBook]:
        result = session.execute(sa_delete(FavoriteBook).where(FavoriteBook.id == id).returning(FavoriteBook))
        return result.scalar_one_or_none()

    def _save_many(self, objs: Iterable[BaseModel], session) -> List[FavoriteBook]:
        db_models = []
        for obj in objs:
            db_models.append(self._save(obj, session))
        return db_models

    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[FavoriteBook]:
        db_models = []
        for obj in objs:
            db_models.append(await self._asave(obj, session))
        return db_models
