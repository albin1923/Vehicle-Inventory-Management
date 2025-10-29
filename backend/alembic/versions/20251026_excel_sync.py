"""Extend inventory and sales schema for Excel sync and payment tracking

Revision ID: 20251026_excel_sync
Revises: 20251025_sales_schema
Create Date: 2025-10-26 02:15:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251026_excel_sync"
down_revision = "20251025_sales_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Vehicle stock adjustments
    op.drop_constraint("uq_vehicle_stock_model_variant_color", "vehicle_stock", type_="unique")

    op.add_column("vehicle_stock", sa.Column("excel_row_number", sa.Integer(), nullable=True))
    op.add_column("vehicle_stock", sa.Column("model_code", sa.String(length=50), nullable=True))
    op.add_column("vehicle_stock", sa.Column("reserved", sa.Integer(), server_default="0", nullable=False))
    op.add_column("vehicle_stock", sa.Column("branch_code", sa.String(length=20), nullable=True))
    op.add_column("vehicle_stock", sa.Column("branch_name", sa.String(length=150), nullable=True))
    op.add_column("vehicle_stock", sa.Column("city", sa.String(length=120), nullable=True))
    op.add_column("vehicle_stock", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("vehicle_stock", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column(
        "vehicle_stock",
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Convert enum variant to text for flexible Excel sync
    op.execute("ALTER TABLE vehicle_stock ALTER COLUMN variant TYPE VARCHAR USING variant::text")
    op.alter_column("vehicle_stock", "variant", nullable=True)
    op.alter_column("vehicle_stock", "color", nullable=True)

    op.create_unique_constraint("uq_vehicle_stock_excel_row_number", "vehicle_stock", ["excel_row_number"])
    op.create_index("ix_vehicle_stock_model_code", "vehicle_stock", ["model_code"], unique=False)
    op.create_index("ix_vehicle_stock_branch_code", "vehicle_stock", ["branch_code"], unique=False)

    # Drop the legacy enum type once conversions are complete
    op.execute("DO $$ BEGIN DROP TYPE IF EXISTS varianttype; EXCEPTION WHEN undefined_object THEN NULL; END $$;")

    # Ensure current rows have reserved counts
    op.execute("UPDATE vehicle_stock SET reserved = 0 WHERE reserved IS NULL")

    # Sales record adjustments
    op.add_column(
        "sales_records",
        sa.Column("is_payment_received", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column("sales_records", sa.Column("branch_code", sa.String(length=20), nullable=True))
    op.add_column("sales_records", sa.Column("branch_name", sa.String(length=150), nullable=True))
    op.create_index("ix_sales_records_branch_code", "sales_records", ["branch_code"], unique=False)

    # Mark existing records as paid to avoid false pending flags
    op.execute("UPDATE sales_records SET is_payment_received = true")


def downgrade() -> None:
    # Recreate legacy enum type
    op.execute(
        "DO $$ BEGIN CREATE TYPE varianttype AS ENUM ('ID(DRUM)', '2ID(DISC)', '3ID(DR.ALLOY)', 'H SMART'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )

    # Sales records rollback
    op.drop_index("ix_sales_records_branch_code", table_name="sales_records")
    op.drop_column("sales_records", "branch_name")
    op.drop_column("sales_records", "branch_code")
    op.drop_column("sales_records", "is_payment_received")

    # Vehicle stock rollback
    op.drop_index("ix_vehicle_stock_branch_code", table_name="vehicle_stock")
    op.drop_index("ix_vehicle_stock_model_code", table_name="vehicle_stock")
    op.drop_constraint("uq_vehicle_stock_excel_row_number", "vehicle_stock", type_="unique")

    op.execute("ALTER TABLE vehicle_stock ALTER COLUMN variant TYPE varianttype USING variant::varianttype")
    op.alter_column("vehicle_stock", "variant", nullable=False)
    op.alter_column("vehicle_stock", "color", nullable=False)

    op.drop_column("vehicle_stock", "last_synced_at")
    op.drop_column("vehicle_stock", "longitude")
    op.drop_column("vehicle_stock", "latitude")
    op.drop_column("vehicle_stock", "city")
    op.drop_column("vehicle_stock", "branch_name")
    op.drop_column("vehicle_stock", "branch_code")
    op.drop_column("vehicle_stock", "reserved")
    op.drop_column("vehicle_stock", "model_code")
    op.drop_column("vehicle_stock", "excel_row_number")

    op.create_unique_constraint(
        "uq_vehicle_stock_model_variant_color",
        "vehicle_stock",
        ["model_name", "variant", "color"],
    )