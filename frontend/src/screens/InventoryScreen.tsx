import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import {
  useAdjustVehicleStockMutation,
  useCreateVehicleStockMutation,
  useDeleteVehicleStockMutation,
  useImportVehicleStockMutation,
  useListBranchesQuery,
  useListVehicleStockQuery,
  useLazyExportVehicleStockQuery,
  useUpdateVehicleStockMutation,
} from "../store/api";
import type { Branch, VehicleStock } from "../store/types";
import useAppSelector from "../hooks/useAppSelector";

interface StockFormState {
  model_name: string;
  model_code: string;
  variant: string;
  color: string;
  branch_code: string;
  quantity: number;
  reserved: number;
}

const defaultForm: StockFormState = {
  model_name: "",
  model_code: "",
  variant: "",
  color: "",
  branch_code: "",
  quantity: 1,
  reserved: 0,
};

const InventoryScreen = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [filters, setFilters] = useState({ model: "", branch: "", inStockOnly: true });
  const [formState, setFormState] = useState<StockFormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const queryArgs = useMemo(
    () => ({
      model_name: filters.model.trim() || undefined,
      branch_code: filters.branch.trim() || undefined,
      in_stock_only: filters.inStockOnly,
    }),
    [filters],
  );

  const { data: stock, isFetching, isError, refetch } = useListVehicleStockQuery(queryArgs);
  const { data: branches } = useListBranchesQuery();

  const [createStock, { isLoading: isCreating }] = useCreateVehicleStockMutation();
  const [updateStock, { isLoading: isUpdating }] = useUpdateVehicleStockMutation();
  const [adjustStock] = useAdjustVehicleStockMutation();
  const [deleteStock] = useDeleteVehicleStockMutation();
  const [importStock, { isLoading: isImporting }] = useImportVehicleStockMutation();
  const [triggerExport, { isFetching: isExporting }] = useLazyExportVehicleStockQuery();

  const isAdmin = user?.user_role === "ADMIN";

  const distinctModels = useMemo(() => {
    if (!stock) {
      return [] as string[];
    }
    return Array.from(new Set(stock.map((item) => item.model_name))).sort((a, b) => a.localeCompare(b));
  }, [stock]);

  const resetForm = () => {
    setFormState(defaultForm);
    setEditingId(null);
  };

  const populateForm = (item: VehicleStock) => {
    setFormState({
      model_name: item.model_name,
      model_code: item.model_code ?? "",
      variant: item.variant ?? "",
      color: item.color ?? "",
      branch_code: item.branch_code ?? "",
      quantity: item.quantity,
      reserved: item.reserved,
    });
    setEditingId(item.id);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "reserved" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!formState.model_name.trim() || !formState.color.trim()) {
      setFeedback("Model name and color are required.");
      return;
    }

    try {
      if (editingId) {
        await updateStock({
          id: editingId,
          body: {
            quantity: formState.quantity,
            reserved: formState.reserved,
            branch_name: branches?.find((branch) => branch.code === formState.branch_code)?.name,
          },
        }).unwrap();
        setFeedback("Stock quantity updated.");
      } else {
        await createStock({
          model_name: formState.model_name.trim(),
          model_code: formState.model_code.trim() || undefined,
          variant: formState.variant.trim() || undefined,
          color: formState.color.trim() || undefined,
          branch_code: formState.branch_code.trim() || undefined,
          quantity: formState.quantity,
          reserved: formState.reserved,
        }).unwrap();
        setFeedback("New stock entry created.");
      }
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save stock entry.";
      setFeedback(message);
    }
  };

  const handleAdjust = async (id: number, delta: number) => {
    try {
      await adjustStock({ id, adjustment: delta }).unwrap();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to adjust quantity.";
      setFeedback(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this stock entry? This will also affect existing sales links.");
    if (!confirmed) {
      return;
    }
    try {
      await deleteStock(id).unwrap();
      if (editingId === id) {
        resetForm();
      }
      setFeedback("Stock entry removed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete stock entry.";
      setFeedback(message);
    }
  };

  const filteredStock = useMemo(() => stock ?? [], [stock]);

  const handleImport = async () => {
    try {
      const result = await importStock().unwrap();
      setFeedback(
        `Imported ${result.processed} rows (${result.created} new, ${result.updated} updated, ${result.removed} removed).`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sync from Excel.";
      setFeedback(message);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await triggerExport().unwrap();
      if (typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `honda-inventory-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      setFeedback("Downloaded latest Excel snapshot.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to export Excel snapshot.";
      setFeedback(message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Vehicle stock</h2>
            <p className="text-sm text-slate-500">
              Use filters to quickly locate stock by model variant or color. Admins can adjust the live quantity directly from this view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={refetch}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Refresh
            </button>
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? "Preparing…" : "Download Excel"}
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isImporting ? "Syncing…" : "Sync from Excel"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Filter by model"
            value={filters.model}
            onChange={(event) => setFilters((prev) => ({ ...prev, model: event.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20 md:w-64"
            list="model-options"
          />
          <datalist id="model-options">
            {distinctModels.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>

          <select
            value={filters.branch}
            onChange={(event) => setFilters((prev) => ({ ...prev, branch: event.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20 md:w-52"
          >
            <option value="">All showrooms</option>
            {branches?.map((branch) => (
              <option key={branch.code} value={branch.code}>
                {branch.name} ({branch.city})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(event) => setFilters((prev) => ({ ...prev, inStockOnly: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-honda-red focus:ring-honda-red"
            />
            Show only items with stock
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-3">Showroom</th>
                <th className="pb-3">Model</th>
                <th className="pb-3">Variant</th>
                <th className="pb-3">Color</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Reserved</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    Loading inventory…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-red-500">
                    Unable to load inventory. Try refreshing.
                  </td>
                </tr>
              ) : filteredStock.length ? (
                filteredStock.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-3 text-slate-500">{item.branch_name ?? "Unassigned"}</td>
                    <td className="py-3 font-semibold text-slate-700">{item.model_name}</td>
                    <td className="py-3 text-slate-500">{item.variant ?? "—"}</td>
                    <td className="py-3 text-slate-500">{item.color ?? "—"}</td>
                    <td className="py-3 font-semibold text-slate-700">{item.quantity}</td>
                    <td className="py-3 font-semibold text-slate-700">{item.reserved}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAdjust(item.id, 1)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjust(item.id, -1)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                            >
                              −1
                            </button>
                            <button
                              type="button"
                              onClick={() => populateForm(item)}
                              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            View only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No stock entries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            {editingId ? "Update stock" : "Add stock entry"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep the stock list aligned with the Honda worksheet. Quantities update automatically when sales are captured.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Model name
              </label>
              <input
                type="text"
                name="model_name"
                value={formState.model_name}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
                placeholder="ACTIVA 125 BS-VI"
                required
                disabled={Boolean(editingId)}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Model code
              </label>
              <input
                type="text"
                name="model_code"
                value={formState.model_code}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
                placeholder="MD002"
                disabled={Boolean(editingId)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Variant
              </label>
              <select
                name="variant"
                value={formState.variant}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              >
                <option value="">Standard</option>
                <option value="ID(DRUM)">ID (Drum)</option>
                <option value="2ID(DISC)">2ID (Disc)</option>
                <option value="3ID(DR.ALLOY)">3ID (Alloy)</option>
                <option value="H SMART">H Smart</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formState.color}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
                placeholder="PEARL NIGHTSTAR BLACK"
                required
                disabled={Boolean(editingId)}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Showroom
              </label>
              <select
                name="branch_code"
                value={formState.branch_code}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              >
                <option value="">Unassigned</option>
                {branches?.map((branch: Branch) => (
                  <option key={branch.code} value={branch.code}>
                    {branch.name} ({branch.city})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formState.quantity}
                onChange={handleFormChange}
                min={0}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Reserved
              </label>
              <input
                type="number"
                name="reserved"
                value={formState.reserved}
                onChange={handleFormChange}
                min={0}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              />
            </div>
            <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-slate-500">{feedback}</span>
              <div className="flex gap-3">
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="rounded-md bg-honda-red px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300"
                >
                  {editingId ? (isUpdating ? "Saving…" : "Save changes") : isCreating ? "Adding…" : "Add stock"}
                </button>
              </div>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
};

export default InventoryScreen;
