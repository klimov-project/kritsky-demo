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
    Table,
    Column,
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


saved_variant_folders = Table(
    "saved_variant_folders",
    Base.metadata,
    Column("variant_id", ForeignKey("saved_variants.id", ondelete="CASCADE"), primary_key=True),
    Column("folder_id", ForeignKey("variant_folders.id", ondelete="CASCADE"), primary_key=True),
)


class VariantFolder(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "variant_folders"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship("User")
    variants: Mapped[List["SavedVariant"]] = relationship("SavedVariant", secondary=saved_variant_folders, back_populates="folders")


class SavedVariant(Base, BaseMixin, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "saved_variants"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    settings_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    share_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    is_shared: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false", default=False)

    user: Mapped["User"] = relationship("User", back_populates="saved_variants")
    folders: Mapped[List["VariantFolder"]] = relationship("VariantFolder", secondary=saved_variant_folders, back_populates="variants")
    exports: Mapped[List["VariantExport"]] = relationship("VariantExport", back_populates="saved_variant", cascade="all, delete-orphan")
    tasks: Mapped[List["SavedVariantTask"]] = relationship("SavedVariantTask", back_populates="saved_variant", cascade="all, delete-orphan")


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
    tasks: Mapped[List["OrderItemTask"]] = relationship("OrderItemTask", back_populates="order_item", cascade="all, delete-orphan")


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


class KbSetting(Base, CreatedAtMixin, UpdatedAtMixin):
    __tablename__ = "kb_settings"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)


# ---------------------------------------------------------------------------
# Versioned Knowledge Base tables
# ---------------------------------------------------------------------------


class KbAuthor(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "kb_authors"

    external_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class KbWork(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "kb_works"

    external_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    work_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    author_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kb_authors.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    age18: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false", default=False)
    internal_tags: Mapped[str] = mapped_column(Text, nullable=False, server_default="", default="")
    external_tags: Mapped[str] = mapped_column(Text, nullable=False, server_default="", default="")

    author: Mapped[Optional["KbAuthor"]] = relationship("KbAuthor", lazy="joined")
    excerpts: Mapped[List["KbExcerpt"]] = relationship(
        "KbExcerpt", back_populates="work", cascade="all, delete-orphan", passive_deletes=True,
    )


class KbExcerpt(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "kb_excerpts"

    external_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    excerpt_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    work_id: Mapped[int] = mapped_column(ForeignKey("kb_works.id", ondelete="CASCADE"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0", default=0)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    chapter: Mapped[str] = mapped_column(String(500), nullable=False, server_default="", default="")
    theme_internal_id: Mapped[str] = mapped_column(String(255), nullable=False, server_default="", default="")
    text: Mapped[str] = mapped_column(Text, nullable=False)

    work: Mapped["KbWork"] = relationship("KbWork", back_populates="excerpts")
    exclusions: Mapped[List["KbExcerptExclusion"]] = relationship(
        "KbExcerptExclusion", back_populates="excerpt", cascade="all, delete-orphan", passive_deletes=True,
    )


class KbPoem(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "kb_poems"

    external_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    poem_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    author_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kb_authors.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    age18: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false", default=False)

    author: Mapped[Optional["KbAuthor"]] = relationship("KbAuthor", lazy="joined")


class KbTask(Base, BaseMixin, CreatedAtMixin):
    """Версионированное задание ЕГЭ."""
    __tablename__ = "kb_tasks"

    external_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1", default=1)

    task_type: Mapped[str] = mapped_column(String(30), nullable=False)
    format: Mapped[str] = mapped_column(String(30), nullable=False)
    scope: Mapped[str] = mapped_column(String(30), nullable=False)

    work_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kb_works.id"), nullable=True, index=True)
    excerpt_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kb_excerpts.id"), nullable=True, index=True)
    poem_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kb_poems.id"), nullable=True, index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true", default=True)
    author_id_str: Mapped[str] = mapped_column("author_id_str", String(255), nullable=False, server_default="", default="")
    term_id: Mapped[str] = mapped_column(String(255), nullable=False, server_default="", default="")
    tags: Mapped[str] = mapped_column(String(1000), nullable=False, server_default="", default="")

    content: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    created_by: Mapped[str] = mapped_column(String(255), nullable=False, server_default="system", default="system")

    __table_args__ = (
        UniqueConstraint("external_id", "version", name="uq_kb_tasks_external_version"),
        Index("ix_kb_tasks_type", "task_type"),
        Index("ix_kb_tasks_scope", "scope"),
        Index("ix_kb_tasks_active_lookup", "external_id", "is_active"),
    )


class KbExcerptExclusion(Base, BaseMixin, CreatedAtMixin):
    __tablename__ = "kb_excerpt_exclusions"

    excerpt_id: Mapped[int] = mapped_column(ForeignKey("kb_excerpts.id", ondelete="CASCADE"), nullable=False, index=True)
    exclusion_type: Mapped[str] = mapped_column(String(50), nullable=False)
    excluded_value: Mapped[str] = mapped_column(String(255), nullable=False)

    excerpt: Mapped["KbExcerpt"] = relationship("KbExcerpt", back_populates="exclusions")

    __table_args__ = (
        UniqueConstraint("excerpt_id", "exclusion_type", "excluded_value", name="uq_kb_excerpt_exclusion"),
    )


class SavedVariantTask(Base, BaseMixin, CreatedAtMixin):
    """Связь сохранённого варианта с конкретными версиями заданий."""
    __tablename__ = "saved_variant_tasks"

    saved_variant_id: Mapped[int] = mapped_column(
        ForeignKey("saved_variants.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    task_id: Mapped[int] = mapped_column(ForeignKey("kb_tasks.id"), nullable=False)
    task_slot: Mapped[str] = mapped_column(String(30), nullable=False)
    slot_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0", default=0)

    runtime_snapshot: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    saved_variant: Mapped["SavedVariant"] = relationship("SavedVariant", back_populates="tasks")
    task: Mapped["KbTask"] = relationship("KbTask", lazy="joined")

    __table_args__ = (
        UniqueConstraint("saved_variant_id", "task_slot", "slot_order", name="uq_saved_variant_task_slot"),
    )


class OrderItemTask(Base, BaseMixin, CreatedAtMixin):
    """Связь элемента заказа (сборника) с конкретными версиями заданий."""
    __tablename__ = "order_item_tasks"

    order_item_id: Mapped[int] = mapped_column(
        ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    variant_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0", default=0)
    task_id: Mapped[int] = mapped_column(ForeignKey("kb_tasks.id"), nullable=False)
    task_slot: Mapped[str] = mapped_column(String(30), nullable=False)
    slot_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0", default=0)

    runtime_snapshot: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    order_item: Mapped["OrderItem"] = relationship("OrderItem", back_populates="tasks")
    task: Mapped["KbTask"] = relationship("KbTask", lazy="joined")

    __table_args__ = (
        UniqueConstraint(
            "order_item_id", "variant_index", "task_slot", "slot_order",
            name="uq_order_item_task_slot",
        ),
    )
