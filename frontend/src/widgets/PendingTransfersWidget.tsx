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

const PendingTransfersWidget = () => {
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
    <section className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-700">Transfers In Flight</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {data?.length ?? 0} open
        </span>
      </header>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Loading transfers...</p>
      ) : data && data.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm">
          {data.slice(0, 5).map((transfer: TransferRecord) => (
            <li key={transfer.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">
                  {branchLookup.get(transfer.from_branch_id)?.code ?? transfer.from_branch_id} {'->'} {branchLookup.get(transfer.to_branch_id)?.code ?? transfer.to_branch_id}
                </p>
                <StatusPill value={transfer.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{modelLookup.get(transfer.model_id)?.name ?? `Model #${transfer.model_id}`}</span>
                <span>{transfer.quantity} units</span>
              </div>
              <p className="text-xs text-slate-400">Requested {formatDateTime(transfer.requested_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No transfers are currently pending.</p>
      )}
    </section>
  );
};

export default PendingTransfersWidget;
