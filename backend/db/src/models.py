from datetime import datetime, date
import uuid
from sqlalchemy import func

from typing import Any, Optional, List

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Text,
    DateTime,
    Date,
    Enum as SAEnum,
    ForeignKey,
    UniqueConstraint,
    Index,
    Numeric,
    JSON,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin
from .enums import (
    CurrencyEnum,
    ProductCategoryEnum,
    ProductFulfillmentEnum,
    BookAttachmentTypeEnum,
)


class User(Base, BaseMixin):
    __tablename__ = "users"

    userTgId: Mapped[Optional[str]] = mapped_column("userTgId", String(64), unique=True, index=True)
    userTgUsername: Mapped[Optional[str]] = mapped_column("userTgUsername", String(255))
    email: Mapped[Optional[str]] = mapped_column("email", String(255), unique=True, index=True)
    isEmailVerified: Mapped[bool] = mapped_column("isEmailVerified", Boolean, nullable=False, server_default="false", default=False)
    phone: Mapped[Optional[str]] = mapped_column("phone", String(255), unique=True, index=True)
    isPhoneVerified: Mapped[bool] = mapped_column("isPhoneVerified", Boolean, nullable=False, server_default="false", default=False)
    isPro: Mapped[bool] = mapped_column("isPro", Boolean, nullable=False, server_default="false", default=False)
    payments: Mapped[List["Payment"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )   

    password: Mapped[Optional[str]] = mapped_column("password", String(255), nullable=True)

    phone_verification_code: Mapped["PhoneVerificationCode"] = relationship(
        "PhoneVerificationCode", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    email_verification_code: Mapped["EmailVerificationCode"] = relationship(
        "EmailVerificationCode", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    reset_pwd_verification_code: Mapped["ResetPwdVerificationCode"] = relationship(
        "ResetPwdVerificationCode", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    email_change_verification_code: Mapped["EmailChangeVerificationCode"] = relationship(
        "EmailChangeVerificationCode", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    name: Mapped[Optional[str]] = mapped_column("name", String(255), nullable=True)
    daily_downloads_count: Mapped[int] = mapped_column("dailyDownloadsCount", Integer, default=0, server_default="0")
    last_download_date: Mapped[Optional[date]] = mapped_column("lastDownloadDate", Date, nullable=True)
    paid_download_credits: Mapped[int] = mapped_column("paidDownloadCredits", Integer, default=0, server_default="0")

    variantsGeneratedTotal: Mapped[int] = mapped_column("variantsGeneratedTotal", Integer, default=0, server_default="0")
    downloadsTotal: Mapped[int] = mapped_column("downloadsTotal", Integer, default=0, server_default="0")
    is_blocked: Mapped[bool] = mapped_column("is_blocked", Boolean, default=False, server_default="false")

    cart_items: Mapped[List["CartItem"]] = relationship(
        "CartItem", back_populates="user", cascade="all, delete-orphan"
    )
    favorites: Mapped[List["FavoriteBook"]] = relationship(
        "FavoriteBook", back_populates="user", cascade="all, delete-orphan"
    )
    saved_variants: Mapped[List["SavedVariant"]] = relationship(
        "SavedVariant", back_populates="user", cascade="all, delete-orphan"
    )
    variant_exports: Mapped[List["VariantExport"]] = relationship(
        "VariantExport", back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} tg={self.userTgId!r} pro={self.isPro}>"


class MinioObjects(Base):
    __tablename__ = 'minio_objects'

    id: Mapped[int] = mapped_column(primary_key=True)
    bucket: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    uuid: Mapped[str] = mapped_column(String(36), nullable=False, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=True
    )


class Book(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "books"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    age_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pages: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    format: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    isbn: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    category: Mapped[ProductCategoryEnum] = mapped_column(
        SAEnum(ProductCategoryEnum, name="product_category_enum"),
        nullable=False,
        server_default=ProductCategoryEnum.BOOKS.name,
    )
    fulfillment_type: Mapped[ProductFulfillmentEnum] = mapped_column(
        SAEnum(ProductFulfillmentEnum, name="product_fulfillment_enum"),
        nullable=False,
        server_default=ProductFulfillmentEnum.PHYSICAL.name,
    )
    digital_file_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("minio_objects.id", ondelete="SET NULL"),
        nullable=True,
    )
    collection_config: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    download_pack_config: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    cover_id: Mapped[Optional[int]] = mapped_column(ForeignKey("minio_objects.id", ondelete="SET NULL"))
    cover: Mapped[Optional["MinioObjects"]] = relationship("MinioObjects", foreign_keys=[cover_id])
    digital_file: Mapped[Optional["MinioObjects"]] = relationship("MinioObjects", foreign_keys=[digital_file_id])

    attachments: Mapped[List["BookAttachment"]] = relationship(
        "BookAttachment", back_populates="book", cascade="all, delete-orphan"
    )
    external_links: Mapped[List["BookExternalLink"]] = relationship(
        "BookExternalLink", back_populates="book", cascade="all, delete-orphan"
    )


class BookAttachment(Base):
    __tablename__ = "book_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    minio_object_id: Mapped[int] = mapped_column(ForeignKey("minio_objects.id", ondelete="CASCADE"), nullable=False)
    attachment_type: Mapped[BookAttachmentTypeEnum] = mapped_column(
        SAEnum(BookAttachmentTypeEnum, name="book_attachment_type_enum"),
        nullable=False,
        server_default=BookAttachmentTypeEnum.GALLERY.name,
    )

    book: Mapped["Book"] = relationship("Book", back_populates="attachments")
    minio_object: Mapped["MinioObjects"] = relationship("MinioObjects")


class BookExternalLink(Base):
    __tablename__ = "book_external_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(String(64), nullable=False)

    book: Mapped["Book"] = relationship("Book", back_populates="external_links")


class CartItem(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "cart_items"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1", default=1)

    user: Mapped["User"] = relationship("User", back_populates="cart_items")
    book: Mapped["Book"] = relationship("Book")

    __table_args__ = (
        UniqueConstraint('user_id', 'book_id', name='uq_cart_item_user_book'),
    )


class FavoriteBook(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "favorite_books"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    book: Mapped["Book"] = relationship("Book")

    __table_args__ = (
        UniqueConstraint('user_id', 'book_id', name='uq_favorite_book_user_book'),
    )


class SavedVariant(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "saved_variants"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    settings_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    user: Mapped["User"] = relationship("User", back_populates="saved_variants")
    exports: Mapped[List["VariantExport"]] = relationship("VariantExport", back_populates="saved_variant", cascade="all, delete-orphan")


class VariantExport(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "variant_exports"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    saved_variant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("saved_variants.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(32), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="variant_exports")
    saved_variant: Mapped[Optional["SavedVariant"]] = relationship("SavedVariant", back_populates="exports")


class Order(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "orders"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="Paid", default="Paid")
    payment_status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="Success", default="Success")
    payment_method: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    delivery_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        server_default="without_delivery",
        default="without_delivery",
    )
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recipient_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    recipient_phone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subtotal_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0", default=0)
    delivery_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0", default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0", default=0)

    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="order")


class OrderItem(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    fulfillment_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    cover_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1", default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0", default=0)
    line_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0", default=0)
    payload: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    book: Mapped[Optional["Book"]] = relationship("Book")


class PhoneVerificationCode(Base):
    __tablename__ = 'phone_verification_codes'

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    user: Mapped['User'] = relationship(
        'User', back_populates='phone_verification_code', uselist=False
    )


class ResetPwdVerificationCode(Base):
    __tablename__ = 'reset_pwd_codes'

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=None, nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    user: Mapped['User'] = relationship('User', back_populates='reset_pwd_verification_code', uselist=False)


class EmailVerificationCode(Base):
    __tablename__ = 'email_verification_codes'

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    uuid: Mapped[str] = mapped_column(String(36), nullable=True, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    user: Mapped['User'] = relationship(
        'User', back_populates='email_verification_code', uselist=False
    )


class EmailChangeVerificationCode(Base):
    __tablename__ = 'email_change_verification_codes'

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    uuid: Mapped[str] = mapped_column(String(36), nullable=True, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    user: Mapped['User'] = relationship(
        'User', back_populates='email_change_verification_code', uselist=False
    )


class Payment(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "payments"

    userId: Mapped[int] = mapped_column(
        "userId",
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        index=True,
        nullable=False,
    )
    paymentId: Mapped[Optional[str]] = mapped_column("paymentId", String(128), index=True)
    paymentLink: Mapped[Optional[str]] = mapped_column("paymentLink", Text)
    paymentStatus: Mapped[Optional[str]] = mapped_column("paymentStatus", String(64))
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0", default=0)
    method: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    user: Mapped["User"] = relationship(back_populates="payments", lazy="joined")
    order: Mapped[Optional["Order"]] = relationship("Order", back_populates="payments", lazy="joined")

    def __repr__(self) -> str:
        return f"<Payment id={self.id} userId={self.userId} status={self.paymentStatus!r}>"


class Subscription(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "subscriptions"

    userId: Mapped[int] = mapped_column(
        "userId",
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        index=True,
        nullable=False,
    )
    paymentId: Mapped[Optional[int]] = mapped_column(
        "paymentId",
        ForeignKey("payments.id", ondelete="SET NULL", onupdate="CASCADE"),
        index=True,
        nullable=True,
    )
    dateOfExpire: Mapped[Optional[datetime]] = mapped_column("dateOfExpire", DateTime(timezone=True), index=True)

    user: Mapped["User"] = relationship(back_populates="subscriptions", lazy="joined")
    payment: Mapped[Optional["Payment"]] = relationship(lazy="joined")

    __table_args__ = (
        Index("ix_subscriptions_userId_dateOfExpire", "userId", "dateOfExpire"),
    )

    def __repr__(self) -> str:
        return f"<Subscription id={self.id} userId={self.userId} expires={self.dateOfExpire}>"


class KnowledgeBaseState(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "knowledge_base_state"

    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
