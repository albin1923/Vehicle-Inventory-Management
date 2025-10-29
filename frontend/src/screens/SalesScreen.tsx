import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  useCreateSaleRecordMutation,
  useDeleteSaleRecordMutation,
  useListBranchesQuery,
  useListCustomersQuery,
  useListSalesRecordsQuery,
  useListVehicleStockQuery,
  useUpdateSaleRecordMutation,
} from "../store/api";
import type { Branch, Customer, PaymentMode, SalesRecord, VehicleStock } from "../store/types";
import { formatCurrency, formatDate } from "../utils/format";
import useAppSelector from "../hooks/useAppSelector";

const paymentModes: PaymentMode[] = ["CASH", "IP", "FINANCE"];

interface SaleFormState {
  customerMode: "existing" | "new";
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  vehicleStockId: string;
  branchCode: string;
  paymentMode: PaymentMode;
  bank: string;
  amount: string;
  paymentDate: string;
  isPaymentReceived: boolean;
}

const initialFormState: SaleFormState = {
  customerMode: "existing",
  customerId: "",
  customerName: "",
  customerPhone: "",
  customerLocation: "",
  vehicleStockId: "",
  branchCode: "",
  paymentMode: "CASH",
  bank: "",
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  isPaymentReceived: true,
};

const SalesScreen = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.user_role === "ADMIN";

  const { data: branches } = useListBranchesQuery();
  const [branchFilter, setBranchFilter] = useState<string>("");
  const { data: stock, isFetching: loadingStock } = useListVehicleStockQuery({
    in_stock_only: true,
    branch_code: branchFilter || undefined,
  });
  const { data: customers } = useListCustomersQuery({ limit: 200 });
  const { data: sales, isFetching: loadingSales } = useListSalesRecordsQuery({ limit: isAdmin ? 200 : 100 });

  const [createSale, { isLoading: isSaving }] = useCreateSaleRecordMutation();
  const [deleteSale] = useDeleteSaleRecordMutation();
  const [updateSaleRecord] = useUpdateSaleRecordMutation();

  const [formState, setFormState] = useState<SaleFormState>(initialFormState);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableStock = useMemo<VehicleStock[]>(() => {
    if (!stock) {
      return [];
    }
    return stock
      .filter((item) => item.quantity > 0)
      .sort((a, b) => {
        const branchSort = (a.branch_name ?? "").localeCompare(b.branch_name ?? "");
        if (branchSort !== 0) {
          return branchSort;
        }
        return (a.model_name ?? "").localeCompare(b.model_name ?? "");
      });
  }, [stock]);

  const sortedSales = useMemo(() => sales ?? [], [sales]);
  const salesColumnCount = isAdmin ? 9 : 8;

  useEffect(() => {
    if (!formState.vehicleStockId) {
      return;
    }
    const stillAvailable = availableStock.some((item) => item.id === Number(formState.vehicleStockId));
    if (!stillAvailable) {
      setFormState((prev) => ({
        ...prev,
        vehicleStockId: "",
        branchCode: "",
      }));
    }
  }, [availableStock, formState.vehicleStockId]);

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => {
      if (name === "vehicleStockId") {
        const selected = availableStock.find((item) => item.id === Number(value));
        return {
          ...prev,
          vehicleStockId: value,
          branchCode: selected?.branch_code ?? "",
        };
      }
      if (name === "isPaymentReceived") {
        return {
          ...prev,
          isPaymentReceived: value === "yes",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleCustomerModeChange = (mode: "existing" | "new") => {
    setFormState((prev) => ({
      ...prev,
      customerMode: mode,
      customerId: "",
      customerName: "",
      customerPhone: "",
      customerLocation: "",
    }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!formState.vehicleStockId) {
      setFeedback("Select a vehicle from stock before saving the sale.");
      return;
    }

    if (formState.customerMode === "existing") {
      if (!formState.customerId) {
        setFeedback("Select an existing customer or switch to new customer mode.");
        return;
      }
    } else if (!formState.customerName.trim()) {
      setFeedback("Provide the customer name to create a new record.");
      return;
    }

    if (!formState.amount || Number.parseFloat(formState.amount) <= 0) {
      setFeedback("Enter the amount received from the customer.");
      return;
    }

    try {
      const payload: {
        customer_id?: number;
        customer_name?: string;
        customer_phone?: string;
        customer_location?: string;
        vehicle_stock_id: number;
        payment_mode: PaymentMode;
        bank?: string | null;
        payment_date?: string | null;
        amount_received: string;
        is_payment_received: boolean;
      } = {
        vehicle_stock_id: Number(formState.vehicleStockId),
        payment_mode: formState.paymentMode,
        bank: formState.bank.trim() || null,
        amount_received: Number.parseFloat(formState.amount).toFixed(2),
        payment_date: formState.paymentDate || null,
        is_payment_received: formState.isPaymentReceived,
      };

      if (formState.customerMode === "existing") {
        payload.customer_id = Number(formState.customerId);
      } else {
        payload.customer_name = formState.customerName.trim();
        payload.customer_phone = formState.customerPhone.trim() || undefined;
        payload.customer_location = formState.customerLocation.trim() || undefined;
      }

      await createSale(payload).unwrap();
      setFeedback("Sale recorded successfully. Inventory updated.");
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save sale.";
      setFeedback(message);
    }
  };

  const handleDelete = async (record: SalesRecord) => {
    if (!isAdmin) {
      return;
    }
    const confirmed = window.confirm(
      `Delete sale for ${record.customer?.name ?? "customer"}? Stock will be restored automatically.`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteSale(record.id).unwrap();
      setFeedback("Sale removed and stock restored.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete sale.";
      setFeedback(message);
    }
  };

  const handleTogglePayment = async (record: SalesRecord, nextState: boolean) => {
    try {
      await updateSaleRecord({
        id: record.id,
        body: { is_payment_received: nextState },
      }).unwrap();
      setFeedback(nextState ? "Marked payment as received." : "Marked payment as pending.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update payment status.";
      setFeedback(message);
    }
  };

  const customerLookup = useMemo(() => {
    if (!customers) {
      return new Map<number, Customer>();
    }
    return new Map(customers.map((customer) => [customer.id, customer] as const));
  }, [customers]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Capture sale</h2>
        <p className="mt-1 text-sm text-slate-500">
          Continue the worksheet workflow: pick the vehicle from live stock, link a customer, and record the payment details in one step.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer source
            </label>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerMode"
                  value="existing"
                  checked={formState.customerMode === "existing"}
                  onChange={() => handleCustomerModeChange("existing")}
                />
                Existing
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerMode"
                  value="new"
                  checked={formState.customerMode === "new"}
                  onChange={() => handleCustomerModeChange("new")}
                />
                New customer
              </label>
            </div>
          </div>

          {formState.customerMode === "existing" ? (
            <div className="md:col-span-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Choose customer
              </label>
              <select
                name="customerId"
                value={formState.customerId}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              >
                <option value="">Select customer…</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.location ?? "Unknown"}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Full name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formState.customerName}
                  onChange={handleFormChange}
                  placeholder="e.g. Albin Mathew"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formState.customerPhone}
                  onChange={handleFormChange}
                  placeholder="9876543210"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </label>
                <input
                  type="text"
                  name="customerLocation"
                  value={formState.customerLocation}
                  onChange={handleFormChange}
                  placeholder="Branch / area"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Vehicle & showroom
            </label>
            <select
              name="vehicleStockId"
              value={formState.vehicleStockId}
              onChange={handleFormChange}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
            >
              <option value="">Select stock entry…</option>
              {loadingStock ? (
                <option value="">Loading stock…</option>
              ) : availableStock.length ? (
                availableStock.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.branch_name ?? "Unassigned"} · {item.model_name} · {item.variant ?? "Standard"} · {item.color ?? "Standard"} ({item.quantity} in stock)
                  </option>
                ))
              ) : (
                <option value="">No stock available</option>
              )}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Showroom filter
            </label>
            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
            >
              <option value="">All showrooms</option>
              {branches?.map((branch: Branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.name} ({branch.city})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Payment received?
            </label>
            <select
              name="isPaymentReceived"
              value={formState.isPaymentReceived ? "yes" : "no"}
              onChange={handleFormChange}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
            >
              <option value="yes">Yes</option>
              <option value="no">Not yet</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Payment mode
            </label>
            <select
              name="paymentMode"
              value={formState.paymentMode}
              onChange={handleFormChange}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Bank / financier
            </label>
            <input
              type="text"
              name="bank"
              value={formState.bank}
              onChange={handleFormChange}
              placeholder="e.g. HDFC"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Amount received (INR)
            </label>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={formState.amount}
              onChange={handleFormChange}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              placeholder="94000"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Payment date
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formState.paymentDate}
              onChange={handleFormChange}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{feedback}</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-honda-red px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300"
              >
                {isSaving ? "Saving…" : "Record sale"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Sales register</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {sortedSales.length} record{sortedSales.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Executive</th>
                <th className="pb-3">Branch</th>
                {isAdmin ? <th className="pb-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loadingSales ? (
                <tr>
                  <td colSpan={salesColumnCount} className="py-6 text-center text-sm text-slate-500">
                    Loading sales…
                  </td>
                </tr>
              ) : sortedSales.length ? (
                sortedSales.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-700">
                      {record.customer?.name ?? customerLookup.get(record.customer_id)?.name ?? "—"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {record.vehicle_name} · {record.variant} · {record.color}
                    </td>
                    <td className="py-3 text-slate-500">{record.payment_mode}</td>
                    <td className="py-3 text-sm font-semibold">
                      {record.is_payment_received ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">Paid</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-slate-700">
                      {formatCurrency(record.amount_received)}
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(record.payment_date)}</td>
                    <td className="py-3 text-slate-500">{record.executive?.username ?? "—"}</td>
                    <td className="py-3 text-slate-500">{record.branch_name ?? "—"}</td>
                    {isAdmin ? (
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(record, !record.is_payment_received)}
                            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            {record.is_payment_received ? "Mark pending" : "Mark paid"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(record)}
                            className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={salesColumnCount} className="py-6 text-center text-sm text-slate-500">
                    No sales captured yet. Use the form above to add the first record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SalesScreen;
