"""create kb sections

Revision ID: 004_create_kb_sections
Revises: 003_fix_saved_variants_columns
Create Date: 2026-05-02 05:48:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create table
    op.create_table('knowledge_base_sections',
        sa.Column('key', sa.String(length=64), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('key')
    )
    
    # 2. Migrate data
    connection = op.get_bind()
    state_rows = connection.execute(sa.text("SELECT payload FROM knowledge_base_state WHERE id = 1")).fetchall()
    
    if state_rows and state_rows[0][0]:
        payload = state_rows[0][0]
        if isinstance(payload, str):
            payload = json.loads(payload)
            
        works = payload.get("works", [])
        poets = payload.get("poets", [])
        block3 = payload.get("block3", {})
        settings = payload.get("settings", {})
        
        insert_query = sa.text(
            "INSERT INTO knowledge_base_sections (key, payload) VALUES (:key, :payload)"
        )
        
        connection.execute(insert_query, {"key": "works", "payload": json.dumps(works)})
        connection.execute(insert_query, {"key": "poets", "payload": json.dumps(poets)})
        connection.execute(insert_query, {"key": "block3", "payload": json.dumps(block3)})
        connection.execute(insert_query, {"key": "settings", "payload": json.dumps(settings)})
        
        # Clear the old payload to save space
        connection.execute(sa.text("UPDATE knowledge_base_state SET payload = '{}'::jsonb WHERE id = 1"))


def downgrade() -> None:
    # 1. Restore data (best effort)
    connection = op.get_bind()
    works_row = connection.execute(sa.text("SELECT payload FROM knowledge_base_sections WHERE key = 'works'")).fetchall()
    poets_row = connection.execute(sa.text("SELECT payload FROM knowledge_base_sections WHERE key = 'poets'")).fetchall()
    block3_row = connection.execute(sa.text("SELECT payload FROM knowledge_base_sections WHERE key = 'block3'")).fetchall()
    settings_row = connection.execute(sa.text("SELECT payload FROM knowledge_base_sections WHERE key = 'settings'")).fetchall()
    
    works = works_row[0][0] if works_row else []
    poets = poets_row[0][0] if poets_row else []
    block3 = block3_row[0][0] if block3_row else {}
    settings = settings_row[0][0] if settings_row else {}
    
    restored = {
        "works": works if not isinstance(works, str) else json.loads(works),
        "poets": poets if not isinstance(poets, str) else json.loads(poets),
        "block3": block3 if not isinstance(block3, str) else json.loads(block3),
        "settings": settings if not isinstance(settings, str) else json.loads(settings)
    }
    
    connection.execute(
        sa.text("UPDATE knowledge_base_state SET payload = :payload WHERE id = 1"),
        {"payload": json.dumps(restored)}
    )
    
    # 2. Drop table
    op.drop_table('knowledge_base_sections')
