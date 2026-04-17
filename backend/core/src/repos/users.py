from __future__ import annotations
from datetime import date, datetime

from typing import Optional, List, Iterable

from sqlalchemy.orm import selectinload
from sqlalchemy import select, delete as sa_delete, update as sa_update, insert as sa_insert, func
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from db.src.connect import init_session
from .abc import AbcDBRepository
from .mixin import DbMixin

from db.src.models import User, PhoneVerificationCode, EmailVerificationCode, ResetPwdVerificationCode
from ..schemas.core import UserSchema
from ..security import get_password_hash, verify_password


class DbUsersRepo(DbMixin, AbcDBRepository):
    """Репозиторий для работы с пользователями."""
    
    model = User

    model = User

    async def aget(self, id: int, session: AsyncSession) -> Optional[User]:
        """Получить пользователя по ID."""
        result = await session.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    def get(self, id: int) -> Optional[User]:
        """Синхронная версия получения пользователя."""
        with init_session() as session:
            result = session.execute(select(User).where(User.id == id))
            return result.scalar_one_or_none()

    async def adelete(self, id: int, session: AsyncSession) -> bool:
        """Удалить пользователя. Возвращает True если удалён."""
        db_model = await self._adelete(id, session)
        await session.commit()
        return await self.apost_delete(id, db_model)

    def delete(self, id: int) -> bool:
        """Синхронное удаление пользователя."""
        db_model = self._delete(id)
        return db_model is not None

    async def aupdate(
        self, 
        obj: BaseModel, 
        session: AsyncSession, 
        consider_all: bool = False
    ) -> Optional[UserSchema]:
        """Обновить пользователя."""
        db_model = await self._aupdate(obj=obj, consider_all=consider_all, session=session)
        await session.commit()
        if db_model is None:
            return None
        return await self.apost_update(obj, db_model)

    def update(self, obj: BaseModel, consider_all: bool = False) -> Optional[UserSchema]:
        """Синхронное обновление пользователя."""
        db_model = self._update(obj=obj, consider_all=consider_all)
        if db_model is None:
            return None
        return UserSchema.model_validate(db_model, from_attributes=True)

    async def asave(self, obj: BaseModel, session: AsyncSession) -> UserSchema:
        """Создать пользователя."""
        db_model = await self._asave(obj, session)
        await session.commit()
        return await self.apost_save(obj, db_model)

    def save(self, obj: BaseModel) -> UserSchema:
        """Синхронное создание пользователя."""
        db_model = self._save(obj)
        return UserSchema.model_validate(db_model, from_attributes=True)

    async def asave_many(
        self, 
        objs: Iterable[BaseModel], 
        session: AsyncSession
    ) -> List[UserSchema]:
        """Массовое создание пользователей (асинхронно)."""
        db_models = await self._asave_many(objs, session)
        await session.commit()
        return [UserSchema.model_validate(m, from_attributes=True) for m in db_models]

    def save_many(self, objs: Iterable[BaseModel]) -> List[UserSchema]:
        """Массовое создание пользователей (синхронно)."""
        db_models = self._save_many(objs)
        return [UserSchema.model_validate(m, from_attributes=True) for m in db_models]



    async def _adelete(self, id: int, session: AsyncSession) -> Optional[User]:
        """Приватный метод удаления (асинхронно)."""
        result = await session.execute(
            sa_delete(User).where(User.id == id).returning(User)
        )
        await session.flush()
        return result.scalar_one_or_none()

    def _delete(self, id: int) -> Optional[User]:
        """Приватный метод удаления (синхронно)."""
        with init_session() as session:
            result = session.execute(
                sa_delete(User).where(User.id == id).returning(User)
            )
            session.flush()
            deleted = result.scalar_one_or_none()
            session.commit()
            return deleted

    async def _asave(self, obj: BaseModel, session: AsyncSession) -> User:
        """Приватный метод сохранения (асинхронно)."""
        model_dump = obj.model_dump(exclude={"id"})
        db_model = User(**model_dump)
        session.add(db_model)
        await session.flush()
        try:
            obj.id = db_model.id
        except Exception:
            pass
        return db_model

    def _save(self, obj: BaseModel) -> User:
        """Приватный метод сохранения (синхронно)."""
        model_dump = obj.model_dump(exclude={"id"})
        with init_session() as session:
            db_model = User(**model_dump)
            session.add(db_model)
            session.flush()
            try:
                obj.id = db_model.id
            except Exception:
                pass
            session.commit()
            return db_model

    async def _asave_many(
        self, 
        objs: Iterable[BaseModel], 
        session: AsyncSession
    ) -> List[User]:
        """
        Массовое сохранение пользователей асинхронно с оптимизацией.
        Использует bulk insert для больших списков (>50) и обычный цикл для малых.
        
        Args:
            objs (Iterable[BaseModel]): Коллекция моделей пользователей для сохранения.
            session (AsyncSession): Сессия базы данных.
            
        Returns:
            List[User]: Список созданных объектов моделей БД.
        """
        objs_list = list(objs)
        if not objs_list:
            return []
        
        if len(objs_list) > 50:
            values = [obj.model_dump(exclude={"id"}) for obj in objs_list]
            stmt = sa_insert(User).values(values).returning(User)
            result = await session.execute(stmt)
            db_models = list(result.scalars().all())
            
            for obj, db_model in zip(objs_list, db_models):
                try:
                    obj.id = db_model.id
                except Exception:
                    pass
        else:
            db_models = []
            for obj in objs_list:
                model_dump = obj.model_dump(exclude={"id"})
                db_model = User(**model_dump)
                session.add(db_model)
                db_models.append(db_model)
            
            await session.flush()
            
            for obj, db_model in zip(objs_list, db_models):
                try:
                    obj.id = db_model.id
                except Exception:
                    pass
        
        return db_models

    def _save_many(self, objs: Iterable[BaseModel]) -> List[User]:
        """Приватный метод массового сохранения (синхронно)."""
        objs_list = list(objs)
        if not objs_list:
            return []
        
        with init_session() as session:
            db_models = []
            for obj in objs_list:
                model_dump = obj.model_dump(exclude={"id"})
                db_model = User(**model_dump)
                session.add(db_model)
                db_models.append(db_model)
            
            session.flush()
            
            for obj, db_model in zip(objs_list, db_models):
                try:
                    obj.id = db_model.id
                except Exception:
                    pass
            
            session.commit()
            return db_models

    async def _aupdate(
        self, 
        obj: BaseModel, 
        session: AsyncSession, 
        consider_all: bool = False
    ) -> Optional[User]:
        """Приватный метод обновления (асинхронно)."""
        if getattr(obj, "id", None) is None:
            raise ValueError("id cannot be None")
        
        model_dump = obj.model_dump(exclude={"id"}, exclude_unset=not consider_all)
        
        result = await session.execute(
            sa_update(User)
            .where(User.id == obj.id)
            .values(model_dump)
            .returning(User)
        )
        await session.flush()
        return result.scalar_one_or_none()

    def _update(self, obj: BaseModel, consider_all: bool = False) -> Optional[User]:
        """Приватный метод обновления (синхронно)."""
        if getattr(obj, "id", None) is None:
            raise ValueError("id cannot be None")
        
        model_dump = obj.model_dump(exclude={"id"}, exclude_unset=not consider_all)
        
        with init_session() as session:
            result = session.execute(
                sa_update(User)
                .where(User.id == obj.id)
                .values(model_dump)
                .returning(User)
            )
            session.flush()
            db_model = result.scalar_one_or_none()
            session.commit()
            return db_model



    async def aget_by_tg_id(self, user_tg_id: str, session: AsyncSession) -> Optional[User]:
        """Получить пользователя по Telegram ID."""
        result = await session.execute(select(User).where(User.userTgId == user_tg_id))
        return result.scalar_one_or_none()

    def get_by_tg_id(self, user_tg_id: str) -> Optional[User]:
        """Синхронное получение по Telegram ID."""
        with init_session() as session:
            result = session.execute(select(User).where(User.userTgId == user_tg_id))
            return result.scalar_one_or_none()

    async def aget_by_email(self, email: str, session: AsyncSession) -> Optional[User]:
        """Получить пользователя по email."""
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def aget_by_phone(self, phone: str, session: AsyncSession) -> Optional[User]:
        """Получить пользователя по телефону."""
        result = await session.execute(select(User).where(User.phone == phone))
        return result.scalar_one_or_none()

    async def aensure(
        self,
        session: AsyncSession,
        user_tg_id: Optional[str] = None,
        username: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        password: Optional[str] = None,
        make_pro_if_new: bool = False,
    ) -> UserSchema:
        """
        Обеспечивает наличие пользователя в базе данных.
        Ищет по TG ID, Email или Телефону и создает, если не найден.
        
        Args:
            session (AsyncSession): Сессия БД.
            user_tg_id (str, optional): Telegram ID.
            username (str, optional): Имя пользователя TG.
            email (str, optional): Email.
            phone (str, optional): Телефон.
            password (str, optional): Пароль (будет захеширован).
            make_pro_if_new (bool): Назначить ли PRO статус новому пользователю.
            
        Returns:
            UserSchema: Схема данных пользователя.
        """
        existing = None
        
        if user_tg_id:
            existing = await self.aget_by_tg_id(user_tg_id, session=session)
        if not existing and email:
            existing = await self.aget_by_email(email, session=session)
        if not existing and phone:
            existing = await self.aget_by_phone(phone, session=session)
        
        if existing:
            upd_data = {}
            if username and existing.userTgUsername != username:
                upd_data["userTgUsername"] = username

            if email and not existing.email:
                upd_data["email"] = email
            if phone and not existing.phone:
                upd_data["phone"] = phone
            if user_tg_id and not existing.userTgId:
                upd_data["userTgId"] = user_tg_id

            if upd_data:
                upd = UserSchema.Update(id=existing.id, **upd_data)
                return await self.aupdate(upd, consider_all=False, session=session)
            
            return UserSchema.model_validate(existing, from_attributes=True)

        hashed_password = get_password_hash(password) if password else None
        
        create = UserSchema.Creation(
            userTgId=user_tg_id,
            userTgUsername=username,
            email=email,
            phone=phone,
            password=hashed_password,
            isPro=make_pro_if_new,
        )
        return await self.asave(create, session=session)

    async def aensure_by_tg(
        self,
        user_tg_id: str,
        username: Optional[str],
        session: AsyncSession,
        make_pro_if_new: bool = False,
    ) -> UserSchema:
        """Wrapper for backward compatibility."""
        return await self.aensure(
            session=session,
            user_tg_id=user_tg_id,
            username=username,
            make_pro_if_new=make_pro_if_new
        )

    def ensure(
        self,
        user_tg_id: Optional[str] = None,
        username: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        password: Optional[str] = None,
        make_pro_if_new: bool = False,
    ) -> UserSchema:
        """
        Синхронная версия обеспечения наличия пользователя.
        
        Args:
            user_tg_id (str, optional): Telegram ID.
            username (str, optional): Имя пользователя TG.
            email (str, optional): Email.
            phone (str, optional): Телефон.
            password (str, optional): Пароль.
            make_pro_if_new (bool): Назначить ли PRO статус новому пользователю.
            
        Returns:
            UserSchema: Схема данных пользователя.
        """
        with init_session() as session:
            existing: Optional[User] = None
            
            if user_tg_id:
                existing = session.execute(select(User).where(User.userTgId == user_tg_id)).scalar_one_or_none()
            if not existing and email:
                existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if not existing and phone:
                existing = session.execute(select(User).where(User.phone == phone)).scalar_one_or_none()
            
            if existing:
                upd_data = {}
                if username and existing.userTgUsername != username:
                    upd_data["userTgUsername"] = username
                if email and not existing.email:
                    upd_data["email"] = email
                if phone and not existing.phone:
                    upd_data["phone"] = phone
                if user_tg_id and not existing.userTgId:
                    upd_data["userTgId"] = user_tg_id

                if upd_data:
                    for k, v in upd_data.items():
                        setattr(existing, k, v)
                    session.commit()
                    return UserSchema.model_validate(existing, from_attributes=True)
                
                return UserSchema.model_validate(existing, from_attributes=True)

            hashed_password = get_password_hash(password) if password else None
            create = UserSchema.Creation(
                userTgId=user_tg_id,
                userTgUsername=username,
                email=email,
                phone=phone,
                password=hashed_password,
                isPro=make_pro_if_new,
            )
            return self.save(create)

    async def aset_pro(
        self, 
        user_id: int, 
        is_pro: bool, 
        session: AsyncSession
    ) -> Optional[UserSchema]:
        """Установить PRO статус пользователя."""
        upd = UserSchema.Update(id=user_id, isPro=is_pro)
        return await self.aupdate(upd, consider_all=False, session=session)

    async def aset_name(
        self,
        user_id: int,
        name: str,
        session: AsyncSession
    ) -> Optional[UserSchema]:
        """Установить имя пользователя."""
        upd = UserSchema.Update(id=user_id, name=name)
        return await self.aupdate(upd, consider_all=False, session=session)

    async def check_and_update_downloads(self, user_id: int, session: AsyncSession) -> bool:
        """
        Проверка и обновление квоты скачиваний (20 в день).
        Сбрасывает счетчик, если наступил новый день.
        
        Args:
            user_id (int): ID пользователя.
            session (AsyncSession): Сессия БД.
            
        Returns:
            bool: True если квота позволяет скачивание, False иначе.
        """
        user = await self.aget(user_id, session)
        if not user:
            return False
            
        today = date.today()
        
        if user.last_download_date != today:
             user.daily_downloads_count = 0
             user.last_download_date = today
        
        if user.daily_downloads_count >= 20:
            session.add(user)
            await session.flush()
            return False
            
        user.daily_downloads_count += 1
        session.add(user)
        await session.flush()
        return True

    async def averify_email(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Optional[UserSchema]:
        """Подтвердить email пользователя."""
        upd = UserSchema.Update(id=user_id, isEmailVerified=True)
        return await self.aupdate(upd, consider_all=False, session=session)

    async def averify_phone(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Optional[UserSchema]:
        """Подтвердить телефон пользователя."""
        upd = UserSchema.Update(id=user_id, isPhoneVerified=True)
        return await self.aupdate(upd, consider_all=False, session=session)



    async def acheck_password(self, user_id: int, password: str, session: AsyncSession) -> bool:
        """Проверить пароль пользователя."""
        user = await self.aget(user_id, session)
        if not user or not user.password:
            return False
        return verify_password(password, user.password)

    async def acreate_email_code(self, user_id: int, code: str, session: AsyncSession) -> EmailVerificationCode:
        """Создать код подтверждения email (удаляет старые)."""
        await session.execute(sa_delete(EmailVerificationCode).where(EmailVerificationCode.user_id == user_id))
        ver_code = EmailVerificationCode(user_id=user_id, code=code)
        session.add(ver_code)
        await session.flush()
        return ver_code

    async def acheck_email_code(self, user_id: int, code: str, session: AsyncSession) -> bool:
        """
        Проверить код email. 
        ЕСЛИ код верный -> подтверждает email пользователя и удаляет код.
        """
        result = await session.execute(
            select(EmailVerificationCode).where(EmailVerificationCode.user_id == user_id)
        )
        ver_code = result.scalar_one_or_none()
        
        if ver_code and ver_code.code == code:
             await self.averify_email(user_id, session)
             await session.delete(ver_code)
             return True
        return False

    async def acreate_phone_code(self, user_id: int, code: str, session: AsyncSession) -> PhoneVerificationCode:
        """Создать код подтверждения телефона (удаляет старые)."""
        await session.execute(sa_delete(PhoneVerificationCode).where(PhoneVerificationCode.user_id == user_id))
        ver_code = PhoneVerificationCode(user_id=user_id, code=code)
        session.add(ver_code)
        await session.flush()
        return ver_code

    async def acheck_phone_code(self, user_id: int, code: str, session: AsyncSession) -> bool:
        """
        Проверить код телефона.
        ЕСЛИ код верный -> подтверждает телефон пользователя и удаляет код.
        """
        result = await session.execute(
            select(PhoneVerificationCode).where(PhoneVerificationCode.user_id == user_id)
        )
        ver_code = result.scalar_one_or_none()
        
        if ver_code and ver_code.code == code:
             await self.averify_phone(user_id, session)
             await session.delete(ver_code)
             return True
        return False



    async def alist(
        self,
        session: AsyncSession,
        *,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        is_pro: Optional[bool] = None,
        is_email_verified: Optional[bool] = None,
        is_phone_verified: Optional[bool] = None,
        order_desc: bool = True,
    ) -> List[UserSchema]:
        """
        Получение списка пользователей с фильтрацией и пагинацией.
        
        Args:
            session (AsyncSession): Сессия БД.
            limit (int): Лимит записей.
            offset (int): Смещение.
            search (str, optional): Строка поиска по полям.
            is_pro (bool, optional): Фильтр по PRO статусу.
            is_email_verified (bool, optional): Фильтр по подтвержденному email.
            is_phone_verified (bool, optional): Фильтр по подтвержденному телефону.
            order_desc (bool): Сортировка по убыванию.
            
        Returns:
            List[UserSchema]: Список схем пользователей.
        """
        query = select(User)
        
        if is_pro is not None:
            query = query.where(User.isPro == is_pro)
        if is_email_verified is not None:
            query = query.where(User.isEmailVerified == is_email_verified)
        if is_phone_verified is not None:
            query = query.where(User.isPhoneVerified == is_phone_verified)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (User.userTgId.ilike(search_pattern)) |
                (User.userTgUsername.ilike(search_pattern)) |
                (User.email.ilike(search_pattern)) |
                (User.phone.ilike(search_pattern))
            )
        
        query = query.order_by(User.id.desc() if order_desc else User.id.asc())
        query = query.limit(limit).offset(offset)

        result = await session.execute(query)
        models = result.scalars().all()
        return [UserSchema.model_validate(m, from_attributes=True) for m in models]

    def list(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        is_pro: Optional[bool] = None,
        order_desc: bool = True,
    ) -> List[UserSchema]:
        """Синхронная версия списка пользователей."""
        with init_session() as session:
            query = select(User)
            
            if is_pro is not None:
                query = query.where(User.isPro == is_pro)
            
            if search:
                search_pattern = f"%{search}%"
                query = query.where(
                    (User.userTgId.ilike(search_pattern)) |
                    (User.userTgUsername.ilike(search_pattern))
                )
            
            query = query.order_by(User.id.desc() if order_desc else User.id.asc())
            query = query.limit(limit).offset(offset)

            result = session.execute(query)
            models = result.scalars().all()
            return [UserSchema.model_validate(m, from_attributes=True) for m in models]

    async def acount(
        self,
        session: AsyncSession,
        *,
        is_pro: Optional[bool] = None,
    ) -> int:
        """Подсчитать количество пользователей."""
        query = select(func.count(User.id))
        if is_pro is not None:
            query = query.where(User.isPro == is_pro)
        
        result = await session.execute(query)
        return result.scalar_one()




    async def alist_with_stats(self, session: AsyncSession, week_start: datetime) -> List[dict]:
        from db.src.models import Subscription, SavedVariant
        
        users = (await session.execute(select(User).order_by(User.id.desc()))).scalars().all()
        if not users:
            return []
            
        user_ids = [u.id for u in users]
        
        subs_q = await session.execute(
            select(Subscription.userId, func.max(Subscription.dateOfExpire))
            .where(Subscription.userId.in_(user_ids))
            .group_by(Subscription.userId)
        )
        subs_map = {int(uid): exp for uid, exp in subs_q.all()}
        
        gen_total_q = await session.execute(
            select(SavedVariant.user_id, func.count(SavedVariant.id))
            .where(SavedVariant.user_id.in_(user_ids))
            .group_by(SavedVariant.user_id)
        )
        gen_total_map = {int(uid): int(c) for uid, c in gen_total_q.all()}
        
        gen_week_q = await session.execute(
            select(SavedVariant.user_id, func.count(SavedVariant.id))
            .where(SavedVariant.user_id.in_(user_ids), SavedVariant.createdAt >= week_start)
            .group_by(SavedVariant.user_id)
        )
        gen_week_map = {int(uid): int(c) for uid, c in gen_week_q.all()}
        
        results = []
        for u in users:
            results.append({
                "user": u,
                "expires_at": subs_map.get(u.id),
                "variants_total": gen_total_map.get(u.id, 0),
                "variants_week": gen_week_map.get(u.id, 0)
            })
        return results

    async def aget_detail(self, user_id: int, session: AsyncSession) -> Optional[User]:
        from db.src.models import Order, OrderItem, VariantExport, SavedVariant
        result = await session.execute(
            select(User).where(User.id == user_id).options(
                selectinload(User.saved_variants),
                selectinload(User.variant_exports).selectinload(VariantExport.saved_variant),
                selectinload(User.orders).selectinload(Order.items).selectinload(OrderItem.book),
            )
        )
        return result.scalar_one_or_none()

    async def apost_save(self, obj: BaseModel, db_model: User) -> UserSchema:
        """Преобразование после сохранения."""
        return UserSchema.model_validate(db_model, from_attributes=True)

    async def apost_update(self, obj: BaseModel, db_model: User) -> UserSchema:
        """Преобразование после обновления."""
        return UserSchema.model_validate(db_model, from_attributes=True)

    async def apost_delete(self, id: int, db_model: Optional[User]) -> bool:
        """Проверка после удаления."""
        return db_model is not None
