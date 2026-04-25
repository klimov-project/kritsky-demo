"""Add versioned knowledge base tables

Revision ID: 002
Revises: 001
Create Date: 2026-04-25 02:50:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn.engine)
    existing_tables = inspector.get_table_names()

    # --- kb_authors ---
    if 'kb_authors' not in existing_tables:
        op.create_table(
            'kb_authors',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('external_id', sa.String(255), unique=True, nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # --- kb_works ---
    if 'kb_works' not in existing_tables:
        op.create_table(
            'kb_works',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('external_id', sa.String(255), unique=True, nullable=False),
            sa.Column('work_code', sa.String(255), nullable=True),
            sa.Column('author_id', sa.Integer(), sa.ForeignKey('kb_authors.id'), nullable=True),
            sa.Column('title', sa.String(500), nullable=False),
            sa.Column('age18', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('internal_tags', sa.Text(), nullable=False, server_default=''),
            sa.Column('external_tags', sa.Text(), nullable=False, server_default=''),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # --- kb_excerpts ---
    if 'kb_excerpts' not in existing_tables:
        op.create_table(
            'kb_excerpts',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('external_id', sa.String(255), unique=True, nullable=False),
            sa.Column('excerpt_code', sa.String(255), nullable=True),
            sa.Column('work_id', sa.Integer(), sa.ForeignKey('kb_works.id', ondelete='CASCADE'), nullable=False),
            sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('title', sa.Text(), nullable=False),
            sa.Column('chapter', sa.String(500), nullable=False, server_default=''),
            sa.Column('theme_internal_id', sa.String(255), nullable=False, server_default=''),
            sa.Column('text', sa.Text(), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # --- kb_poems ---
    if 'kb_poems' not in existing_tables:
        op.create_table(
            'kb_poems',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('external_id', sa.String(255), unique=True, nullable=False),
            sa.Column('poem_code', sa.String(255), nullable=True),
            sa.Column('author_id', sa.Integer(), sa.ForeignKey('kb_authors.id'), nullable=True),
            sa.Column('title', sa.String(500), nullable=False),
            sa.Column('text', sa.Text(), nullable=False),
            sa.Column('age18', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # --- kb_tasks ---
    if 'kb_tasks' not in existing_tables:
        op.create_table(
            'kb_tasks',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('external_id', sa.String(255), nullable=False),
            sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('task_type', sa.String(30), nullable=False),
            sa.Column('format', sa.String(30), nullable=False),
            sa.Column('scope', sa.String(30), nullable=False),
            sa.Column('work_id', sa.Integer(), sa.ForeignKey('kb_works.id'), nullable=True),
            sa.Column('excerpt_id', sa.Integer(), sa.ForeignKey('kb_excerpts.id'), nullable=True),
            sa.Column('poem_id', sa.Integer(), sa.ForeignKey('kb_poems.id'), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('author_id_str', sa.String(255), nullable=False, server_default=''),
            sa.Column('term_id', sa.String(255), nullable=False, server_default=''),
            sa.Column('tags', sa.String(1000), nullable=False, server_default=''),
            sa.Column('content', sa.JSON(), nullable=False),
            sa.Column('created_by', sa.String(255), nullable=False, server_default='system'),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint('external_id', 'version', name='uq_kb_tasks_external_version'),
        )
        op.create_index('ix_kb_tasks_external_id', 'kb_tasks', ['external_id'])
        op.create_index('ix_kb_tasks_type', 'kb_tasks', ['task_type'])
        op.create_index('ix_kb_tasks_scope', 'kb_tasks', ['scope'])
        op.create_index('ix_kb_tasks_work_id', 'kb_tasks', ['work_id'])
        op.create_index('ix_kb_tasks_excerpt_id', 'kb_tasks', ['excerpt_id'])
        op.create_index('ix_kb_tasks_poem_id', 'kb_tasks', ['poem_id'])
        op.create_index('ix_kb_tasks_active_lookup', 'kb_tasks', ['external_id', 'is_active'])

    # --- kb_excerpt_exclusions ---
    if 'kb_excerpt_exclusions' not in existing_tables:
        op.create_table(
            'kb_excerpt_exclusions',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('excerpt_id', sa.Integer(), sa.ForeignKey('kb_excerpts.id', ondelete='CASCADE'), nullable=False),
            sa.Column('exclusion_type', sa.String(50), nullable=False),
            sa.Column('excluded_value', sa.String(255), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint('excerpt_id', 'exclusion_type', 'excluded_value', name='uq_kb_excerpt_exclusion'),
        )
        op.create_index('ix_kb_excerpt_exclusions_excerpt_id', 'kb_excerpt_exclusions', ['excerpt_id'])

    # --- saved_variant_tasks ---
    if 'saved_variant_tasks' not in existing_tables:
        op.create_table(
            'saved_variant_tasks',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('saved_variant_id', sa.Integer(), sa.ForeignKey('saved_variants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('task_id', sa.Integer(), sa.ForeignKey('kb_tasks.id'), nullable=False),
            sa.Column('task_slot', sa.String(30), nullable=False),
            sa.Column('slot_order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('runtime_snapshot', sa.JSON(), nullable=True),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint('saved_variant_id', 'task_slot', 'slot_order', name='uq_saved_variant_task_slot'),
        )
        op.create_index('ix_saved_variant_tasks_variant_id', 'saved_variant_tasks', ['saved_variant_id'])

    # --- order_item_tasks ---
    if 'order_item_tasks' not in existing_tables:
        op.create_table(
            'order_item_tasks',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('order_item_id', sa.Integer(), sa.ForeignKey('order_items.id', ondelete='CASCADE'), nullable=False),
            sa.Column('variant_index', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('task_id', sa.Integer(), sa.ForeignKey('kb_tasks.id'), nullable=False),
            sa.Column('task_slot', sa.String(30), nullable=False),
            sa.Column('slot_order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('runtime_snapshot', sa.JSON(), nullable=True),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint('order_item_id', 'variant_index', 'task_slot', 'slot_order', name='uq_order_item_task_slot'),
        )
        op.create_index('ix_order_item_tasks_order_item_id', 'order_item_tasks', ['order_item_id'])


def downgrade() -> None:
    op.drop_table('order_item_tasks')
    op.drop_table('saved_variant_tasks')
    op.drop_table('kb_excerpt_exclusions')
    op.drop_table('kb_tasks')
    op.drop_table('kb_poems')
    op.drop_table('kb_excerpts')
    op.drop_table('kb_works')
    op.drop_table('kb_authors')
