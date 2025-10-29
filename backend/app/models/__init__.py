from app.models.anomaly import Anomaly
from app.models.audit_event import AuditEvent
from app.models.branch import Branch
from app.models.import_log import ImportJob
from app.models.inventory import Inventory
from app.models.payment import Payment
from app.models.role import Role, UserRole as RoleModel
from app.models.sale import Sale
from app.models.transfer import Transfer
from app.models.user import User, UserRole
from app.models.vehicle_model import VehicleModel

# New sales tracking models
from app.models.customer import Customer
from app.models.vehicle_stock import VehicleStock
from app.models.sales_record import SalesRecord, PaymentMode


