from typing import Iterable, List

from db.src.connect import asession_factory, AsyncSession
from pydantic import BaseModel
from sqlalchemy import delete, update


class DbMixin:
    @asession_factory
    async def adelete(self, id: int, *, session: AsyncSession | None = None) -> bool:
        db_model = await self._adelete(id, session)
        await session.commit()
        return await self.apost_delete(id, db_model)

    @asession_factory
    async def aupdate(self, obj: BaseModel, consider_all: bool = False, *, session: AsyncSession | None = None) -> BaseModel | None:
        db_model = await self._aupdate(obj=obj, consider_all=consider_all, session=session)
        await session.commit()
        if db_model is None:
            return None
        return await self.apost_update(obj, db_model)

    @asession_factory
    async def asave(self, obj: BaseModel, *, session: AsyncSession | None = None) -> BaseModel | None:
        db_model = await self._asave(obj, session)
        await session.commit()
        return await self.apost_save(obj, db_model)

    @asession_factory
    async def asave_many(self, objs: Iterable[BaseModel], *, session: AsyncSession | None = None) -> List[BaseModel]:
        db_models = await self._asave_many(objs, session)
        await session.commit()
        return db_models

    async def apost_save(self, obj: BaseModel, db_model):
        pass

    async def apost_update(self, obj: BaseModel, db_model):
        pass

    async def apost_delete(self, id: int, db_model) -> bool:
        return db_model is not None

    async def _adelete(self, id: int, session: AsyncSession):
        query = (
            delete(self.model)
            .where(self.model.id == id)
            .returning(self.model)
        )
        db_model = await session.execute(query)
        await session.flush()
        return db_model.scalar_one_or_none()

    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession | None = None) -> List[BaseModel]:
        db_models = []
        for obj in objs:
            db_model = await self._asave(obj, session)
            db_models.append(db_model)
        return db_models

    async def _aupdate(self, obj: BaseModel, consider_all: bool = False, session: AsyncSession | None = None):
        if obj.id is None:
            raise ValueError('id cannot be None')
        model_dump = self._get_update_model_dump(obj, consider_all)
        query = (
            update(self.model)
            .where(self.model.id == obj.id)
            .values(model_dump)
            .returning(self.model)
        )
        db_model = await session.execute(query)
        await session.flush()
        return db_model.unique().scalar_one_or_none()

    async def _asave(self, obj: BaseModel, session: AsyncSession):
        model_dump = self._get_model_dump(obj)
        db_model = self.model(**model_dump)
        session.add(db_model)
        await session.flush()
        try:
            obj.id = db_model.id
        except ValueError:
            pass  # TODO: need to log here
        return db_model

    def _get_update_model_dump(self, obj: BaseModel, consider_all: bool = False) -> dict:
        return obj.model_dump(exclude={'id'}, exclude_unset=not consider_all)

    def _get_model_dump(self, obj: BaseModel) -> dict:
        return obj.model_dump(exclude={'id'})
