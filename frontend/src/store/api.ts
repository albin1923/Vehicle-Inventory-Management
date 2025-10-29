import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { clearAuth } from "./authSlice";
import type {
  Branch,
  Customer,
  PaymentMode,
  SalesRecord,
  TokenResponse,
  UserProfile,
  VehicleStock,
} from "./types";

const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1/";
  return configured.endsWith("/") ? configured : `${configured}/`;
};

const apiBaseUrl = resolveBaseUrl();

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("access_token");
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(clearAuth());
  }

  return result;
};

export interface CustomerListParams {
  search?: string;
  location?: string;
  skip?: number;
  limit?: number;
}

export interface VehicleStockFilterParams {
  model_name?: string;
  branch_code?: string;
  city?: string;
  in_stock_only?: boolean;
}

export interface SalesListParams {
  skip?: number;
  limit?: number;
  location?: string;
  payment_mode?: PaymentMode;
  from_date?: string;
  to_date?: string;
  executive_id?: number;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Profile", "Customers", "VehicleStock", "SalesRecords", "Branches"],
  endpoints: (builder) => ({
    login: builder.mutation<TokenResponse, { username: string; password: string }>({
      query: ({ username, password }) => ({
        url: "auth/login",
        method: "POST",
        body: new URLSearchParams({ username, password }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    }),
    getProfile: builder.query<UserProfile, void>({
      query: () => ({
        url: "auth/me",
      }),
      providesTags: ["Profile"],
    }),
    listCustomers: builder.query<Customer[], CustomerListParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.search) {
          searchParams.append("search", params.search);
        }
        if (params?.location) {
          searchParams.append("location", params.location);
        }
        if (typeof params?.skip === "number") {
          searchParams.append("skip", params.skip.toString());
        }
        if (typeof params?.limit === "number") {
          searchParams.append("limit", params.limit.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `customers${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Customers"],
    }),
    createCustomer: builder.mutation<Customer, Partial<Customer>>({
      query: (body) => ({
        url: "customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),
    updateCustomer: builder.mutation<Customer, { id: number; body: Partial<Customer> }>({
      query: ({ id, body }) => ({
        url: `customers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),
    deleteCustomer: builder.mutation<void, number>({
      query: (id) => ({
        url: `customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers"],
    }),
    listBranches: builder.query<Branch[], void>({
      query: () => ({
        url: "branches",
        method: "GET",
      }),
      providesTags: ["Branches"],
    }),
    listVehicleStock: builder.query<VehicleStock[], VehicleStockFilterParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.model_name) {
          searchParams.append("model_name", params.model_name);
        }
        if (params?.branch_code) {
          searchParams.append("branch_code", params.branch_code);
        }
        if (params?.city) {
          searchParams.append("city", params.city);
        }
        if (params?.in_stock_only) {
          searchParams.append("in_stock_only", "true");
        }
        const queryString = searchParams.toString();
        return {
          url: `vehicle-stock${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["VehicleStock"],
    }),
    createVehicleStock: builder.mutation<VehicleStock, Partial<VehicleStock>>({
      query: (body) => ({
        url: "vehicle-stock",
        method: "POST",
        body,
      }),
      invalidatesTags: ["VehicleStock"],
    }),
    updateVehicleStock: builder.mutation<VehicleStock, { id: number; body: Partial<VehicleStock> }>(
      {
        query: ({ id, body }) => ({
          url: `vehicle-stock/${id}`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["VehicleStock"],
      },
    ),
    adjustVehicleStock: builder.mutation<VehicleStock, { id: number; adjustment: number }>({
      query: ({ id, adjustment }) => ({
        url: `vehicle-stock/${id}/adjust`,
        method: "POST",
        body: { adjustment },
      }),
      invalidatesTags: ["VehicleStock"],
    }),
    deleteVehicleStock: builder.mutation<void, number>({
      query: (id) => ({
        url: `vehicle-stock/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VehicleStock"],
    }),
    importVehicleStock: builder.mutation<
      { processed: number; created: number; updated: number; removed: number; workbook: string },
      void
    >({
      query: () => ({
        url: "vehicle-stock/import",
        method: "POST",
      }),
      invalidatesTags: ["VehicleStock", "Branches"],
    }),
    exportVehicleStock: builder.query<Blob, void>({
      query: () => ({
        url: "vehicle-stock/export",
        method: "GET",
        responseHandler: async (response) => response.blob(),
      }),
    }),
    listSalesRecords: builder.query<SalesRecord[], SalesListParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (typeof params?.skip === "number") {
          searchParams.append("skip", params.skip.toString());
        }
        if (typeof params?.limit === "number") {
          searchParams.append("limit", params.limit.toString());
        }
        if (params?.location) {
          searchParams.append("location", params.location);
        }
        if (params?.payment_mode) {
          searchParams.append("payment_mode", params.payment_mode);
        }
        if (params?.from_date) {
          searchParams.append("from_date", params.from_date);
        }
        if (params?.to_date) {
          searchParams.append("to_date", params.to_date);
        }
        if (typeof params?.executive_id === "number") {
          searchParams.append("executive_id", params.executive_id.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `sales-records${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["SalesRecords", "VehicleStock"],
    }),
    createSaleRecord: builder.mutation<
      SalesRecord,
      {
        customer_id?: number;
        customer_name?: string;
        customer_phone?: string;
        customer_location?: string;
        vehicle_stock_id: number;
        payment_mode: PaymentMode;
        bank?: string | null;
        payment_date?: string | null;
        amount_received: string;
        is_payment_received?: boolean;
      }
    >({
      query: (body) => ({
        url: "sales-records",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SalesRecords", "VehicleStock", "Customers"],
    }),
    updateSaleRecord: builder.mutation<
      SalesRecord,
      {
        id: number;
        body: Partial<
          Pick<SalesRecord, "payment_mode" | "bank" | "payment_date" | "amount_received" | "is_payment_received">
        >;
      }
    >({
      query: ({ id, body }) => ({
        url: `sales-records/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["SalesRecords"],
    }),
    deleteSaleRecord: builder.mutation<void, number>({
      query: (id) => ({
        url: `sales-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalesRecords", "VehicleStock"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useListCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useListBranchesQuery,
  useListVehicleStockQuery,
  useCreateVehicleStockMutation,
  useUpdateVehicleStockMutation,
  useAdjustVehicleStockMutation,
  useDeleteVehicleStockMutation,
  useImportVehicleStockMutation,
  useExportVehicleStockQuery,
  useLazyExportVehicleStockQuery,
  useLazyListVehicleStockQuery,
  useListSalesRecordsQuery,
  useCreateSaleRecordMutation,
  useUpdateSaleRecordMutation,
  useDeleteSaleRecordMutation,
} = apiSlice;
