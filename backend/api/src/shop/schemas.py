from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MarketplaceLink(BaseModel):
    label: str
    url: str


class CollectionConfig(BaseModel):
    authorId: str = ""
    authorName: str = ""
    variantsCount: int = Field(default=1, ge=1, le=100)
    collectionKind: str = "author_1_5"


class DownloadPackConfig(BaseModel):
    downloadsCount: int = Field(default=1, ge=1, le=10000)


class ShopBook(BaseModel):
    id: int
    title: str
    description: str | None = None
    author: str
    price: float
    category: str
    fulfillment: str
    format: str | None = None
    ageLimit: str | None = None
    year: int | None = None
    pages: int | None = None
    isbn: str | None = None
    tags: list[str] = Field(default_factory=list)
    coverUrl: str | None = None
    gallery: list[str] = Field(default_factory=list)
    digitalFileName: str | None = None
    marketplaces: list[MarketplaceLink] = Field(default_factory=list)
    collectionConfig: CollectionConfig | None = None
    downloadPackConfig: DownloadPackConfig | None = None


class ShopBookListResponse(BaseModel):
    items: list[ShopBook]
    total: int
    limit: int
    offset: int


class ShopBookPayload(BaseModel):
    title: str
    description: str | None = None
    author: str
    price: float = 0
    category: str = "books"
    fulfillment: str = "PHYSICAL"
    format: str | None = None
    ageLimit: str | None = None
    year: int | None = None
    pages: int | None = None
    isbn: str | None = None
    tags: list[str] = Field(default_factory=list)
    coverUrl: str | None = None
    gallery: list[str] = Field(default_factory=list)
    digitalFileName: str | None = None
    marketplaces: list[MarketplaceLink] = Field(default_factory=list)
    collectionConfig: CollectionConfig | None = None
    downloadPackConfig: DownloadPackConfig | None = None


class FavoriteBookResponse(BaseModel):
    id: int
    bookId: int
    book: ShopBook


class FavoriteBooksListResponse(BaseModel):
    items: list[FavoriteBookResponse]


class CartItemPayload(BaseModel):
    bookId: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemQuantityPayload(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartItemResponse(BaseModel):
    id: int
    bookId: int
    quantity: int
    lineTotal: float
    book: ShopBook


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    itemsCount: int
    totalAmount: float


class CheckoutPayload(BaseModel):
    deliveryType: str = "without_delivery"
    deliveryAddress: str | None = None
    recipientName: str | None = None
    recipientPhone: str | None = None
    paymentMethod: str | None = "Mock"


class CheckoutResponse(BaseModel):
    orderId: int
    paymentId: str
    status: str
    totalAmount: float
    deliveryAmount: float


class PurchasedItemResponse(BaseModel):
    id: int
    orderId: int
    title: str
    description: str | None = None
    author: str | None = None
    category: str
    fulfillment: str
    purchasedAt: datetime
    price: float
    quantity: int
    total: float
    coverUrl: str | None = None
    digitalFileName: str | None = None
    bookId: int | None = None
    collectionConfig: CollectionConfig | None = None
    downloadPackConfig: DownloadPackConfig | None = None
    generatedCollection: dict[str, Any] | None = None


class PurchasedItemsListResponse(BaseModel):
    items: list[PurchasedItemResponse]


class PaymentHistoryItemResponse(BaseModel):
    id: int
    paymentId: str | None = None
    orderId: int | None = None
    amount: float
    status: str | None = None
    method: str | None = None
    kind: str
    createdAt: datetime


class PaymentHistoryListResponse(BaseModel):
    items: list[PaymentHistoryItemResponse]
