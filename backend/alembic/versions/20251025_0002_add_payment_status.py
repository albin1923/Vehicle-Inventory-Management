"""Add status column to payments

Revision ID: 20251025_0002
Revises: 20251024_0001
Create Date: 2025-10-25 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251025_0002"
down_revision = "20251024_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("payments", sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"))
    op.execute("UPDATE payments SET status = 'posted'")


def downgrade() -> None:
    op.drop_column("payments", "status")
