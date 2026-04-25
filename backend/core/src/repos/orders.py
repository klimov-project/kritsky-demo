from __future__ import annotations
from typing import Optional, List, Iterable

from sqlalchemy import select, delete as sa_delete, update as sa_update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from db.src.connect import init_session
from db.src.models import Order, OrderItem
from .abc import AbcDBRepository
from .mixin import DbMixin
from ..schemas.core import OrderSchema

class DbOrdersRepo(DbMixin, AbcDBRepository):
    """Репозиторий для заказов."""
    model = Order

    async def acount(self, session: AsyncSession) -> int:
        from sqlalchemy import func
        result = await session.execute(select(func.count(self.model.id)))
        return result.scalar_one() or 0

    async def aget(self, id: int, session: AsyncSession) -> Optional[Order]:
        result = await session.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == id)
        )
        return result.scalar_one_or_none()

    def get(self, id: int) -> Optional[Order]:
        with init_session() as session:
            result = session.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == id)
            )
            return result.scalar_one_or_none()

    async def asave(self, obj: BaseModel, session: AsyncSession) -> OrderSchema:
        db_model = await self._asave(obj, session)
        await session.commit()
        return OrderSchema.model_validate(db_model, from_attributes=True)

    def save(self, obj: BaseModel) -> OrderSchema:
        with init_session() as session:
            db_model = self._save(obj, session)
            session.commit()
            return OrderSchema.model_validate(db_model, from_attributes=True)

    async def aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[OrderSchema]:
        db_model = await self._aupdate(obj, session, consider_all)
        await session.commit()
        if db_model:
            return OrderSchema.model_validate(db_model, from_attributes=True)
        return None

    def update(self, obj: BaseModel, consider_all: bool = False) -> Optional[OrderSchema]:
        with init_session() as session:
            db_model = self._update(obj, session, consider_all)
            session.commit()
            if db_model:
                return OrderSchema.model_validate(db_model, from_attributes=True)
        return None


    async def aget_user_purchases(self, user_id: int, session: AsyncSession) -> List[OrderItem]:
        from db.src.models import Book, OrderItemTask
        query = await session.execute(
            select(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .options(
                selectinload(OrderItem.order),
                selectinload(OrderItem.book).selectinload(Book.digital_file),
                selectinload(OrderItem.tasks).selectinload(OrderItemTask.task)
            )
            .where(Order.user_id == user_id)
            .order_by(OrderItem.id.desc())
        )
        return list(query.scalars().all())

    async def aget_user_purchase(self, purchase_id: int, user_id: int, session: AsyncSession) -> Optional[OrderItem]:
        from db.src.models import Book, OrderItemTask
        query = await session.execute(
            select(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .options(
                selectinload(OrderItem.order),
                selectinload(OrderItem.book).selectinload(Book.digital_file),
                selectinload(OrderItem.tasks).selectinload(OrderItemTask.task)
            )
            .where(OrderItem.id == purchase_id, Order.user_id == user_id)
        )
        return query.scalar_one_or_none()


    async def alist_with_relations(
        self, 
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[Order]:
        query = (
            select(Order)
            .options(selectinload(Order.user), selectinload(Order.items))
            .order_by(Order.id.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def adelete(self, id: int, session: AsyncSession) -> bool:
        return (await self._adelete(id, session)) is not None

    def delete(self, id: int) -> bool:
        with init_session() as session:
            res = self._delete(id, session)
            session.commit()
            return res is not None

    async def asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[OrderSchema]:
        db_models = await self._asave_many(objs, session)
        await session.commit()
        return [OrderSchema.model_validate(item, from_attributes=True) for item in db_models]

    def save_many(self, objs: Iterable[BaseModel]) -> List[OrderSchema]:
        with init_session() as session:
            db_models = self._save_many(objs, session)
            session.commit()
            return [OrderSchema.model_validate(item, from_attributes=True) for item in db_models]

    def _save(self, obj: BaseModel, session) -> Order:
        dump = obj.model_dump(exclude={'id'}, exclude_unset=True)
        db_model = Order(**dump)
        session.add(db_model)
        session.flush()
        return db_model

    def _update(self, obj: BaseModel, session, consider_all: bool = False) -> Optional[Order]:
        if not getattr(obj, 'id', None):
             return None
        dump = obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)
        stmt = sa_update(Order).where(Order.id == obj.id).values(**dump).returning(Order)
        res = session.execute(stmt)
        return res.scalar_one_or_none()

    def _delete(self, id: int, session) -> Optional[Order]:
        result = session.execute(sa_delete(Order).where(Order.id == id).returning(Order))
        return result.scalar_one_or_none()

    def _save_many(self, objs: Iterable[BaseModel], session) -> List[Order]:
        db_models = []
        for obj in objs:
            db_models.append(self._save(obj, session))
        return db_models

    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[Order]:
        db_models = []
        for obj in objs:
            db_models.append(await self._asave(obj, session))
        return db_models

    async def _asave(self, obj: BaseModel, session: AsyncSession) -> Order:
        dump = obj.model_dump(exclude={'id'}, exclude_unset=True)
        db_model = Order(**dump)
        session.add(db_model)
        await session.flush()
        return db_model

    async def _aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[Order]:
        if getattr(obj, "id", None) is None:
            raise ValueError("id cannot be None")
        dump = obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)
        result = await session.execute(sa_update(Order).where(Order.id == obj.id).values(dump).returning(Order))
        await session.flush()
        return result.scalar_one_or_none()

    async def _adelete(self, id: int, session: AsyncSession) -> Optional[Order]:
        result = await session.execute(sa_delete(Order).where(Order.id == id).returning(Order))
        await session.flush()
        return result.scalar_one_or_none()
