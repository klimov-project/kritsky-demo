from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from api.src.auth.utils import AuthenticatedAdmin, get_current_admin
from db.src.connect import ainit_session
from db.src.models import Book, Order, OrderItem, Payment, SavedVariant, Subscription, User, VariantExport
from api.src.variants.schemas import SavedVariantResponse, SavedVariantPayload
from api.src.variants.utils import _to_dto
from core.src.repos import DbUsersRepo, DbOrdersRepo, DbPaymentsRepo

from .schemas import (
    AdminUserResponse,
    AdminUsersListResponse,
    AdminPaymentResponse,
    AdminPaymentsListResponse,
    AdminOrderResponse,
    AdminOrdersListResponse,
    AdminDashboardResponse,
    AdminUserSavedVariantResponse,
    AdminUserOrderItemResponse,
    AdminUserOrderResponse,
    AdminUserExportResponse,
    AdminUserDetailResponse,
    AdminBlockUserRequest,
    AdminSubscriptionRequest,
    AdminDownloadCreditsRequest,
)
from .utils import (
    _status_from_subscription,
    _normalize_payment_status,
    _normalize_order_status,
    _display_user_name,
    _format_created_at,
)


router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_dashboard(_: AuthenticatedAdmin = Depends(get_current_admin)) -> AdminDashboardResponse:
    """
    Получение агрегированных данных для дашборда администратора.
    Подсчитывает количество пользователей, генераций, заказов и общую выручку.
    
    Args:
        _: Проверка прав администратора.
        
    Returns:
        AdminDashboardResponse: Статистические данные по проекту.
    """
    now = datetime.now(timezone.utc)

    async with ainit_session() as session:
        users_count = await DbUsersRepo().acount(session)
        
        subscriptions_count_result = await session.execute(
            select(func.count(Subscription.id)).where(Subscription.dateOfExpire.is_not(None), Subscription.dateOfExpire >= now)
        )
        subscriptions_count = int(subscriptions_count_result.scalar_one() or 0)

        # TODO: Move SavedVariant to repo
        generated_variants_result = await session.execute(select(func.count(SavedVariant.id)))
        generated_variants_count = int(generated_variants_result.scalar_one() or 0)

        total_earned = await DbPaymentsRepo().get_total_earned(session)
        orders_count = await DbOrdersRepo().acount(session)
        payments_count = await DbPaymentsRepo().acount(session)

        return AdminDashboardResponse(
            subscriptionsCount=subscriptions_count,
            usersCount=users_count,
            generatedVariantsCount=generated_variants_count,
            downloadedVariantsCount=0,
            totalEarned=total_earned,
            ordersCount=orders_count,
            paymentsCount=payments_count,
        )


@router.get("/users", response_model=AdminUsersListResponse)
async def list_users(_: AuthenticatedAdmin = Depends(get_current_admin)) -> AdminUsersListResponse:
    """
    Получение списка всех пользователей с их краткой статистикой.
    Рассчитывает количество генераций и скачиваний за текущую неделю.
    
    Args:
        _: Проверка прав администратора.
        
    Returns:
        AdminUsersListResponse: Список пользователей с агрегированной статистикой.
    """
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)

    async with ainit_session() as session:
        week_start = now - timedelta(days=7)
        results = await DbUsersRepo().alist_with_stats(session, week_start)

        if not results:
            return AdminUsersListResponse(items=[])

        payload = []
        for r in results:
            user = r["user"]
            payload.append(
                AdminUserResponse(
                    id=user.id,
                    name=_display_user_name(user, user.id),
                    email=user.email or "",
                    phone=user.phone or "",
                    registrationDate=_format_created_at(user, "%Y-%m-%d"),
                    subscriptionStatus=_status_from_subscription(r["expires_at"], now),
                    variantsGeneratedTotal=user.variantsGeneratedTotal or r["variants_total"],
                    downloadsTotal=user.downloadsTotal,
                    weeklyGenerated=r["variants_week"],
                    weeklyDownloaded=r["downloads_week"],
                    isBlocked=getattr(user, "is_blocked", False),
                )
            )

        return AdminUsersListResponse(items=payload)


