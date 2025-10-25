import { useMemo } from "react";

import StatusPill from "../components/StatusPill";
import { useListBranchesQuery, useListOpenAnomaliesQuery, type AnomalyRecord, type Branch } from "../store/api";
import { formatDateTime } from "../utils/format";

const AnomaliesScreen = () => {
  const { data, isFetching } = useListOpenAnomaliesQuery();
  const { data: branches } = useListBranchesQuery();

  const branchLookup = useMemo(() => {
    const map = new Map<number, Branch>();
    branches?.forEach((branch) => map.set(branch.id, branch));
    return map;
  }, [branches]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700">Open Data Anomalies</h2>
      <p className="mt-2 text-sm text-slate-500">
        Investigate discrepancies identified by nightly reconciliation jobs. Resolve issues directly in the backend system and mark
        them complete once addressed.
      </p>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Loading anomalies...</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Category</th>
              <th className="py-2">Branch</th>
              <th className="py-2">Details</th>
              <th className="py-2">Severity</th>
              <th className="py-2">Raised</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item: AnomalyRecord) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{item.category}</td>
                  <td className="py-2 text-slate-500">{item.branch_id ? branchLookup.get(item.branch_id)?.code ?? item.branch_id : "--"}</td>
                  <td className="py-2 text-slate-600">{item.description ?? "No additional details."}</td>
                  <td className="py-2 text-slate-500">
                    <StatusPill value={(item.payload?.severity as string | undefined) ?? item.status} />
                  </td>
                  <td className="py-2 text-slate-500">{formatDateTime(item.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  No anomalies detected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default AnomaliesScreen;
