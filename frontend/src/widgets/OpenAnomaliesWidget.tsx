import StatusPill from "../components/StatusPill";
import { useListOpenAnomaliesQuery, type AnomalyRecord } from "../store/api";
import { formatDateTime } from "../utils/format";

const OpenAnomaliesWidget = () => {
  const { data, isFetching } = useListOpenAnomaliesQuery();

  return (
    <section className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-700">Data Quality Alerts</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {data?.length ?? 0} open
        </span>
      </header>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Gathering anomaly data...</p>
      ) : data && data.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm">
          {data.slice(0, 5).map((anomaly: AnomalyRecord) => (
            <li key={anomaly.id} className="space-y-1 rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">{anomaly.category}</p>
                <StatusPill value={(anomaly.payload?.severity as string | undefined) ?? anomaly.status} />
              </div>
              <p className="text-xs text-slate-500">{anomaly.description ?? "No additional details."}</p>
              <p className="text-xs text-slate-400">Detected {formatDateTime(anomaly.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No anomalies detected in the latest cycle.</p>
      )}
    </section>
  );
};

export default OpenAnomaliesWidget;
