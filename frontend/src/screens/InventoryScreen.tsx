import { useEffect, useMemo, useState } from "react";

import BranchSelector from "../components/BranchSelector";
import useBranchFilter from "../hooks/useBranchFilter";
import {
  useFindNearestInventoryQuery,
  useListInventoryByBranchQuery,
  type InventoryRecord,
} from "../store/api";

const InventoryScreen = () => {
  const { branchId } = useBranchFilter();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const { data, isFetching } = useListInventoryByBranchQuery(branchId ?? 0, {
    skip: branchId === null,
  });

  const { data: nearest, isFetching: isFindingNearest, isError } = useFindNearestInventoryQuery(
    { branchId: branchId ?? 0, modelId: selectedModelId ?? 0 },
    {
      skip: branchId === null || selectedModelId === null,
    },
  );

  const selectedInventory = useMemo(() => {
    if (!data || selectedModelId === null) {
      return null;
    }
    return data.find((record) => record.model_id === selectedModelId) ?? null;
  }, [data, selectedModelId]);

  const handleFindNearest = (modelId: number) => {
    setSelectedModelId(modelId);
  };

  useEffect(() => {
    setSelectedModelId(null);
  }, [branchId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BranchSelector />
      </div>

      {branchId === null ? (
        <p className="text-sm text-slate-500">Select a branch to view inventory.</p>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-700">Inventory</h2>
            {selectedInventory ? (
              <p className="text-sm text-slate-500">
                Selected model: <span className="font-medium text-slate-700">{selectedInventory.model?.name}</span>
              </p>
            ) : null}
          </div>
          {isFetching ? (
            <p className="mt-3 text-sm text-slate-500">Loading...</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Model</th>
                  <th className="py-2">Available</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Reserved</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((item: InventoryRecord) => {
                    const available = Math.max(item.quantity - item.reserved, 0);
                    return (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="py-2">
                          <span className="font-medium text-slate-700">{item.model?.name ?? `Model #${item.model_id}`}</span>
                          {item.model?.external_code ? (
                            <span className="ml-1 text-xs text-slate-400">({item.model.external_code})</span>
                          ) : null}
                        </td>
                        <td className="py-2 font-medium">{available}</td>
                        <td className="py-2 font-medium">{item.quantity}</td>
                        <td className="py-2 text-slate-500">{item.reserved}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                            onClick={() => handleFindNearest(item.model_id)}
                          >
                            Find nearest
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {selectedModelId === null ? (
              <p className="text-sm text-slate-500">Select a model above to locate the nearest branch with available stock.</p>
            ) : isFindingNearest ? (
              <p className="text-sm text-slate-500">Searching for nearby availability...</p>
            ) : isError ? (
              <p className="text-sm text-rose-500">Unable to find nearby availability.</p>
            ) : nearest ? (
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <p>
                  Nearest branch with stock: <span className="font-semibold text-slate-800">{nearest.branch.name}</span> in {nearest.branch.city} ({nearest.branch.code})
                </p>
                <p>
                  Available units: <span className="font-semibold text-slate-800">{nearest.available_quantity}</span>
                </p>
                <p>
                  Approximate distance: <span className="font-semibold text-slate-800">{nearest.distance_km.toFixed(1)}</span> km
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No nearby branches currently have this model in stock.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default InventoryScreen;
