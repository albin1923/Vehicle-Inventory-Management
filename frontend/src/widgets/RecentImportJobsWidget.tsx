import StatusPill from "../components/StatusPill";
import { useListImportJobsQuery, type ImportJob } from "../store/api";
import { formatDateTime } from "../utils/format";

const RecentImportJobsWidget = () => {
  const { data, isFetching } = useListImportJobsQuery();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-700">Recent Import Jobs</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last 10</span>
      </header>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Checking import activity...</p>
      ) : data && data.length > 0 ? (
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">File</th>
              <th className="py-2">Status</th>
              <th className="py-2">Progress</th>
              <th className="py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((job: ImportJob) => {
              const processed = Number((job.summary?.processed_rows as number | undefined) ?? job.summary?.processed ?? 0);
              const total = Number((job.summary?.total_rows as number | undefined) ?? job.summary?.total ?? 0);

              return (
                <tr key={job.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{job.source_filename}</td>
                  <td className="py-2 text-slate-500"><StatusPill value={job.status} /></td>
                  <td className="py-2 text-slate-500">{total ? `${processed}/${total}` : "-"}</td>
                  <td className="py-2 text-slate-500">{formatDateTime(job.executed_at ?? job.updated_at ?? job.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No import jobs recorded yet.</p>
      )}
    </section>
  );
};

export default RecentImportJobsWidget;