@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
async def get_user_detail(user_id: int, _: AuthenticatedAdmin = Depends(get_current_admin)) -> AdminUserDetailResponse:
    """
    Получение детальной информации о конкретном пользователе.
    Загружает историю генераций, экспортов и заказов пользователя.
    
    Args:
        user_id (int): ID пользователя.
        _: Проверка прав администратора.
        
    Returns:
        AdminUserDetailResponse: Полное досье пользователя с историей активности.
    """
    now = datetime.now(timezone.utc)
    async with ainit_session() as session:
        user = await DbUsersRepo().aget_detail(user_id, session)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        subs_query = await session.execute(
            select(Subscription.dateOfExpire)
            .where(Subscription.userId == user_id)
            .order_by(Subscription.dateOfExpire.desc())
            .limit(1)
        )
        expire_date = subs_query.scalar_one_or_none()

        variants_payload = []
        for v in user.saved_variants:
            vp = v.variant_payload or {}
            work = vp.get("work", {})
            poem = vp.get("poem", {})
            variants_payload.append(AdminUserSavedVariantResponse(
                id=v.id,
                date=_format_created_at(v, "%Y-%m-%d %H:%M"),
                excerptTitle=f"{work.get('author', '')} — {work.get('title', '')}",
                poemTitle=poem.get("title", "Нет стихотворения"),
            ))

        orders_payload = []
        for order in (user.orders or []):
            items_payload = []
            for item in (order.items or []):
                col_config = None
                dl_config = None
                if item.book:
                    col_config = item.book.collection_config if isinstance(item.book.collection_config, dict) else None
                    dl_config = item.book.download_pack_config if isinstance(item.book.download_pack_config, dict) else None
                items_payload.append(AdminUserOrderItemResponse(
                    id=item.id,
                    title=item.title or "",
                    category=item.category,
                    quantity=item.quantity or 1,
                    unitPrice=float(item.unit_price or 0),
                    collectionConfig=col_config,
                    downloadPackConfig=dl_config,
                ))
            orders_payload.append(AdminUserOrderResponse(
                id=order.id,
                date=_format_created_at(order, "%Y-%m-%d %H:%M"),
                status=order.status or "",
                totalAmount=float(order.total_amount or 0),
                items=items_payload,
            ))

        exports_payload = []
        for exp in sorted((user.variant_exports or []), key=lambda e: getattr(e, 'createdAt', None) or datetime.min, reverse=True):
            sv = exp.saved_variant
            vp = (sv.variant_payload or {}) if sv else {}
            work = vp.get("work", {})
            poem = vp.get("poem", {})
            exports_payload.append(AdminUserExportResponse(
                id=exp.id,
                date=_format_created_at(exp, "%Y-%m-%d %H:%M"),
                action=exp.action or "download",
                savedVariantId=exp.saved_variant_id,
                excerptTitle=f"{work.get('author', '')} — {work.get('title', '')}" if sv else "—",
                poemTitle=poem.get("title", "—") if sv else "—",
            ))

        return AdminUserDetailResponse(
            id=user.id,
            name=_display_user_name(user, user.id),
            email=user.email or "",
            phone=user.phone or "",
            registrationDate=_format_created_at(user, "%Y-%m-%d"),
            subscriptionStatus=_status_from_subscription(expire_date, now),
            subscriptionExpireDate=expire_date.strftime("%Y-%m-%d") if expire_date else None,
            variantsGeneratedTotal=user.variantsGeneratedTotal or len(user.saved_variants),
            downloadsTotal=user.downloadsTotal,
            paidDownloadCredits=user.paid_download_credits or 0,
            isBlocked=getattr(user, "is_blocked", False),
            savedVariants=variants_payload,
            variantExports=exports_payload,
            orders=orders_payload,
        )


@router.post("/users/{user_id}/block")
async def block_unblock_user(user_id: int, request: AdminBlockUserRequest, _: AuthenticatedAdmin = Depends(get_current_admin)) -> dict:
    async with ainit_session() as session:
        upd = AdminUserResponse.__pydantic_model__.construct(id=user_id, is_blocked=request.block)
        user = await DbUsersRepo().aupdate(upd, session=session)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok", "isBlocked": request.block}


