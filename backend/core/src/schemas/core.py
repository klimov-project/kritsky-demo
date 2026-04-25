from datetime import datetime
from typing import Optional, List

from pydantic import Field, EmailStr

from .base import BaseSchema


class UserSchema(BaseSchema):
    """Схемы для пользователей."""

    id: int = Field(..., description="ID пользователя")
    userTgId: Optional[str] = Field(None, description="Telegram ID пользователя")
    userTgUsername: Optional[str] = Field(None, description="Имя пользователя в Telegram")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    isEmailVerified: bool = Field(False, description="Подтвержден ли email")
    phone: Optional[str] = Field(None, description="Номер телефона")
    isPhoneVerified: bool = Field(False, description="Подтвержден ли телефон")
    isPro: bool = Field(False, description="Является ли пользователь PRO")
    name: Optional[str] = Field(None, description="Имя пользователя")

    class Creation(BaseSchema.Creation):
        """Схема для создания пользователя."""
        userTgId: Optional[str] = Field(None, description="Telegram ID пользователя")
        userTgUsername: Optional[str] = Field(None, description="Имя пользователя в Telegram")
        email: Optional[EmailStr] = Field(None, description="Email пользователя")
        password: Optional[str] = Field(None, description="Пароль пользователя")
        isEmailVerified: bool = Field(False, description="Подтвержден ли email")
        phone: Optional[str] = Field(None, description="Номер телефона")
        isPhoneVerified: bool = Field(False, description="Подтвержден ли телефон")
        isPro: bool = Field(False, description="Флаг PRO пользователя")
        name: Optional[str] = Field(None, description="Имя пользователя")

    class PayloadCreate(BaseSchema.PayloadCreate):
        """Схема для создания пользователя через API (минимальные данные)."""
        userTgId: Optional[str] = Field(None, description="Telegram ID пользователя")
        userTgUsername: Optional[str] = Field(None, description="Имя пользователя в Telegram")
        email: Optional[EmailStr] = Field(None, description="Email пользователя")
        password: Optional[str] = Field(None, description="Пароль пользователя")
        phone: Optional[str] = Field(None, description="Номер телефона")
        name: Optional[str] = Field(None, description="Имя пользователя")

    class Update(BaseSchema.Update):
        """Схема для обновления пользователя."""
        userTgId: Optional[str] = Field(None, description="Telegram ID пользователя")
        userTgUsername: Optional[str] = Field(None, description="Имя пользователя в Telegram")
        email: Optional[EmailStr] = Field(None, description="Email пользователя")
        isEmailVerified: Optional[bool] = Field(None, description="Подтвержден ли email")
        phone: Optional[str] = Field(None, description="Номер телефона")
        isPhoneVerified: Optional[bool] = Field(None, description="Подтвержден ли телефон")
        isPro: Optional[bool] = Field(None, description="Флаг PRO пользователя")
        name: Optional[str] = Field(None, description="Имя пользователя")

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        """Схема для обновления пользователя через API."""
        userTgUsername: Optional[str] = Field(None, description="Имя пользователя в Telegram")
        email: Optional[EmailStr] = Field(None, description="Email пользователя")
        phone: Optional[str] = Field(None, description="Номер телефона")
        name: Optional[str] = Field(None, description="Имя пользователя")


class MinioObjectSchema(BaseSchema):
    """Схема для объекта Minio (файла)."""
    id: int
    bucket: str
    name: str
    uuid: str

    class Creation(BaseSchema.Creation):
        bucket: str
        name: str
        uuid: Optional[str] = None

    class PayloadCreate(BaseSchema.PayloadCreate):
        pass

    class Update(BaseSchema.Update):
        pass

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        pass


class BookExternalLinkSchema(BaseSchema):
    """Схема внешней ссылки книги."""
    id: int
    url: str
    label: str

    class Creation(BaseSchema.Creation):
        url: str
        label: str

    class PayloadCreate(BaseSchema.PayloadCreate):
        url: str
        label: str

    class Update(BaseSchema.Update):
        url: Optional[str] = None
        label: Optional[str] = None

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        url: Optional[str] = None
        label: Optional[str] = None


class BookAttachmentSchema(BaseSchema):
    """Схема дополнительного изображения товара."""
    id: int
    minio_object: Optional[MinioObjectSchema] = None
    attachment_type: str = Field("gallery", description="Тип вложения (gallery)")

    class Creation(BaseSchema.Creation):
        minio_object_id: int
        attachment_type: str = "gallery"

    class PayloadCreate(BaseSchema.PayloadCreate):
        minio_object_id: int
        attachment_type: str = "gallery"

    class Update(BaseSchema.Update):
        minio_object_id: Optional[int] = None
        attachment_type: Optional[str] = None

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        minio_object_id: Optional[int] = None
        attachment_type: Optional[str] = None


