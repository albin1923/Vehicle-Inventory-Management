import { FormEvent, useMemo, useState } from "react";

import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useListCustomersQuery,
  useUpdateCustomerMutation,
} from "../store/api";
import type { Customer } from "../store/types";
import useAppSelector from "../hooks/useAppSelector";
import { formatDate } from "../utils/format";

interface CustomerFormState {
  name: string;
  phone?: string;
  location?: string;
}

const emptyForm: CustomerFormState = {
  name: "",
  phone: "",
  location: "",
};

const CustomersScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [formState, setFormState] = useState<CustomerFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { user } = useAppSelector((state) => state.auth);

  const queryArgs = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      location: locationFilter.trim() || undefined,
      limit: 200,
    }),
    [searchTerm, locationFilter],
  );

  const {
    data: customers,
    isFetching,
    isError,
    refetch,
  } = useListCustomersQuery(queryArgs);

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!formState.name.trim()) {
      setFeedback("Customer name is required.");
      return;
    }

    try {
      if (editingId) {
        await updateCustomer({
          id: editingId,
          body: {
            name: formState.name.trim(),
            phone: formState.phone?.trim() || null,
            location: formState.location?.trim() || null,
          },
        }).unwrap();
        setFeedback("Customer updated successfully.");
      } else {
        await createCustomer({
          name: formState.name.trim(),
          phone: formState.phone?.trim() || null,
          location: formState.location?.trim() || null,
        }).unwrap();
        setFeedback("Customer added successfully.");
      }
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save customer.";
      setFeedback(message);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormState({
      name: customer.name,
      phone: customer.phone ?? "",
      location: customer.location ?? "",
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this customer? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(id).unwrap();
      setFeedback("Customer removed.");
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete customer.";
      setFeedback(message);
    }
  };

  const distinctLocations = useMemo(() => {
    if (!customers) {
      return [] as string[];
    }
    const locations = new Set<string>();
    customers.forEach((customer) => {
      if (customer.location) {
        locations.add(customer.location);
      }
    });
    return Array.from(locations).sort((a, b) => a.localeCompare(b));
  }, [customers]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Customer Directory</h2>
            <p className="text-sm text-slate-500">
              Manage customer records. Sales executives can add or edit entries; deletion is restricted to admin users.
            </p>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20 md:w-64"
          />
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20 md:w-52"
          >
            <option value="">All locations</option>
            {distinctLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-3">Name</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Last updated</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    Loading customers…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-red-500">
                    Could not fetch customers. Try refreshing.
                  </td>
                </tr>
              ) : customers && customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-700">{customer.name}</td>
                    <td className="py-3 text-slate-500">{customer.phone ?? "—"}</td>
                    <td className="py-3 text-slate-500">{customer.location ?? "—"}</td>
                    <td className="py-3 text-slate-400">{formatDate(customer.updated_at)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(customer)}
                          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                        >
                          Edit
                        </button>
                        {user?.user_role === "ADMIN" ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(customer.id)}
                            className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No customers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          {editingId ? "Update customer" : "Add new customer"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Provide customer contact details exactly as captured in the dealership sheet for accurate linking with sales records.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer name
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              placeholder="e.g. Rahul Nair"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Phone number
            </label>
            <input
              type="tel"
              value={formState.phone}
              onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              placeholder="e.g. 9876543210"
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Location / branch
            </label>
            <input
              type="text"
              value={formState.location}
              onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-honda-red focus:outline-none focus:ring-2 focus:ring-honda-red/20"
              placeholder="e.g. Vytilla"
            />
          </div>
          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {feedback}
            </div>
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
                {editingId ? (isUpdating ? "Saving…" : "Save changes") : isCreating ? "Adding…" : "Add customer"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CustomersScreen;
