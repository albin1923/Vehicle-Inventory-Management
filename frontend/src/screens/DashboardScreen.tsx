import { useMemo } from "react";

import { useListSalesRecordsQuery, useListVehicleStockQuery } from "../store/api";
import useAppSelector from "../hooks/useAppSelector";
import { formatCurrency, formatDate } from "../utils/format";

const DashboardScreen = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: stock, isFetching: loadingStock } = useListVehicleStockQuery();
  const { data: sales, isFetching: loadingSales } = useListSalesRecordsQuery({ limit: 50 });

  const { totalStock, totalModels, totalSales, totalRevenue } = useMemo(() => {
    const stockCount = stock?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const modelCount = stock ? new Set(stock.map((item) => `${item.model_name}-${item.variant}`)).size : 0;
    const salesCount = sales?.length ?? 0;
    const revenue = sales?.reduce((sum, record) => sum + Number.parseFloat(record.amount_received ?? "0"), 0) ?? 0;
    return {
      totalStock: stockCount,
      totalModels: modelCount,
      totalSales: salesCount,
      totalRevenue: revenue,
    };
  }, [stock, sales]);

  const recentSales = useMemo(() => {
    if (!sales) {
      return [];
    }
    return sales.slice(0, 10);
  }, [sales]);

  const lowStock = useMemo(() => {
    if (!stock) {
      return [];
    }
    return stock
      .filter((item) => item.quantity <= 3)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 8);
  }, [stock]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overview</p>
            <h2 className="text-2xl font-semibold text-slate-800">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track sales, monitor inventory and follow up on deliveries using the same workflow as the Honda spreadsheet.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric label="Units in stock" value={loadingStock ? "…" : totalStock.toString()} />
          <DashboardMetric label="Active model variants" value={loadingStock ? "…" : totalModels.toString()} />
          <DashboardMetric label="Sales captured" value={loadingSales ? "…" : totalSales.toString()} />
          <DashboardMetric
            label="Revenue recorded"
            value={loadingSales ? "…" : formatCurrency(totalRevenue)}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Recent sales</h3>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Latest 10 entries
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
                  <th className="pb-3">Collected</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Executive</th>
                  <th className="pb-3">Showroom</th>
                </tr>
              </thead>
              <tbody>
                {loadingSales ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      Loading sales activity…
                    </td>
                  </tr>
                ) : recentSales.length ? (
                  recentSales.map((record) => (
                    <tr key={record.id} className="border-t border-slate-100">
                      <td className="py-3 font-semibold text-slate-700">{record.customer?.name ?? "—"}</td>
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
                        {formatCurrency(record.amount_received ?? "0")}
                      </td>
                      <td className="py-3 text-slate-500">{formatDate(record.payment_date)}</td>
                      <td className="py-3 text-slate-500">{record.executive?.username ?? "—"}</td>
                      <td className="py-3 text-slate-500">{record.branch_name ?? "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      No sales captured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Low stock alerts</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Trigger replenishment before running out</p>
          <ul className="mt-4 space-y-3 text-sm">
            {loadingStock ? (
              <li className="text-slate-500">Loading stock levels…</li>
            ) : lowStock.length ? (
              lowStock.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <p className="font-semibold text-slate-700">
                    {item.model_name} · {item.variant}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.branch_name ?? "Unassigned"} · {item.color ?? "—"} · {item.quantity} unit
                    {item.quantity === 1 ? "" : "s"} left
                  </p>
                </li>
              ))
            ) : (
              <li className="text-slate-500">All inventory levels look good.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
};

interface DashboardMetricProps {
  label: string;
  value: string;
}

const DashboardMetric = ({ label, value }: DashboardMetricProps) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-inner">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
  </div>
);

export default DashboardScreen;
