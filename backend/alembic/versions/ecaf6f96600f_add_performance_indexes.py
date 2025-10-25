"""add_performance_indexes

Revision ID: ecaf6f96600f
Revises: 20251025_0002
Create Date: 2025-10-25 21:42:09.449710
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ecaf6f96600f'
down_revision = '20251025_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes for frequent lookups in imports and inventory queries
    op.create_index('ix_branches_code', 'branches', ['code'], unique=False)
    op.create_index('ix_vehicle_models_external_code', 'vehicle_models', ['external_code'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_vehicle_models_external_code', table_name='vehicle_models')
    op.drop_index('ix_branches_code', table_name='branches')
