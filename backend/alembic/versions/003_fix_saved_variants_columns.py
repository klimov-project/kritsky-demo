"""Fix saved_variants, variant_exports and folders

Revision ID: 003
Revises: 002
Create Date: 2026-05-02 04:35:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # 1. Cleanup saved_variants from old folder columns and constraints
    if 'saved_variants' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('saved_variants')]
        fks = inspector.get_foreign_keys('saved_variants')
        fk_names = [fk['name'] for fk in fks]
        
        # Drop old FK if exists
        if 'saved_variants_folder_id_fkey' in fk_names:
            op.drop_constraint('saved_variants_folder_id_fkey', 'saved_variants', type_='foreignkey')
        
        # Drop old indexes if exist
        indexes = inspector.get_indexes('saved_variants')
        index_names = [idx['name'] for idx in indexes]
        if 'ix_saved_variants_folder_id' in index_names:
            op.drop_index('ix_saved_variants_folder_id', table_name='saved_variants')
        if 'ix_saved_variants_user_folder_order' in index_names:
            op.drop_index('ix_saved_variants_user_folder_order', table_name='saved_variants')
            
        # Drop old columns
        if 'folder_id' in columns:
            op.drop_column('saved_variants', 'folder_id')
        if 'order_index' in columns:
            op.drop_column('saved_variants', 'order_index')

        # Ensure NEW columns exist
        if 'share_token' not in columns:
            op.add_column('saved_variants', sa.Column('share_token', sa.String(length=64), nullable=True))
            op.create_unique_constraint('uq_saved_variants_share_token', 'saved_variants', ['share_token'])
        
        if 'is_shared' not in columns:
            op.add_column('saved_variants', sa.Column('is_shared', sa.Boolean(), server_default='false', nullable=False))
            
        if 'position' not in columns:
            op.add_column('saved_variants', sa.Column('position', sa.Integer(), server_default='0', nullable=False))

    # 2. Ensure variant_folders table exists
    if 'variant_folders' not in existing_tables:
        op.create_table(
            'variant_folders',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('share_token', sa.String(length=64), nullable=True),
            sa.Column('is_shared', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('position', sa.Integer(), server_default='0', nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('share_token')
        )
        op.create_index('ix_variant_folders_user_id', 'variant_folders', ['user_id'], unique=False)

    # 3. Ensure saved_variant_folders association table exists
    if 'saved_variant_folders' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('saved_variant_folders')]
        if 'variant_id' not in columns:
            op.drop_table('saved_variant_folders')
            existing_tables.remove('saved_variant_folders')

    if 'saved_variant_folders' not in existing_tables:
        op.create_table(
            'saved_variant_folders',
            sa.Column('variant_id', sa.Integer(), nullable=False),
            sa.Column('folder_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['folder_id'], ['variant_folders.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['variant_id'], ['saved_variants.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('variant_id', 'folder_id')
        )

    # 4. Ensure content_type exists in variant_exports
    if 'variant_exports' in existing_tables:
        export_columns = [c['name'] for c in inspector.get_columns('variant_exports')]
        if 'content_type' not in export_columns:
            op.add_column('variant_exports', sa.Column('content_type', sa.String(length=32), server_default='full', nullable=False))

    # 5. Drop saved_variant_tasks if it exists
    if 'saved_variant_tasks' in existing_tables:
        op.drop_table('saved_variant_tasks')


def downgrade() -> None:
    pass
