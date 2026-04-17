from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import selectinload

from db.src.connect import ainit_session
from db.src.enums import ProductCategoryEnum, ProductFulfillmentEnum
from db.src.models import (
    Book,
    CartItem,
    FavoriteBook,
    KnowledgeBaseState,
    Order,
    OrderItem,
    Payment,
    User,
)
from core.src.repos import (
    DbBooksRepo,
    DbFavoritesRepo,
    DbCartRepo,
    DbOrdersRepo,
    DbPaymentsRepo,
    DbUsersRepo,
)

from api.src.auth.utils import AuthenticatedAdmin, AuthenticatedUser, get_current_admin, get_current_user

from .schemas import (
    ShopBook,
    ShopBookListResponse,
    ShopBookPayload,
    FavoriteBooksListResponse,
    CartResponse,
    CartItemPayload,
    CartItemQuantityPayload,
    CheckoutPayload,
    CheckoutResponse,
    PurchasedItemsListResponse,
    PurchasedItemResponse,
    PaymentHistoryListResponse,
    PaymentHistoryItemResponse,
)
from .utils import (
    _parse_category,
    _parse_fulfillment,
    _book_to_dto,
    _load_book_with_relations,
    _apply_book_payload,
    _favorite_to_dto,
    _cart_item_to_dto,
    _normalize_delivery_type,
    _delivery_cost,
    _generate_full_variant_collection_payload,
    _generate_collection_payload,
    _map_media_name,
    _order_item_to_purchase_dto,
    _resolve_payment_kind,
    _normalize_collection_config,
    _normalize_download_pack_config,
    _is_complete_collection_payload,
)


router = APIRouter(prefix="/api/shop", tags=["shop"])


