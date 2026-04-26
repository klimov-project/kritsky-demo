from __future__ import annotations
from typing import Optional, List, Iterable
from decimal import Decimal

from sqlalchemy import select, delete as sa_delete, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from db.src.connect import init_session
from db.src.models import Payment
from .abc import AbcDBRepository
from .mixin import DbMixin
from ..schemas.core import PaymentSchema

class DbPaymentsRepo(DbMixin, AbcDBRepository):
    """Репозиторий для платежей."""
    model = Payment

    async def acount(self, session: AsyncSession) -> int:
        from sqlalchemy import func
        result = await session.execute(select(func.count(self.model.id)))
        return result.scalar_one() or 0

    async def get_total_earned(self, session: AsyncSession) -> Decimal:
        from sqlalchemy import func
        result = await session.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                func.lower(func.coalesce(Payment.paymentStatus, "")) == "success"
            )
        )
        return Decimal(str(result.scalar_one() or "0"))

    async def aget(self, id: int, session: AsyncSession) -> Optional[Payment]:
        result = await session.execute(select(Payment).where(Payment.id == id))
        return result.scalar_one_or_none()

    def get(self, id: int) -> Optional[Payment]:
        with init_session() as session:
            result = session.execute(select(Payment).where(Payment.id == id))
            return result.scalar_one_or_none()

    async def asave(self, obj: BaseModel, session: AsyncSession) -> PaymentSchema:
        db_model = await self._asave(obj, session)
        await session.commit()
        return PaymentSchema.model_validate(db_model, from_attributes=True)

    def save(self, obj: BaseModel) -> PaymentSchema:
        with init_session() as session:
            db_model = self._save(obj, session)
            session.commit()
            return PaymentSchema.model_validate(db_model, from_attributes=True)

    async def aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[PaymentSchema]:
        db_model = await self._aupdate(obj, session, consider_all)
        await session.commit()
        if db_model:
            return PaymentSchema.model_validate(db_model, from_attributes=True)
        return None

    def update(self, obj: BaseModel, consider_all: bool = False) -> Optional[PaymentSchema]:
        with init_session() as session:
            db_model = self._update(obj, session, consider_all)
            session.commit()
            if db_model:
                return PaymentSchema.model_validate(db_model, from_attributes=True)
        return None


    async def aget_user_payment_history(self, user_id: int, session: AsyncSession) -> List[Payment]:
        from db.src.models import Order
        query = await session.execute(
            select(Payment)
            .options(selectinload(Payment.order).selectinload(Order.items))
            .where(Payment.userId == user_id)
            .order_by(Payment.id.desc())
        )
        return list(query.scalars().all())


    async def alist_with_user(
        self, 
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[Payment]:
        query = (
            select(Payment)
            .options(selectinload(Payment.user))
            .order_by(Payment.id.desc())
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

    async def asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[PaymentSchema]:
        db_models = await self._asave_many(objs, session)
        await session.commit()
        return [PaymentSchema.model_validate(item, from_attributes=True) for item in db_models]

    def save_many(self, objs: Iterable[BaseModel]) -> List[PaymentSchema]:
        with init_session() as session:
            db_models = self._save_many(objs, session)
            session.commit()
            return [PaymentSchema.model_validate(item, from_attributes=True) for item in db_models]

    def _save(self, obj: BaseModel, session) -> Payment:
        dump = obj.model_dump(exclude={'id'}, exclude_unset=True)
        db_model = Payment(**dump)
        session.add(db_model)
        session.flush()
        return db_model

    def _update(self, obj: BaseModel, session, consider_all: bool = False) -> Optional[Payment]:
        if not getattr(obj, 'id', None):
             return None
        dump = obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)
        stmt = sa_update(Payment).where(Payment.id == obj.id).values(**dump).returning(Payment)
        res = session.execute(stmt)
        return res.scalar_one_or_none()

    def _delete(self, id: int, session) -> Optional[Payment]:
        result = session.execute(sa_delete(Payment).where(Payment.id == id).returning(Payment))
        return result.scalar_one_or_none()

    def _save_many(self, objs: Iterable[BaseModel], session) -> List[Payment]:
        db_models = []
        for obj in objs:
            db_models.append(self._save(obj, session))
        return db_models

    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[Payment]:
        db_models = []
        for obj in objs:
            db_models.append(await self._asave(obj, session))
        return db_models

    async def _asave(self, obj: BaseModel, session: AsyncSession) -> Payment:
        dump = obj.model_dump(exclude={'id'}, exclude_unset=True)
        db_model = Payment(**dump)
        session.add(db_model)
        await session.flush()
        return db_model

    async def _aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Optional[Payment]:
        if getattr(obj, "id", None) is None:
            raise ValueError("id cannot be None")
        dump = obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)
        result = await session.execute(sa_update(Payment).where(Payment.id == obj.id).values(dump).returning(Payment))
        await session.flush()
        return result.scalar_one_or_none()

    async def _adelete(self, id: int, session: AsyncSession) -> Optional[Payment]:
        result = await session.execute(sa_delete(Payment).where(Payment.id == id).returning(Payment))
        await session.flush()
        return result.scalar_one_or_none()
