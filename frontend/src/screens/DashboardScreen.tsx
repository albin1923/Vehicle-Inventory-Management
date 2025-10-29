import { useMemo } from "react";

import {
  useListBranchesQuery,
  useListSalesRecordsQuery,
  useListVehicleStockQuery,
} from "../store/api";
import useAppSelector from "../hooks/useAppSelector";
import { formatCurrency, formatDate } from "../utils/format";

interface TrendInfo {
  direction: "up" | "down" | "flat";
  value: number;
}

const DashboardScreen = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: stock, isFetching: loadingStock } = useListVehicleStockQuery();
  const { data: sales, isFetching: loadingSales } = useListSalesRecordsQuery({ limit: 50 });
  const { data: branches } = useListBranchesQuery();

  const analytics = useMemo(() => {
    const stockList = stock ?? [];
    const salesList = sales ?? [];
    const branchList = branches ?? [];

    const parseAmount = (value?: string | null) => {
      const parsed = Number.parseFloat(value ?? "0");
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const totalStock = stockList.reduce((sum, item) => sum + item.quantity, 0);
    const reservedUnits = stockList.reduce((sum, item) => sum + item.reserved, 0);
    const availableStock = Math.max(0, totalStock - reservedUnits);
    const totalModels = new Set(
      stockList.map((item) => `${item.model_name}-${item.variant ?? "standard"}`),
    ).size;

    const totalSales = salesList.length;
    const totalRevenue = salesList.reduce((sum, record) => sum + parseAmount(record.amount_received), 0);
    const receivedCount = salesList.filter((record) => record.is_payment_received).length;
    const pendingPayments = totalSales - receivedCount;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let monthSales = 0;
    let prevMonthSales = 0;
    let monthRevenue = 0;
    let prevMonthRevenue = 0;

    salesList.forEach((record) => {
      const created = new Date(record.created_at);
      if (Number.isNaN(created.getTime())) {
        return;
      }
      if (created >= monthStart) {
        monthSales += 1;
        monthRevenue += parseAmount(record.amount_received);
      } else if (created >= prevMonthStart && created <= prevMonthEnd) {
        prevMonthSales += 1;
        prevMonthRevenue += parseAmount(record.amount_received);
      }
    });

    const salesTrendPercent =
      prevMonthSales > 0 ? Math.round(((monthSales - prevMonthSales) / prevMonthSales) * 100) : null;
    const revenueTrendPercent =
      prevMonthRevenue > 0
        ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : null;

    const branchAggregates = new Map<string, { quantity: number; reserved: number }>();
    stockList.forEach((item) => {
      const key = item.branch_name ?? "Unassigned";
      const current = branchAggregates.get(key) ?? { quantity: 0, reserved: 0 };
      current.quantity += item.quantity;
      current.reserved += item.reserved;
      branchAggregates.set(key, current);
    });

    const topBranchEntry = Array.from(branchAggregates.entries()).sort(
      (a, b) => b[1].quantity - a[1].quantity,
    )[0];

    const branchCount = branchList.length;
    const activeBranches = new Set(
      salesList
        .map((record) => record.branch_name ?? record.branch_code ?? "")
        .filter((value) => Boolean(value?.trim())),
    ).size;

    const averageDealSize = totalSales > 0 ? totalRevenue / totalSales : 0;
    const averageStockPerBranch = branchCount > 0 ? Math.round(totalStock / branchCount) : totalStock;

    const collectionsCompletion =
      totalSales > 0 ? Math.round((receivedCount / totalSales) * 100) : 100;

    const coverageRatio = totalStock > 0 ? Math.round((availableStock / totalStock) * 100) : 0;

    return {
      totalStock,
      totalModels,
      totalSales,
      totalRevenue,
      reservedUnits,
      availableStock,
      pendingPayments,
      receivedCount,
      branchCount,
      activeBranches,
      averageDealSize,
      averageStockPerBranch,
      coverageRatio,
      collectionsCompletion: Math.max(0, Math.min(collectionsCompletion, 100)),
      salesTrendPercent,
      revenueTrendPercent,
      monthSales,
      prevMonthSales,
      monthRevenue,
      prevMonthRevenue,
      topBranchName: topBranchEntry?.[0] ?? null,
      topBranchQuantity: topBranchEntry?.[1].quantity ?? 0,
    };
  }, [stock, sales, branches]);

  const {
    totalStock,
    totalModels,
    totalSales,
    totalRevenue,
    reservedUnits,
    availableStock,
    pendingPayments,
    receivedCount,
    branchCount,
    activeBranches,
    averageDealSize,
    averageStockPerBranch,
    coverageRatio,
    collectionsCompletion,
    salesTrendPercent,
    revenueTrendPercent,
    monthSales,
    monthRevenue,
    topBranchName,
    topBranchQuantity,
  } = analytics;

  const recentSales = useMemo(() => (sales ? sales.slice(0, 10) : []), [sales]);

  const lowStock = useMemo(() => {
    if (!stock) {
      return [];
    }
    return stock
      .filter((item) => item.quantity <= 3)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 8);
  }, [stock]);

  const maxLowStockQuantity = useMemo(() => {
    if (lowStock.length === 0) {
      return 1;
    }
    return lowStock.reduce((max, item) => (item.quantity > max ? item.quantity : max), 1);
  }, [lowStock]);

  const heroInsights = useMemo(
    () => [
      {
        title: "Fleet ready",
        value: `${availableStock.toLocaleString()} units available`,
        caption: `${reservedUnits.toLocaleString()} reserved for deliveries`,
      },
      {
        title: "Showroom coverage",
        value:
          branchCount > 0
            ? `${activeBranches.toLocaleString()} of ${branchCount.toLocaleString()} showrooms active`
            : `${activeBranches.toLocaleString()} active showrooms`,
        caption:
          topBranchName !== null
            ? `${topBranchName} leading with ${topBranchQuantity.toLocaleString()} units`
            : "Assign a focus showroom for this week.",
      },
    ],
    [availableStock, reservedUnits, activeBranches, branchCount, topBranchName, topBranchQuantity],
  );

  const salesTrend = useMemo<TrendInfo | null>(() => {
    if (salesTrendPercent === null) {
      return null;
    }
    if (salesTrendPercent === 0) {
      return { direction: "flat", value: 0 };
    }
    return {
      direction: salesTrendPercent > 0 ? "up" : "down",
      value: Math.abs(salesTrendPercent),
    };
  }, [salesTrendPercent]);

  const revenueTrend = useMemo<TrendInfo | null>(() => {
    if (revenueTrendPercent === null) {
      return null;
    }
    if (revenueTrendPercent === 0) {
      return { direction: "flat", value: 0 };
    }
    return {
      direction: revenueTrendPercent > 0 ? "up" : "down",
      value: Math.abs(revenueTrendPercent),
    };
  }, [revenueTrendPercent]);

  const collectionsBarWidth = `${collectionsCompletion}%`;
  const coverageBarWidth = `${Math.max(0, Math.min(100, coverageRatio))}%`;

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-honda-red via-rose-500 to-orange-400 p-8 text-white shadow-glow">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr,1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">Overview</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
              Keep the Honda workbook in sync while giving sales leaders a real-time pulse on inventory, collections,
              and showroom momentum.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {heroInsights.map((item) => (
                <div
                  key={item.title}
                  className="relative overflow-hidden rounded-2xl bg-white/15 p-4 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-1"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                    {item.title}
                  </span>
                  <p className="mt-3 text-lg font-semibold leading-tight">{item.value}</p>
                  <p className="mt-2 text-xs text-white/80">{item.caption}</p>
                  <span className="absolute inset-0 -translate-x-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/40 bg-white/15 p-6 shadow-inner backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Collections pulse</p>
            <h3 className="mt-4 text-3xl font-semibold">{formatCurrency(totalRevenue)}</h3>
            <p className="mt-1 text-sm text-white/80">
              {receivedCount} cleared · {pendingPayments < 0 ? 0 : pendingPayments} pending receipts
            </p>
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: collectionsBarWidth }} />
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-white/75">{collectionsCompletion}% of current cycle</p>
            <div className="mt-6 space-y-3 text-xs text-white/80">
              <div className="flex items-center justify-between">
                <span>Average deal size</span>
                <span className="font-semibold text-white">{formatCurrency(averageDealSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stock per showroom</span>
                <span className="font-semibold text-white">{averageStockPerBranch.toLocaleString()} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Coverage ready</span>
                <span className="font-semibold text-white">{coverageRatio}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Units in stock"
          value={loadingStock ? "…" : totalStock.toLocaleString()}
          hint={`${availableStock.toLocaleString()} ready · ${reservedUnits.toLocaleString()} reserved`}
          accent="indigo"
        />
        <DashboardMetric
          label="Model variants"
          value={loadingStock ? "…" : totalModels.toLocaleString()}
          hint="Live sync with Excel inventory"
          accent="emerald"
        />
        <DashboardMetric
          label="Sales captured"
          value={loadingSales ? "…" : totalSales.toLocaleString()}
          hint={`Month to date: ${monthSales.toLocaleString()}`}
          accent="primary"
          trend={salesTrend}
        />
        <DashboardMetric
          label="Revenue recorded"
          value={loadingSales ? "…" : formatCurrency(totalRevenue)}
          hint={`Month to date: ${formatCurrency(monthRevenue)}`}
          accent="amber"
          trend={revenueTrend}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Recent sales</h3>
              <p className="text-xs uppercase tracking-wide text-slate-400">Latest 10 entries</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Real-time sync
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200/60 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Vehicle</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Collected</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Executive</th>
                  <th className="px-3 py-3 font-semibold">Showroom</th>
                </tr>
              </thead>
              <tbody>
                {loadingSales ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-slate-500">
                      Loading sales activity…
                    </td>
                  </tr>
                ) : recentSales.length ? (
                  recentSales.map((record) => (
                    <tr
                      key={record.id}
                      className="group border-b border-slate-100/80 transition hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-700">{record.customer?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-500">
                        <span className="block font-medium text-slate-700">{record.vehicle_name}</span>
                        <span className="text-xs text-slate-400">{record.variant} · {record.color}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{record.payment_mode}</td>
                      <td className="px-3 py-3 text-sm font-semibold">
                        {record.is_payment_received ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                            Paid
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                            Pending
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {formatCurrency(record.amount_received ?? "0")}
                      </td>
                      <td className="px-3 py-3 text-slate-500">{formatDate(record.payment_date)}</td>
                      <td className="px-3 py-3 text-slate-500">{record.executive?.username ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-500">{record.branch_name ?? "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-slate-500">
                      No sales captured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-lg">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Low stock radar</h3>
            <p className="text-xs uppercase tracking-wide text-slate-400">Trigger replenishment before shortages</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
              <div className="h-full rounded-full bg-gradient-to-r from-honda-red to-rose-500" style={{ width: coverageBarWidth }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Coverage ready for {coverageRatio}% of current demand.</p>
          </div>

          <ul className="space-y-4 text-sm">
            {loadingStock ? (
              <li className="rounded-2xl bg-slate-100/70 px-4 py-5 text-slate-500">Loading stock levels…</li>
            ) : lowStock.length ? (
              lowStock.map((item) => {
                const width = `${Math.max(10, Math.round((item.quantity / maxLowStockQuantity) * 100))}%`;
                return (
                  <li
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-4 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.model_name} · {item.variant ?? "Standard"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.branch_name ?? "Unassigned"} · {item.color ?? "Standard"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-honda-red">
                        {item.quantity} left
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-honda-red via-orange-400 to-amber-400"
                        style={{ width }}
                      />
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl bg-emerald-50 px-4 py-5 text-sm font-semibold text-emerald-600">
                All inventory levels look good.
              </li>
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
  hint?: string;
  accent?: "primary" | "emerald" | "indigo" | "amber";
  trend?: TrendInfo | null;
}

const DashboardMetric = ({ label, value, hint, accent = "primary", trend }: DashboardMetricProps) => {
  const accentStyles: Record<NonNullable<DashboardMetricProps["accent"]>, string> = {
    primary: "from-honda-red/90 via-rose-500/70 to-orange-400/70",
    emerald: "from-emerald-500/70 via-teal-400/70 to-emerald-300/60",
    indigo: "from-indigo-500/70 via-sky-500/70 to-indigo-300/60",
    amber: "from-amber-500/80 via-orange-400/70 to-amber-300/60",
  };

  const trendColor = trend
    ? trend.direction === "up"
      ? "text-emerald-600"
      : trend.direction === "down"
        ? "text-amber-600"
        : "text-slate-500"
    : "";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${accentStyles[accent]}`}
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      {trend ? (
        <span className={`mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ${trendColor}`}>
          {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
          {trend.value}%
          <span className="text-[10px] uppercase tracking-wide text-slate-400">vs last month</span>
        </span>
      ) : null}
    </div>
  );
};

export default DashboardScreen;
