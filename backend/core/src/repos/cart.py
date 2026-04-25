from __future__ import annotations
from typing import Optional, List, Iterable

from sqlalchemy import select, delete as sa_delete, update as sa_update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from db.src.connect import init_session
from db.src.models import CartItem, Book
from .abc import AbcDBRepository
from .mixin import DbMixin
from ..schemas.core import CartItemSchema

class DbCartRepo(DbMixin, AbcDBRepository):
    """Репозиторий для корзины."""
    model = CartItem

    async def get_user_cart(self, user_id: int, session: AsyncSession) -> List[CartItemSchema]:
        """Получить корзину пользователя."""
        items = await self.aget_user_cart_models(user_id, session)
        return [CartItemSchema.model_validate(item, from_attributes=True) for item in items]

    async def aget_user_cart_models(self, user_id: int, session: AsyncSession) -> List[CartItem]:
        from db.src.models import BookAttachment, BookExternalLink
        query = (
            select(CartItem)
            .options(
                selectinload(CartItem.book).selectinload(Book.cover),
                selectinload(CartItem.book).selectinload(Book.digital_file),
                selectinload(CartItem.book).selectinload(Book.attachments).selectinload(BookAttachment.minio_object),
                selectinload(CartItem.book).selectinload(Book.external_links),
            )
            .where(CartItem.user_id == user_id)
            .order_by(CartItem.id.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def add_to_cart(self, user_id: int, book_id: int, session: AsyncSession) -> bool:
        """Добавить книгу в корзину."""
        try:
            item = CartItem(user_id=user_id, book_id=book_id)
            session.add(item)
            await session.commit()
            return True
        except IntegrityError:
            await session.rollback()
            return False


    async def add_item(self, user_id: int, book_id: int, quantity: int, session: AsyncSession):
        from db.src.models import CartItem
        existing = (await session.execute(
            select(CartItem).where(CartItem.user_id == user_id, CartItem.book_id == book_id)
        )).scalar_one_or_none()
        
        if existing:
            existing.quantity = min(99, max(1, existing.quantity + quantity))
        else:
            session.add(CartItem(user_id=user_id, book_id=book_id, quantity=quantity))
        await session.flush()

    async def update_quantity(self, user_id: int, book_id: int, quantity: int, session: AsyncSession) -> bool:
        from db.src.models import CartItem
        item = (await session.execute(
            select(CartItem).where(CartItem.user_id == user_id, CartItem.book_id == book_id)
        )).scalar_one_or_none()
        if not item:
            return False
        item.quantity = quantity
        await session.flush()
        return True

    async def remove_from_cart(self, user_id: int, book_id: int, session: AsyncSession) -> bool:
        """Удалить книгу из корзины."""
        stmt = sa_delete(CartItem).where(CartItem.user_id == user_id, CartItem.book_id == book_id)
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0

    async def clear_cart(self, user_id: int, session: AsyncSession) -> None:
        """Очистить корзину."""
        stmt = sa_delete(CartItem).where(CartItem.user_id == user_id)
        await session.execute(stmt)
        await session.commit()



    async def aget(self, id: int, session: AsyncSession) -> Optional[CartItem]:
        result = await session.execute(
            select(CartItem)
            .options(selectinload(CartItem.book).selectinload(Book.cover))
            .where(CartItem.id == id)
        )
        return result.scalar_one_or_none()

    def get(self, id: int) -> Optional[CartItem]:
        with init_session() as session:
            result = session.execute(
                select(CartItem)
                .options(selectinload(CartItem.book).selectinload(Book.cover))
                .where(CartItem.id == id)
            )
            return result.scalar_one_or_none()

    async def asave(self, obj: BaseModel, session: AsyncSession) -> CartItemSchema:
        db_model = await self._asave(obj, session)
        await session.commit()
        return await self.aget(db_model.id, session)

    def save(self, obj: BaseModel) -> CartItemSchema:
        with init_session() as session:
            db_model = self._save(obj, session)
            session.commit()
            return self.get(db_model.id)

    async def aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[CartItemSchema]:
        db_model = await self._aupdate(obj, session, consider_all)
        await session.commit()
        if db_model:
            return await self.aget(db_model.id, session)
        return None

    def update(self, obj: BaseModel, consider_all: bool = False) -> Optional[CartItemSchema]:
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

    async def asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[CartItemSchema]:
        db_models = await self._asave_many(objs, session)
        await session.commit()
        ids = [m.id for m in db_models]
        query = select(CartItem).options(selectinload(CartItem.book).selectinload(Book.cover)).where(CartItem.id.in_(ids))
        result = await session.execute(query)
        return [CartItemSchema.model_validate(item, from_attributes=True) for item in result.scalars().all()]

    def save_many(self, objs: Iterable[BaseModel]) -> List[CartItemSchema]:
        with init_session() as session:
            db_models = self._save_many(objs, session)
            session.commit()
            ids = [m.id for m in db_models]
            query = select(CartItem).options(selectinload(CartItem.book).selectinload(Book.cover)).where(CartItem.id.in_(ids))
            result = session.execute(query)
            return [CartItemSchema.model_validate(item, from_attributes=True) for item in result.scalars().all()]

   


    def _save(self, obj: BaseModel, session) -> CartItem:
        dump = obj.model_dump(exclude={'id'}, exclude_unset=True)
        db_model = CartItem(**dump)
        session.add(db_model)
        session.flush()
        return db_model

    def _update(self, obj: BaseModel, session, consider_all: bool = False) -> Optional[CartItem]:
        if not getattr(obj, 'id', None):
             return None
        dump = obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)
        stmt = sa_update(CartItem).where(CartItem.id == obj.id).values(**dump).returning(CartItem)
        res = session.execute(stmt)
        return res.scalar_one_or_none()

    def _delete(self, id: int, session) -> Optional[CartItem]:
        result = session.execute(sa_delete(CartItem).where(CartItem.id == id).returning(CartItem))
        return result.scalar_one_or_none()

    def _save_many(self, objs: Iterable[BaseModel], session) -> List[CartItem]:
        db_models = []
        for obj in objs:
            db_models.append(self._save(obj, session))
        return db_models

    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[CartItem]:
        db_models = []
        for obj in objs:
            db_models.append(await self._asave(obj, session))
        return db_models
