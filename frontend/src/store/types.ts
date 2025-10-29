export interface UserProfile {
  id: number;
  email: string;
  username: string;
  user_role: "ADMIN" | "SALESMAN";
  is_active: boolean;
  full_name?: string | null;
  phone_number?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleStock {
  id: number;
  excel_row_number?: number | null;
  model_code?: string | null;
  model_name: string;
  variant?: string | null;
  color?: string | null;
  quantity: number;
  reserved: number;
  branch_code?: string | null;
  branch_name?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number;
  name: string;
  city: string;
  code: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMode = "CASH" | "IP" | "FINANCE";

export interface SalesRecord {
  id: number;
  customer_id: number;
  vehicle_stock_id: number;
  vehicle_name: string;
  variant: string;
  color: string;
  payment_mode: PaymentMode;
  bank?: string | null;
  payment_date?: string | null;
  amount_received: string;
  location?: string | null;
  executive_id?: number | null;
  branch_code?: string | null;
  branch_name?: string | null;
  is_payment_received: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer | null;
  executive?: UserProfile | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}
