"""Smart initial baseline migration

Revision ID: 001
Revises: 
Create Date: 2026-04-17 19:58:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    

    if 'users' not in existing_tables:
        # 1. users
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('userTgId', sa.String(length=64), nullable=True),
            sa.Column('userTgUsername', sa.String(length=255), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('isEmailVerified', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('phone', sa.String(length=255), nullable=True),
            sa.Column('isPhoneVerified', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('isPro', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('password', sa.String(length=255), nullable=True),
            sa.Column('name', sa.String(length=255), nullable=True),
            sa.Column('dailyDownloadsCount', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('lastDownloadDate', sa.Date(), nullable=True),
            sa.Column('paidDownloadCredits', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('variantsGeneratedTotal', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('downloadsTotal', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_users_userTgId', 'users', ['userTgId'], unique=True)
        op.create_index('ix_users_email', 'users', ['email'], unique=True)
        op.create_index('ix_users_phone', 'users', ['phone'], unique=True)

        # 2. minio_objects
        op.create_table(
            'minio_objects',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('bucket', sa.String(length=64), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('uuid', sa.String(length=36), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        )

        # 3. books
        op.create_table(
            'books',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('author', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('age_limit', sa.Integer(), nullable=True),
            sa.Column('year', sa.Integer(), nullable=True),
            sa.Column('pages', sa.Integer(), nullable=True),
            sa.Column('format', sa.String(length=32), nullable=True),
            sa.Column('isbn', sa.String(length=64), nullable=True),
            sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
            sa.Column('category', sa.Enum('books', 'posters', 'figurines', 'merch', 'collections', 'download_packs', name='product_category_enum'), nullable=False, server_default='books'),
            sa.Column('fulfillment_type', sa.Enum('digital', 'physical', name='product_fulfillment_enum'), nullable=False, server_default='physical'),
            sa.Column('digital_file_id', sa.Integer(), sa.ForeignKey('minio_objects.id', ondelete='SET NULL'), nullable=True),
            sa.Column('collection_config', sa.JSON(), nullable=True),
            sa.Column('download_pack_config', sa.JSON(), nullable=True),
            sa.Column('cover_id', sa.Integer(), sa.ForeignKey('minio_objects.id', ondelete='SET NULL'), nullable=True),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )

        # 4. book_attachments
        op.create_table(
            'book_attachments',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('book_id', sa.Integer(), sa.ForeignKey('books.id', ondelete='CASCADE'), nullable=False),
            sa.Column('minio_object_id', sa.Integer(), sa.ForeignKey('minio_objects.id', ondelete='CASCADE'), nullable=False),
            sa.Column('attachment_type', sa.Enum('gallery', name='book_attachment_type_enum'), nullable=False, server_default='gallery'),
        )

        # 5. book_external_links
        op.create_table(
            'book_external_links',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('book_id', sa.Integer(), sa.ForeignKey('books.id', ondelete='CASCADE'), nullable=False),
            sa.Column('url', sa.Text(), nullable=False),
            sa.Column('label', sa.String(length=64), nullable=False),
        )

        # 6. cart_items
        op.create_table(
            'cart_items',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('book_id', sa.Integer(), sa.ForeignKey('books.id', ondelete='CASCADE'), nullable=False),
            sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.UniqueConstraint('user_id', 'book_id', name='uq_cart_item_user_book'),
        )

        # 7. favorite_books
        op.create_table(
            'favorite_books',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('book_id', sa.Integer(), sa.ForeignKey('books.id', ondelete='CASCADE'), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.UniqueConstraint('user_id', 'book_id', name='uq_favorite_book_user_book'),
        )

        # 8. saved_variants
        op.create_table(
            'saved_variants',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('variant_payload', sa.JSON(), nullable=False),
            sa.Column('settings_payload', sa.JSON(), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_saved_variants_user_id', 'saved_variants', ['user_id'])

        # 9. variant_exports
        op.create_table(
            'variant_exports',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('saved_variant_id', sa.Integer(), sa.ForeignKey('saved_variants.id', ondelete='SET NULL'), nullable=True),
            sa.Column('action', sa.String(length=32), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_variant_exports_user_id', 'variant_exports', ['user_id'])
        op.create_index('ix_variant_exports_saved_variant_id', 'variant_exports', ['saved_variant_id'])

        # 10. orders
        op.create_table(
            'orders',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=False, server_default='Paid'),
            sa.Column('payment_status', sa.String(length=32), nullable=False, server_default='Success'),
            sa.Column('payment_method', sa.String(length=64), nullable=True),
            sa.Column('delivery_type', sa.String(length=32), nullable=False, server_default='without_delivery'),
            sa.Column('delivery_address', sa.Text(), nullable=True),
            sa.Column('recipient_name', sa.String(length=255), nullable=True),
            sa.Column('recipient_phone', sa.String(length=255), nullable=True),
            sa.Column('subtotal_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('delivery_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_orders_user_id', 'orders', ['user_id'])

        # 11. order_items
        op.create_table(
            'order_items',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
            sa.Column('book_id', sa.Integer(), sa.ForeignKey('books.id', ondelete='SET NULL'), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('author', sa.String(length=255), nullable=True),
            sa.Column('category', sa.String(length=64), nullable=True),
            sa.Column('fulfillment_type', sa.String(length=32), nullable=True),
            sa.Column('cover_name', sa.String(length=255), nullable=True),
            sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('line_total', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('payload', sa.JSON(), nullable=True),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_order_items_order_id', 'order_items', ['order_id'])

        # 12. phone_verification_codes
        op.create_table(
            'phone_verification_codes',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('code', sa.String(length=64), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        )

        # 13. reset_pwd_codes
        op.create_table(
            'reset_pwd_codes',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('code', sa.String(length=64), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
            sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        )

        # 14. email_verification_codes
        op.create_table(
            'email_verification_codes',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('code', sa.String(length=64), nullable=False),
            sa.Column('uuid', sa.String(length=36), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        )

        # 15. email_change_verification_codes
        op.create_table(
            'email_change_verification_codes',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('code', sa.String(length=64), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('uuid', sa.String(length=36), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        )

        # 16. payments
        op.create_table(
            'payments',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('userId', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False),
            sa.Column('paymentId', sa.String(length=128), nullable=True),
            sa.Column('paymentLink', sa.Text(), nullable=True),
            sa.Column('paymentStatus', sa.String(length=64), nullable=True),
            sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('method', sa.String(length=64), nullable=True),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_payments_userId', 'payments', ['userId'])
        op.create_index('ix_payments_paymentId', 'payments', ['paymentId'])
        op.create_index('ix_payments_order_id', 'payments', ['order_id'])

        # 17. subscriptions
        op.create_table(
            'subscriptions',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('userId', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False),
            sa.Column('paymentId', sa.Integer(), sa.ForeignKey('payments.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True),
            sa.Column('dateOfExpire', sa.DateTime(timezone=True), nullable=True),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index('ix_subscriptions_userId', 'subscriptions', ['userId'])
        op.create_index('ix_subscriptions_paymentId', 'subscriptions', ['paymentId'])
        op.create_index('ix_subscriptions_dateOfExpire', 'subscriptions', ['dateOfExpire'])
        op.create_index('ix_subscriptions_userId_dateOfExpire', 'subscriptions', ['userId', 'dateOfExpire'])

        # 18. knowledge_base_state
        op.create_table(
            'knowledge_base_state',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('payload', sa.JSON(), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )

    else:
        existing_types = conn.execute(sa.text("SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')")).scalars().all()
        
        def ensure_enum(name, values):
            if name not in existing_types:
                op.execute(f"CREATE TYPE {name} AS ENUM ({', '.join([f"'{v}'" for v in values])})")
            else:
                for val in values:
                    op.execute(f"ALTER TYPE {name} ADD VALUE IF NOT EXISTS '{val}'")

        ensure_enum('currency_enum', ['RUB', 'USD', 'EUR', 'BYN', 'KZT'])
        ensure_enum('product_category_enum', ['books', 'posters', 'figurines', 'merch', 'collections', 'download_packs'])
        ensure_enum('product_fulfillment_enum', ['digital', 'physical'])
        ensure_enum('book_attachment_type_enum', ['gallery'])

        def add_col_if_missing(table_name, column_name, column_type, *args, **kwargs):
            if table_name in existing_tables:
                columns = [c['name'] for c in inspector.get_columns(table_name)]
                if column_name not in columns:
                    op.add_column(table_name, sa.Column(column_name, column_type, *args, **kwargs))

        if 'variant_exports' not in existing_tables:
            op.create_table(
                'variant_exports',
                sa.Column('id', sa.Integer(), primary_key=True),
                sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
                sa.Column('saved_variant_id', sa.Integer(), sa.ForeignKey('saved_variants.id', ondelete='SET NULL'), nullable=True),
                sa.Column('action', sa.String(length=32), nullable=False),
                sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            )
            op.create_index('ix_variant_exports_user_id', 'variant_exports', ['user_id'])
            op.create_index('ix_variant_exports_saved_variant_id', 'variant_exports', ['saved_variant_id'])

        add_col_if_missing('cart_items', 'quantity', sa.Integer(), nullable=False, server_default='1')
        add_col_if_missing('payments', 'order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True)
        add_col_if_missing('payments', 'amount', sa.Numeric(10, 2), nullable=False, server_default='0')
        add_col_if_missing('payments', 'method', sa.String(64), nullable=True)
        add_col_if_missing('books', 'collection_config', sa.JSON(), nullable=True)
        add_col_if_missing('books', 'download_pack_config', sa.JSON(), nullable=True)
        add_col_if_missing('order_items', 'payload', sa.JSON(), nullable=True)
        
        add_col_if_missing('users', 'paidDownloadCredits', sa.Integer(), nullable=False, server_default='0')
        add_col_if_missing('users', 'variantsGeneratedTotal', sa.Integer(), nullable=False, server_default='0')
        add_col_if_missing('users', 'downloadsTotal', sa.Integer(), nullable=False, server_default='0')
        add_col_if_missing('users', 'is_blocked', sa.Boolean(), nullable=False, server_default='false')

        if 'payments' in existing_tables:
            indexes = [i['name'] for i in inspector.get_indexes('payments')]
            if 'ix_payments_order_id' not in indexes:
                op.create_index('ix_payments_order_id', 'payments', ['order_id'])


def downgrade() -> None:
    pass
