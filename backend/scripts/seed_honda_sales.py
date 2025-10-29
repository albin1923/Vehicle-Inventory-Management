"""
Seed script with Honda sales data from actual Excel sheet
Creates vehicle stock, customers, and sales records matching the Excel workflow
"""
import asyncio
from decimal import Decimal
from datetime import date
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import VehicleStock, Customer, SalesRecord, User, UserRole
from app.models.sales_record import PaymentMode
from app.core.security import get_password_hash


async def seed_honda_data():
    async with AsyncSessionLocal() as db:
        print("[INFO] Seeding Honda sales tracking data...")

        # 1. Create default users if they don't exist
        print("\n[INFO] Creating users...")
        result = await db.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin = User(
                email="admin@honda.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                user_role=UserRole.ADMIN
            )
            db.add(admin)
            print("  [OK] Created admin user (admin/admin123)")
        
        result = await db.execute(select(User).where(User.username == "sales"))
        salesman = result.scalar_one_or_none()
        
        if not salesman:
            salesman = User(
                email="sales@honda.com",
                username="sales",
                full_name="Sales Staff",
                hashed_password=get_password_hash("sales123"),
                is_active=True,
                user_role=UserRole.SALESMAN
            )
            db.add(salesman)
            print("  [OK] Created salesman user (sales/sales123)")
        
        # Create additional salesmen from Excel (JOSEPH, STEFIN, JERRY, AMMU, ANISHA, BIBINA, ANJANAMOL)
        executives = ["JOSEPH", "STEFIN", "JERRY", "AMMU", "ANISHA", "BIBINA", "ANJANAMOL"]
        exec_users = {}
        for exec_name in executives:
            username = exec_name.lower()
            result = await db.execute(select(User).where(User.username == username))
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    email=f"{username}@honda.com",
                    username=username,
                    full_name=exec_name.title(),
                    hashed_password=get_password_hash("sales123"),
                    is_active=True,
                    user_role=UserRole.SALESMAN
                )
                db.add(user)
                print(f"  [OK] Created salesman: {exec_name}")
            exec_users[exec_name] = user
        
        await db.commit()
        await db.refresh(admin)
        await db.refresh(salesman)
        for user in exec_users.values():
            await db.refresh(user)
        
        # 2. Create vehicle stock based on Excel sheet
        print("\n[INFO] Creating vehicle stock...")
        
        # ACTIVA 125 BS-VI variants and colors from Excel
        activa_variants = [
            ("ID(DRUM)", [("WHITE", 0), ("GREY", -11), ("BLUE", -2), ("BLACK", -11), ("RED", -5), ("SILVER", 0)]),
            ("3ID(DR.ALLOY)", [("WHITE", 0), ("GREY", 0), ("BLUE", 0), ("BLACK", 0), ("RED", 0), ("SILVER", 0)]),
            ("H SMART", [("WHITE", 0), ("GREY", -1), ("BLUE", 4), ("BLACK", 1), ("RED", 1), ("SILVER", 0)]),
        ]
        
        # GRAZIA variants from Excel (right side of sheet)
        grazia_colors = [("WHITE", 0), ("BLACK", 0), ("BLUE", 0), ("YELLOW", 0), ("RED", 0), ("GREY", 0), ("SPORTS RED", 0)]
        
        for variant, colors in activa_variants:
            for color, qty in colors:
                # Normalize quantity (negative means pre-sold, set to 0 for now, can adjust stock later)
                actual_qty = max(0, qty + 15)  # Assume 15 base stock, adjust by Excel value
                
                result = await db.execute(
                    select(VehicleStock).where(
                        VehicleStock.model_name == "ACTIVA 125 BS-VI",
                        VehicleStock.variant == variant,
                        VehicleStock.color == color
                    )
                )
                if not result.scalar_one_or_none():
                    stock = VehicleStock(
                        model_name="ACTIVA 125 BS-VI",
                        variant=variant,
                        color=color,
                        quantity=actual_qty
                    )
                    db.add(stock)
                    print(f"  [OK] Added: ACTIVA 125 BS-VI {variant} {color} (qty: {actual_qty})")
        
        # Add GRAZIA stock (using DRUM variant as default)
        for color, qty in grazia_colors:
            actual_qty = max(0, qty + 10)
            result = await db.execute(
                select(VehicleStock).where(
                    VehicleStock.model_name == "GRAZIA",
                    VehicleStock.variant == "ID(DRUM)",
                    VehicleStock.color == color
                )
            )
            if not result.scalar_one_or_none():
                stock = VehicleStock(
                    model_name="GRAZIA",
                    variant="ID(DRUM)",
                    color=color,
                    quantity=actual_qty
                )
                db.add(stock)
                print(f"  [OK] Added: GRAZIA DRUM {color} (qty: {actual_qty})")
        
        await db.commit()
        
        # 3. Create customers and sales from Excel data
        print("\n[INFO] Creating customers and sales records...")
        
        # Sales data from Excel sheet (rows 12-23)
        sales_data = [
            {"customer": "SUJITH C", "location": "KTM", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "BLUE", 
             "payment": "IP", "bank": "MUTHOOT C", "date": "2025-05-31", "amount": 15000, "exec": "JOSEPH"},
            {"customer": "SINOY JOSEPH", "location": "CHRY", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "CASH", "bank": None, "date": "2025-05-21", "amount": 5000, "exec": "STEFIN"},
            {"customer": "K J MATHEW", "location": "CHRY", "vehicle": "ACTIVA 125 ID", "variant": "ID(DRUM)", "color": "RED", 
             "payment": "CASH", "bank": None, "date": "2025-06-03", "amount": 110000, "exec": "JERRY"},
            {"customer": "SABU P A", "location": "ETM", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "IP", "bank": "SHRIRAM", "date": "2025-06-03", "amount": 25000, "exec": "AMMU"},
            {"customer": "MARIYAMMA JOHNY", "location": "EPTA", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "CASH", "bank": None, "date": "2025-06-03", "amount": 5000, "exec": "ANISHA"},
            {"customer": "SUNILA BIJU", "location": "EPTA", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "CASH", "bank": None, "date": "2025-06-03", "amount": 5000, "exec": "ANISHA"},
            {"customer": "P J PHILIP", "location": "KTM", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "CASH", "bank": None, "date": "2025-06-04", "amount": 60000, "exec": "BIBINA"},
            {"customer": "USHA RAJAN", "location": "CHRY", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "IP", "bank": "INDUSIND", "date": "2025-06-04", "amount": 27000, "exec": "STEFIN"},
            {"customer": "JOSHI THOMAS", "location": "KTM", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "BLACK", 
             "payment": "IP", "bank": "SHRIRAM", "date": "2025-06-03", "amount": 20000, "exec": "BIBINA"},
            {"customer": "JEENA BINU", "location": "KPLY", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "BLACK", 
             "payment": "IP", "bank": "HDFC", "date": "2025-06-05", "amount": 5000, "exec": "ANJANAMOL"},
            {"customer": "CHARLEY K CHERIAN", "location": "KTM", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "GREY", 
             "payment": "CASH", "bank": None, "date": "2025-06-06", "amount": 2572, "exec": "BIBINA"},
            {"customer": "P A HARRIES", "location": "KTM", "vehicle": "ACTIVA 125 2ID", "variant": "2ID(DISC)", "color": "RED", 
             "payment": "IP", "bank": "MUTHOOT C", "date": "2025-06-03", "amount": 2000, "exec": "BIBINA"},
        ]
        
        for sale_data in sales_data:
            # Create or get customer
            result = await db.execute(select(Customer).where(Customer.name == sale_data["customer"]))
            customer = result.scalar_one_or_none()
            
            if not customer:
                customer = Customer(
                    name=sale_data["customer"],
                    location=sale_data["location"]
                )
                db.add(customer)
                await db.flush()
                print(f"  [OK] Created customer: {customer.name}")
            
            # Get vehicle stock
            result = await db.execute(
                select(VehicleStock).where(
                    VehicleStock.model_name == "ACTIVA 125 BS-VI",
                    VehicleStock.variant == sale_data["variant"],
                    VehicleStock.color == sale_data["color"]
                )
            )
            vehicle_stock = result.scalar_one_or_none()
            
            if not vehicle_stock:
                print(f"  [WARN] Vehicle stock not found for {sale_data['variant']} {sale_data['color']}, skipping sale")
                continue
            
            # Get executive
            executive = exec_users.get(sale_data["exec"], salesman)
            
            # Create sale record
            sale = SalesRecord(
                customer_id=customer.id,
                vehicle_stock_id=vehicle_stock.id,
                executive_id=executive.id,
                vehicle_name=sale_data["vehicle"],
                variant=sale_data["variant"],
                color=sale_data["color"],
                payment_mode=PaymentMode(sale_data["payment"]),
                bank=sale_data["bank"],
                payment_date=date.fromisoformat(sale_data["date"]),
                amount_received=Decimal(str(sale_data["amount"])),
                location=sale_data["location"]
            )
            db.add(sale)
            print(f"  [OK] Created sale: {customer.name} - {sale_data['vehicle']} ({sale_data['exec']})")
        await db.commit()

        print("\n[SUCCESS] Seeding complete!")
        print("\n[SUMMARY]")
    print("   - Default logins:")
    print("     * Admin: admin / admin123")
    print("     * Salesman: sales / sales123")
    print(f"     * Executives: {', '.join([e.lower() for e in executives])} / sales123")
    print("   - Vehicle stock created for ACTIVA 125 BS-VI and GRAZIA")
    print("   - Sample customers and sales records from Excel sheet")


if __name__ == "__main__":
    asyncio.run(seed_honda_data())
