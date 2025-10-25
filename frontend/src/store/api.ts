import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Branch {
  id: number;
  name: string;
  city: string;
  code: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface VehicleModel {
  id: number;
  name: string;
  external_code?: string | null;
}

export interface InventoryRecord {
  id: number;
  branch_id: number;
  model_id: number;
  quantity: number;
  reserved: number;
  model?: VehicleModel | null;
}

export interface NearestInventoryResult {
  branch: Branch;
  model: VehicleModel;
  available_quantity: number;
  distance_km: number;
}

export interface SaleRecord {
  id: number;
  branch_id: number;
  model_id: number;
  sale_price: number;
  sold_at: string;
  model?: VehicleModel | null;
}

export interface PaymentRecord {
  id: number;
  sale_id: number;
  branch_id: number;
  method: string;
  reference?: string | null;
  amount: number;
  status: string;
  received_on: string;
}

export interface TransferRecord {
  id: number;
  from_branch_id: number;
  to_branch_id: number;
  model_id: number;
  quantity: number;
  status: string;
  requested_at: string;
  completed_at?: string | null;
}

export interface ImportJob {
  id: number;
  branch_id?: number | null;
  source_filename: string;
  sheet_name?: string | null;
  status: string;
  summary?: Record<string, unknown> | null;
  executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnomalyRecord {
  id: number;
  branch_id?: number | null;
  category: string;
  description?: string | null;
  payload?: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const apiBaseUrl = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "/api/v1/";
  return configured.endsWith("/") ? configured : `${configured}/`;
})();

const baseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers: Headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Inventory",
    "Sales",
    "Payments",
    "Transfers",
    "Anomalies",
    "Summary",
    "Branches",
    "Models",
    "Imports",
  ],
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<{ total_sales: number; total_revenue: number }, void>({
      query: () => "reports/summary",
      providesTags: ["Summary"],
    }),
    listBranches: builder.query<Branch[], void>({
      query: () => "branches",
      providesTags: ["Branches"],
    }),
    listVehicleModels: builder.query<VehicleModel[], void>({
      query: () => "models",
      providesTags: ["Models"],
    }),
    listInventoryByBranch: builder.query<InventoryRecord[], number>({
      query: (branchId: number) => `inventory/branches/${branchId}`,
      providesTags: ["Inventory"],
    }),
    findNearestInventory: builder.query<NearestInventoryResult, { branchId: number; modelId: number }>({
      query: ({ branchId, modelId }) =>
        `inventory/nearest?source_branch_id=${branchId}&model_id=${modelId}`,
      providesTags: ["Inventory"],
    }),
    listRecentSales: builder.query<SaleRecord[], number | void>({
      query: (limit: number = 20) => `sales/recent?limit=${limit}`,
      providesTags: ["Sales"],
    }),
    listPendingPayments: builder.query<PaymentRecord[], void>({
      query: () => "payments/pending",
      providesTags: ["Payments"],
    }),
    listTransferRequests: builder.query<TransferRecord[], void>({
      query: () => "transfers/open",
      providesTags: ["Transfers"],
    }),
    listImportJobs: builder.query<ImportJob[], void>({
      query: () => "imports/jobs",
      providesTags: ["Imports"],
    }),
    createImportJob: builder.mutation<ImportJob, FormData>({
      query: (payload: FormData) => ({
        url: "imports/upload",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Imports", "Inventory", "Summary", "Models", "Branches"],
    }),
    listOpenAnomalies: builder.query<AnomalyRecord[], void>({
      query: () => "anomalies/open",
      providesTags: ["Anomalies"],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useListBranchesQuery,
  useListVehicleModelsQuery,
  useListInventoryByBranchQuery,
  useFindNearestInventoryQuery,
  useListRecentSalesQuery,
  useListPendingPaymentsQuery,
  useListTransferRequestsQuery,
  useListImportJobsQuery,
  useCreateImportJobMutation,
  useListOpenAnomaliesQuery,
} = apiSlice;