class BookSchema(BaseSchema):
    """Схема товара магазина."""
    id: int
    title: str
    author: str
    description: Optional[str]
    age_limit: Optional[int]
    year: Optional[int]
    pages: Optional[int]
    format: Optional[str]
    isbn: Optional[str]
    price: float
    tags: Optional[List[str]] = []
    category: str = Field("books", description="Категория товара")
    fulfillment_type: str = Field("physical", description="Тип товара: digital/physical")
    
    cover: Optional[MinioObjectSchema] = None
    digital_file: Optional[MinioObjectSchema] = None
    attachments: List[BookAttachmentSchema] = []
    external_links: List[BookExternalLinkSchema] = []

    class Creation(BaseSchema.Creation):
        title: str
        author: str
        description: Optional[str] = None
        age_limit: Optional[int] = None
        year: Optional[int] = None
        pages: Optional[int] = None
        format: Optional[str] = None
        isbn: Optional[str] = None
        price: float = 0
        tags: Optional[List[str]] = []
        category: str = "books"
        fulfillment_type: str = "physical"
        cover_id: Optional[int] = None
        digital_file_id: Optional[int] = None
        attachments: Optional[List[BookAttachmentSchema.Creation]] = []
        external_links: Optional[List[BookExternalLinkSchema.Creation]] = []

    class PayloadCreate(BaseSchema.PayloadCreate):
        title: str
        author: str
        description: Optional[str] = None
        age_limit: Optional[int] = None
        year: Optional[int] = None
        pages: Optional[int] = None
        format: Optional[str] = None
        isbn: Optional[str] = None
        price: float = 0
        tags: Optional[List[str]] = []
        category: str = "books"
        fulfillment_type: str = "physical"
        cover_id: Optional[int] = None
        digital_file_id: Optional[int] = None

    class Update(BaseSchema.Update):
        title: Optional[str] = None
        author: Optional[str] = None
        description: Optional[str] = None
        age_limit: Optional[int] = None
        year: Optional[int] = None
        pages: Optional[int] = None
        format: Optional[str] = None
        isbn: Optional[str] = None
        price: Optional[float] = None
        tags: Optional[List[str]] = None
        category: Optional[str] = None
        fulfillment_type: Optional[str] = None
        cover_id: Optional[int] = None
        digital_file_id: Optional[int] = None

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        title: Optional[str] = None
        author: Optional[str] = None
        description: Optional[str] = None
        age_limit: Optional[int] = None
        year: Optional[int] = None
        pages: Optional[int] = None
        format: Optional[str] = None
        isbn: Optional[str] = None
        price: Optional[float] = None
        tags: Optional[List[str]] = None
        category: Optional[str] = None
        fulfillment_type: Optional[str] = None
        cover_id: Optional[int] = None
        digital_file_id: Optional[int] = None


class CartItemSchema(BaseSchema):
    """Схема элемента корзины."""
    id: int
    user_id: int
    book_id: int
    book: Optional[BookSchema] = None

    class Creation(BaseSchema.Creation):
        user_id: int
        book_id: int

    class PayloadCreate(BaseSchema.PayloadCreate):
        book_id: int

    class Update(BaseSchema.Update):
        pass

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        pass


class FavoriteBookSchema(BaseSchema):
    """Схема избранной книги."""
    id: int
    user_id: int
    book_id: int
    book: Optional[BookSchema] = None

    class Creation(BaseSchema.Creation):
        user_id: int
        book_id: int

    class PayloadCreate(BaseSchema.PayloadCreate):
        book_id: int

    class Update(BaseSchema.Update):
        pass

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        pass

class OrderItemSchema(BaseSchema):
    """Схема элемента заказа."""
    id: int
    order_id: int
    book_id: Optional[int]
    title: str
    author: Optional[str]
    category: Optional[str]
    fulfillment_type: Optional[str]
    cover_name: Optional[str]
    quantity: int
    unit_price: float
    line_total: float
    payload: Optional[dict]

    class Creation(BaseSchema.Creation):
        order_id: int
        book_id: Optional[int]
        title: str
        author: Optional[str]
        category: Optional[str]
        fulfillment_type: Optional[str]
        cover_name: Optional[str]
        quantity: int
        unit_price: float
        line_total: float
        payload: Optional[dict]

    class PayloadCreate(BaseSchema.PayloadCreate):
        pass

    class Update(BaseSchema.Update):
        pass

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        pass

class OrderSchema(BaseSchema):
    """Схема заказа."""
    id: int
    user_id: int
    status: str
    payment_status: str
    payment_method: Optional[str]
    delivery_type: str
    delivery_address: Optional[str]
    recipient_name: Optional[str]
    recipient_phone: Optional[str]
    subtotal_amount: float
    delivery_amount: float
    total_amount: float
    items: List[OrderItemSchema] = []

    class Creation(BaseSchema.Creation):
        user_id: int
        status: str = "Paid"
        payment_status: str = "Success"
        payment_method: Optional[str] = None
        delivery_type: str = "without_delivery"
        delivery_address: Optional[str] = None
        recipient_name: Optional[str] = None
        recipient_phone: Optional[str] = None
        subtotal_amount: float = 0
        delivery_amount: float = 0
        total_amount: float = 0

    class PayloadCreate(BaseSchema.PayloadCreate):
        pass

    class Update(BaseSchema.Update):
        status: Optional[str] = None
        payment_status: Optional[str] = None
        payment_method: Optional[str] = None
        delivery_type: Optional[str] = None
        delivery_address: Optional[str] = None
        recipient_name: Optional[str] = None
        recipient_phone: Optional[str] = None
        subtotal_amount: Optional[float] = None
        delivery_amount: Optional[float] = None
        total_amount: Optional[float] = None

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        pass

class PaymentSchema(BaseSchema):
    """Схема платежа."""
    id: int
    userId: int
    paymentId: Optional[str]
    paymentLink: Optional[str]
    paymentStatus: Optional[str]
    order_id: Optional[int]
    amount: float
    method: Optional[str]

    class Creation(BaseSchema.Creation):
        userId: int
        paymentId: Optional[str] = None
        paymentLink: Optional[str] = None
        paymentStatus: Optional[str] = None
        order_id: Optional[int] = None
        amount: float = 0
        method: Optional[str] = None

    class PayloadCreate(BaseSchema.PayloadCreate):
        pass

    class Update(BaseSchema.Update):
        paymentId: Optional[str] = None
        paymentLink: Optional[str] = None
        paymentStatus: Optional[str] = None
        order_id: Optional[int] = None
        amount: Optional[float] = None
        method: Optional[str] = None

    class PayloadUpdate(BaseSchema.PayloadUpdate):
        pass
