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
        from db.src.models import Base
        Base.metadata.create_all(bind=conn)
        return

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

    existing_tables = inspector.get_table_names()

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

    def add_col_if_missing(table_name, column_name, column_type, *args, **kwargs):
        if table_name in existing_tables:
            columns = [c['name'] for c in inspector.get_columns(table_name)]
            if column_name not in columns:
                op.add_column(table_name, sa.Column(column_name, column_type, *args, **kwargs))

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
