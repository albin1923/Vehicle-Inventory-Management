"""Add sales tracking schema

Revision ID: 20251025_sales_schema
Revises: ecaf6f96600f
Create Date: 2025-10-25 22:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251025_sales_schema'
down_revision = 'ecaf6f96600f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types first (IF NOT EXISTS to handle partial migrations)
    op.execute("DO $$ BEGIN CREATE TYPE userrole AS ENUM ('ADMIN', 'SALESMAN'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE varianttype AS ENUM ('ID(DRUM)', '2ID(DISC)', '3ID(DR.ALLOY)', 'H SMART'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE paymentmode AS ENUM ('CASH', 'IP', 'FINANCE'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Add username and user_role to users table
    op.add_column('users', sa.Column('username', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('user_role', postgresql.ENUM('ADMIN', 'SALESMAN', name='userrole', create_type=False), 
                                      server_default='SALESMAN', nullable=False))
    
    # Create unique index on username
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Create customers table
    op.create_table('customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_name'), 'customers', ['name'], unique=False)
    op.create_index(op.f('ix_customers_location'), 'customers', ['location'], unique=False)
    
    # Create vehicle_stock table
    op.create_table('vehicle_stock',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('variant', postgresql.ENUM('ID(DRUM)', '2ID(DISC)', '3ID(DR.ALLOY)', 'H SMART', name='varianttype', create_type=False), nullable=False),
        sa.Column('color', sa.String(), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('model_name', 'variant', 'color', name='uq_vehicle_stock_model_variant_color')
    )
    op.create_index(op.f('ix_vehicle_stock_model_name'), 'vehicle_stock', ['model_name'], unique=False)
    op.create_index(op.f('ix_vehicle_stock_color'), 'vehicle_stock', ['color'], unique=False)
    
    # Create sales table (renamed from sales_record to avoid conflict)
    op.create_table('sales_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('vehicle_stock_id', sa.Integer(), nullable=False),
        sa.Column('executive_id', sa.Integer(), nullable=True),
        sa.Column('vehicle_name', sa.String(), nullable=False),
        sa.Column('variant', sa.String(), nullable=False),
        sa.Column('color', sa.String(), nullable=False),
        sa.Column('payment_mode', postgresql.ENUM('CASH', 'IP', 'FINANCE', name='paymentmode', create_type=False), nullable=False),
        sa.Column('bank', sa.String(), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('amount_received', sa.Numeric(10, 2), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vehicle_stock_id'], ['vehicle_stock.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['executive_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_records_location'), 'sales_records', ['location'], unique=False)
    
    # Insert default admin and salesman users
    from app.core.security import get_password_hash
    
    # Note: Using raw SQL to avoid circular imports
    op.execute(f"""
        INSERT INTO users (email, username, full_name, hashed_password, is_active, user_role, created_at, updated_at)
        VALUES 
            ('admin@honda.com', 'admin', 'System Administrator', '{get_password_hash("admin123")}', true, 'ADMIN', now(), now()),
            ('sales@honda.com', 'sales', 'Sales Staff', '{get_password_hash("sales123")}', true, 'SALESMAN', now(), now())
        ON CONFLICT (email) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_table('sales_records')
    op.drop_table('vehicle_stock')
    op.drop_table('customers')
    
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'user_role')
    op.drop_column('users', 'username')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS paymentmode')
    op.execute('DROP TYPE IF EXISTS varianttype')
    op.execute('DROP TYPE IF EXISTS userrole')
