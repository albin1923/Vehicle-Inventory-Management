import { useMemo } from "react";

import StatusPill from "../components/StatusPill";
import {
  useListBranchesQuery,
  useListTransferRequestsQuery,
  useListVehicleModelsQuery,
  type Branch,
  type TransferRecord,
  type VehicleModel,
} from "../store/api";
import { formatDateTime } from "../utils/format";

const TransfersScreen = () => {
  const { data, isFetching } = useListTransferRequestsQuery();
  const { data: branches } = useListBranchesQuery();
  const { data: models } = useListVehicleModelsQuery();

  const branchLookup = useMemo(() => {
    const map = new Map<number, Branch>();
    branches?.forEach((branch) => map.set(branch.id, branch));
    return map;
  }, [branches]);

  const modelLookup = useMemo(() => {
    const map = new Map<number, VehicleModel>();
    models?.forEach((model) => map.set(model.id, model));
    return map;
  }, [models]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700">Inter-Branch Transfers</h2>
      <p className="mt-2 text-sm text-slate-500">
        Track transfers pending approval and under movement. Integrate the approve and finalize actions with the `/transfers`
        endpoints when backend workflows are ready.
      </p>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Loading transfers...</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Request</th>
              <th className="py-2">Model</th>
              <th className="py-2">Quantity</th>
              <th className="py-2">Status</th>
              <th className="py-2">Requested</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((transfer: TransferRecord) => (
                <tr key={transfer.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">
                    {branchLookup.get(transfer.from_branch_id)?.code ?? transfer.from_branch_id} {'->'} {branchLookup.get(transfer.to_branch_id)?.code ?? transfer.to_branch_id}
                  </td>
                  <td className="py-2 text-slate-600">
                    {modelLookup.get(transfer.model_id)?.name ?? `Model #${transfer.model_id}`}
                  </td>
                  <td className="py-2 text-slate-600">{transfer.quantity}</td>
                  <td className="py-2 text-slate-500"><StatusPill value={transfer.status} /></td>
                  <td className="py-2 text-slate-500">{formatDateTime(transfer.requested_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  No transfer requests logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default TransfersScreen;