@router.get("/books", response_model=ShopBookListResponse)
async def list_books(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    fulfillment: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ShopBookListResponse:
    async with ainit_session() as session:
        books, total = await DbBooksRepo().alist_with_total(
            session, 
            limit=limit, 
            offset=offset, 
            search=search, 
            category=category, 
            fulfillment=fulfillment
        )

        return ShopBookListResponse(
            items=[_book_to_dto(book) for book in books],
            total=total,
            limit=limit,
            offset=offset,
        )


@router.get("/books/{book_id}", response_model=ShopBook)
async def get_book(book_id: int) -> ShopBook:
    async with ainit_session() as session:
        book = await DbBooksRepo().aget(book_id, session)
        if book is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        return _book_to_dto(book)


@router.post("/books", response_model=ShopBook)
async def create_book(payload: ShopBookPayload, _: AuthenticatedAdmin = Depends(get_current_admin)) -> ShopBook:
    async with ainit_session() as session:
        book = Book(title=payload.title.strip(), author=payload.author.strip())
        await DbBooksRepo().aapply_shop_payload(book, payload, session)
        await session.commit()
        reloaded = await DbBooksRepo().aget(book.id, session)
        if reloaded is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        return _book_to_dto(reloaded)


@router.put("/books/{book_id}", response_model=ShopBook)
async def update_book(book_id: int, payload: ShopBookPayload, _: AuthenticatedAdmin = Depends(get_current_admin)) -> ShopBook:
    async with ainit_session() as session:
        book = await DbBooksRepo().aget(book_id, session)
        if book is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        await DbBooksRepo().aapply_shop_payload(book, payload, session)
        await session.commit()
        reloaded = await DbBooksRepo().aget(book_id, session)
        if reloaded is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        return _book_to_dto(reloaded)


@router.delete("/books/{book_id}")
async def delete_book(book_id: int, _: AuthenticatedAdmin = Depends(get_current_admin)) -> dict[str, Any]:
    async with ainit_session() as session:
        deleted = await DbBooksRepo().adelete(book_id, session)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        await session.commit()
        return {"ok": True}


@router.get("/favorites", response_model=FavoriteBooksListResponse)
async def list_favorites(auth: AuthenticatedUser = Depends(get_current_user)) -> FavoriteBooksListResponse:
    async with ainit_session() as session:
        items = await DbFavoritesRepo().aget_user_favorites_models(auth.user.id, session)
        return FavoriteBooksListResponse(items=[_favorite_to_dto(item) for item in items])


@router.post("/favorites/{book_id}")
async def add_favorite(book_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> dict[str, Any]:
    async with ainit_session() as session:
        book = await DbBooksRepo().aget(book_id, session)
        if book is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        created = await DbFavoritesRepo().add_to_favorites(auth.user.id, book_id, session)
        return {"ok": True, "created": created}


@router.delete("/favorites/{book_id}")
async def remove_favorite(book_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> dict[str, Any]:
    async with ainit_session() as session:
        deleted = await DbFavoritesRepo().remove_from_favorites(auth.user.id, book_id, session)
        return {"ok": True, "deleted": deleted}


@router.get("/cart", response_model=CartResponse)
async def get_cart(auth: AuthenticatedUser = Depends(get_current_user)) -> CartResponse:
    async with ainit_session() as session:
        cart_items = await DbCartRepo().aget_user_cart_models(auth.user.id, session)
        items = [_cart_item_to_dto(item) for item in cart_items]
        return CartResponse(items=items, itemsCount=sum(item.quantity for item in items), totalAmount=sum(item.lineTotal for item in items))


@router.post("/cart", response_model=CartResponse)
async def add_to_cart(payload: CartItemPayload, auth: AuthenticatedUser = Depends(get_current_user)) -> CartResponse:
    async with ainit_session() as session:
        book = await DbBooksRepo().aget(payload.bookId, session)
        if book is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        
        await DbCartRepo().add_item(auth.user.id, payload.bookId, payload.quantity, session)
        await session.commit()
    return await get_cart(auth)


@router.patch("/cart/{book_id}", response_model=CartResponse)
async def update_cart_item_quantity(book_id: int, payload: CartItemQuantityPayload, auth: AuthenticatedUser = Depends(get_current_user)) -> CartResponse:
    async with ainit_session() as session:
        updated = await DbCartRepo().update_quantity(auth.user.id, book_id, payload.quantity, session)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        await session.commit()
    return await get_cart(auth)


@router.delete("/cart/{book_id}", response_model=CartResponse)
async def remove_from_cart(book_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> CartResponse:
    async with ainit_session() as session:
        await DbCartRepo().remove_from_cart(auth.user.id, book_id, session)
    return await get_cart(auth)


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(payload: CheckoutPayload, auth: AuthenticatedUser = Depends(get_current_user)) -> CheckoutResponse:
    delivery_type = _normalize_delivery_type(payload.deliveryType)
    async with ainit_session() as session:
        cart_items = await DbCartRepo().aget_user_cart_models(auth.user.id, session)
        if not cart_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        if not any(item.book is not None and item.book.fulfillment_type == ProductFulfillmentEnum.PHYSICAL for item in cart_items):
            delivery_type = "without_delivery"
        if delivery_type == "with_delivery" and not (payload.deliveryAddress or "").strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Delivery address is required")

        knowledge_base_state = await session.get(KnowledgeBaseState, 1)
        knowledge_base_payload = knowledge_base_state.payload if knowledge_base_state and isinstance(knowledge_base_state.payload, dict) else {"works": []}

        subtotal_amount = sum(float(item.book.price) * item.quantity for item in cart_items if item.book is None is False)
        delivery_amount = _delivery_cost(delivery_type)
        total_amount = subtotal_amount + delivery_amount

        order = Order(user_id=auth.user.id, status="Paid", payment_status="Success", payment_method=(payload.paymentMethod or "Mock").strip() or "Mock", delivery_type=delivery_type, delivery_address=(payload.deliveryAddress or "").strip() or None if delivery_type == "with_delivery" else None, recipient_name=(payload.recipientName or "").strip() or None, recipient_phone=(payload.recipientPhone or "").strip() or None, subtotal_amount=subtotal_amount, delivery_amount=delivery_amount, total_amount=total_amount)
        DbOrdersRepo()._save(order, session)

        for item in cart_items:
            if item.book is None: continue
            unit_price = float(item.book.price); line_total = unit_price * item.quantity
            order_item_payload = None
            if item.book.category == ProductCategoryEnum.COLLECTIONS:
                collection_config = item.book.collection_config if isinstance(item.book.collection_config, dict) else None
                if collection_config is None: raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Сборник \"{item.book.title}\" настроен некорректно.")
                order_item_payload = _generate_full_variant_collection_payload(knowledge_base_payload, collection_config, item.quantity) if collection_config.get("collectionKind") == "full_variant" else _generate_collection_payload(knowledge_base_payload, collection_config, item.quantity)
            elif item.book.category == ProductCategoryEnum.DOWNLOAD_PACKS:
                download_pack_config = _normalize_download_pack_config(item.book.download_pack_config)
                if download_pack_config is None: raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Пакет скачиваний \"{item.book.title}\" настроен некорректно.")
                db_user = await DbUsersRepo().aget(auth.user.id, session)
                credited_downloads = int(download_pack_config["downloadsCount"]) * item.quantity; db_user.paid_download_credits = int(db_user.paid_download_credits or 0) + credited_downloads
                DbUsersRepo()._save(db_user, session); order_item_payload = {"kind": "download_pack", "downloadsCount": int(download_pack_config["downloadsCount"]), "creditedDownloads": credited_downloads}
            DbOrdersRepo()._save_many([OrderItem(order_id=order.id, book_id=item.book.id, title=item.book.title, author=item.book.author, category=item.book.category.value, fulfillment_type=item.book.fulfillment_type.value, cover_name=_map_media_name(item.book.cover), quantity=item.quantity, unit_price=unit_price, line_total=line_total, payload=order_item_payload)], session)

        payment_id = f"mock_{uuid.uuid4().hex[:12]}"
        DbPaymentsRepo()._save(Payment(userId=auth.user.id, paymentId=payment_id, paymentStatus="Success", amount=total_amount, method=(payload.paymentMethod or "Mock").strip() or "Mock", order_id=order.id), session)
        for item in cart_items: await DbCartRepo().adelete(item.id, session)
        await session.commit()
        return CheckoutResponse(orderId=order.id, paymentId=payment_id, status="paid", totalAmount=total_amount, deliveryAmount=delivery_amount)


@router.get("/purchases", response_model=PurchasedItemsListResponse)
async def list_purchases(auth: AuthenticatedUser = Depends(get_current_user)) -> PurchasedItemsListResponse:
    async with ainit_session() as session:
        items = await DbOrdersRepo().aget_user_purchases(auth.user.id, session)
        return PurchasedItemsListResponse(items=[_order_item_to_purchase_dto(item, include_payload=False) for item in items])


@router.get("/payments/history", response_model=PaymentHistoryListResponse)
async def list_payment_history(auth: AuthenticatedUser = Depends(get_current_user)) -> PaymentHistoryListResponse:
    async with ainit_session() as session:
        payments = await DbPaymentsRepo().aget_user_payment_history(auth.user.id, session)
        return PaymentHistoryListResponse(items=[PaymentHistoryItemResponse(id=payment.id, paymentId=payment.paymentId, orderId=payment.order_id, amount=float(payment.amount or 0), status=payment.paymentStatus, method=payment.method, kind=_resolve_payment_kind(payment), createdAt=payment.createdAt or datetime.utcnow()) for payment in payments])


@router.get("/purchases/{purchase_id}", response_model=PurchasedItemResponse)
async def get_purchase(purchase_id: int, auth: AuthenticatedUser = Depends(get_current_user)) -> PurchasedItemResponse:
    async with ainit_session() as session:
        item = await DbOrdersRepo().aget_user_purchase(purchase_id, auth.user.id, session)
        if item is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
        if item.book is not None and item.category == ProductCategoryEnum.COLLECTIONS.value and not _is_complete_collection_payload(item.payload):
            kb_state = await session.get(KnowledgeBaseState, 1); kb_payload = kb_state.payload if kb_state and isinstance(kb_state.payload, dict) else {"works": []}
            try: item.payload = _generate_collection_payload(kb_payload, _normalize_collection_config(item.book.collection_config), item.quantity)
            except HTTPException: pass
            else: DbOrdersRepo()._save(item, session); await session.commit(); await session.refresh(item)
        return _order_item_to_purchase_dto(item)