@router.post("/users/{user_id}/subscription/activate")
async def admin_activate_subscription(user_id: int, request: AdminSubscriptionRequest, _: AuthenticatedAdmin = Depends(get_current_admin)) -> dict:
    now = datetime.now(timezone.utc)
    async with ainit_session() as session:
        user = await DbUsersRepo().aget(user_id, session)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.isPro = True
        new_expire = now + timedelta(days=request.days)
        
        session.add(Subscription(userId=user.id, dateOfExpire=new_expire))
        await session.commit()
    return {"status": "ok", "expireDate": new_expire.strftime("%Y-%m-%d")}


@router.post("/users/{user_id}/subscription/deactivate")
async def admin_deactivate_subscription(user_id: int, _: AuthenticatedAdmin = Depends(get_current_admin)) -> dict:
    async with ainit_session() as session:
        user = await DbUsersRepo().aget(user_id, session)
        if not user: raise HTTPException(status_code=404, detail="User not found")
        
        user.isPro = False; now = datetime.now(timezone.utc)
        subs = await session.execute(select(Subscription).where(Subscription.userId == user.id))
        for sub in subs.scalars().all():
            if sub.dateOfExpire and sub.dateOfExpire > now: sub.dateOfExpire = now
        await session.commit()
    return {"status": "ok"}


@router.post("/users/{user_id}/download-credits")
async def admin_set_download_credits(user_id: int, request: AdminDownloadCreditsRequest, _: AuthenticatedAdmin = Depends(get_current_admin)) -> dict:
    async with ainit_session() as session:
        user = await DbUsersRepo().aget(user_id, session)
        if not user: raise HTTPException(status_code=404, detail="User not found")
        user.paid_download_credits = max(0, request.credits)
        await session.commit()
    return {"status": "ok", "paidDownloadCredits": max(0, request.credits)}


@router.get("/payments", response_model=AdminPaymentsListResponse)
async def list_payments(_: AuthenticatedAdmin = Depends(get_current_admin)) -> AdminPaymentsListResponse:
    async with ainit_session() as session:
        payments = await DbPaymentsRepo().alist_with_user(session)

        payload = []
        for payment in payments:
            payload.append(
                AdminPaymentResponse(
                    id=payment.paymentId or f"pay_{payment.id}",
                    userId=payment.userId,
                    userName=_display_user_name(payment.user, payment.userId),
                    amount=float(payment.amount or 0),
                    status=_normalize_payment_status(payment.paymentStatus),
                    date=_format_created_at(payment, "%Y-%m-%d %H:%M"),
                    method=(payment.method or "Mock").strip() or "Mock",
                )
            )

        return AdminPaymentsListResponse(items=payload)


@router.get("/orders", response_model=AdminOrdersListResponse)
async def list_orders(_: AuthenticatedAdmin = Depends(get_current_admin)) -> AdminOrdersListResponse:
    async with ainit_session() as session:
        orders = await DbOrdersRepo().alist_with_relations(session)

        payload = []
        for order in orders:
            order_items = ", ".join(item.title for item in order.items)
            payload.append(
                AdminOrderResponse(
                    id=f"ord_{order.id}",
                    userName=_display_user_name(order.user, order.user_id),
                    items=order_items,
                    total=float(order.total_amount or 0),
                    status=_normalize_order_status(order.status),
                    date=_format_created_at(order, "%Y-%m-%d"),
                )
            )

        return AdminOrdersListResponse(items=payload)


@router.get("/variants/{variant_id}", response_model=SavedVariantResponse)
async def admin_get_saved_variant(variant_id: int, _: AuthenticatedAdmin = Depends(get_current_admin)) -> SavedVariantResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant).where(SavedVariant.id == variant_id)
        )
        item = query.scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=404, detail="Saved variant not found")
        return _to_dto(item)


@router.put("/variants/{variant_id}", response_model=SavedVariantResponse)
async def admin_update_saved_variant(
    variant_id: int,
    payload: SavedVariantPayload,
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> SavedVariantResponse:
    async with ainit_session() as session:
        query = await session.execute(
            select(SavedVariant).where(SavedVariant.id == variant_id)
        )
        item = query.scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=404, detail="Saved variant not found")
        
        item.variant_payload = payload.variant
        item.settings_payload = payload.settings
        
        await session.commit()
        await session.refresh(item)
        return _to_dto(item)
