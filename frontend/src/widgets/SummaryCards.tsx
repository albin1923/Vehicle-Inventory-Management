import { useGetDashboardSummaryQuery } from "../store/api";
import { formatCurrency } from "../utils/format";

const SummaryCards = () => {
  const { data, isFetching } = useGetDashboardSummaryQuery();

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Total Sales</p>
        <p className="mt-2 text-2xl font-semibold text-slate-800">
          {isFetching ? "--" : data?.total_sales ?? 0}
        </p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Revenue</p>
        <p className="mt-2 text-2xl font-semibold text-slate-800">
          {isFetching ? "--" : formatCurrency(data?.total_revenue ?? 0)}
        </p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Pending Transfers</p>
        <p className="mt-2 text-2xl font-semibold text-slate-800">--</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Open Anomalies</p>
        <p className="mt-2 text-2xl font-semibold text-slate-800">--</p>
      </article>
    </section>
  );
};

export default SummaryCards;
