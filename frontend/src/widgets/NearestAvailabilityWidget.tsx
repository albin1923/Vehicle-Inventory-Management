import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import BranchSelector from "../components/BranchSelector";
import useBranchFilter from "../hooks/useBranchFilter";
import {
  useFindNearestInventoryQuery,
  useListBranchesQuery,
  useListInventoryByBranchQuery,
  useListVehicleModelsQuery,
  type Branch,
  type VehicleModel,
} from "../store/api";

const NearestAvailabilityWidget = () => {
  const { branchId } = useBranchFilter();
  const { data: branches } = useListBranchesQuery();
  const { data: models } = useListVehicleModelsQuery();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);

  const sortedModels = useMemo(() => {
    if (!models) {
      return [] as VehicleModel[];
    }
    return [...models].sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  const currentBranch: Branch | null = useMemo(() => {
    if (branchId === null) {
      return null;
    }
    return branches?.find((branch) => branch.id === branchId) ?? null;
  }, [branchId, branches]);

  const { data: inventoryData, isFetching: isLoadingInventory } = useListInventoryByBranchQuery(branchId ?? 0, {
    skip: branchId === null,
  });

  const selectedModel: VehicleModel | null = useMemo(() => {
    if (selectedModelId === null) {
      return null;
    }
    return sortedModels.find((model) => model.id === selectedModelId) ?? null;
  }, [sortedModels, selectedModelId]);

  const currentBranchAvailable = useMemo(() => {
    if (!inventoryData || selectedModelId === null) {
      return null;
    }
  const record = inventoryData.find((item) => item.model_id === selectedModelId);
    if (!record) {
      return 0;
    }
    return Math.max(record.quantity - record.reserved, 0);
  }, [inventoryData, selectedModelId]);

  const shouldFetchNearest = branchId !== null && selectedModelId !== null;

  const {
    data: nearest,
    isFetching: isCheckingNearest,
    isError: nearestError,
  } = useFindNearestInventoryQuery(
    { branchId: branchId ?? 0, modelId: selectedModelId ?? 0 },
    { skip: !shouldFetchNearest },
  );

  useEffect(() => {
    setSelectedModelId(null);
  }, [branchId]);

  const renderStatus = () => {
    if (branchId === null) {
      return <p className="text-sm text-slate-500">Choose your showroom to begin tracking availability.</p>;
    }

    if (!sortedModels.length) {
      return <p className="text-sm text-slate-500">No vehicle models are registered in the system yet.</p>;
    }

    if (selectedModelId === null || !selectedModel) {
      return <p className="text-sm text-slate-500">Select a vehicle model to locate nearby stock.</p>;
    }

    if (currentBranchAvailable !== null && currentBranchAvailable > 0) {
      const available = currentBranchAvailable;
      return (
        <div className="space-y-2 text-sm text-emerald-700">
          <p className="font-semibold text-emerald-800">
            In stock at {currentBranch?.name ?? "selected showroom"}
          </p>
          <p>
            {available} unit{available === 1 ? "" : "s"} currently available. You can manage reservations from the
            <Link to="/inventory" className="ml-1 font-semibold text-emerald-800 underline">
              inventory workspace
            </Link>
            .
          </p>
        </div>
      );
    }

    if (isLoadingInventory) {
      return <p className="text-sm text-slate-500">Checking local inventory…</p>;
    }

    if (isCheckingNearest) {
      return <p className="text-sm text-slate-500">Searching the network for nearby availability…</p>;
    }

    if (nearestError || !nearest) {
      return <p className="text-sm text-rose-500">No nearby showrooms currently have stock for this model.</p>;
    }

    const candidate = nearest;
    return (
      <div className="space-y-2 text-sm text-slate-600">
        <p className="text-base font-semibold text-slate-800">
          Route customers to {candidate.branch.name} ({candidate.branch.code})
        </p>
        <p>
          Available quantity: <span className="font-semibold text-slate-800">{candidate.available_quantity}</span>
        </p>
        <p>
          Approximate distance from {currentBranch?.city ?? "your showroom"}: 
          <span className="ml-1 font-semibold text-slate-800">{candidate.distance_km.toFixed(1)} km</span>
        </p>
        <p>
          {candidate.branch.city} showroom contact ready — initiate a transfer in the
          <Link to="/transfers" className="ml-1 font-semibold text-slate-700 underline">
            transfers workspace
          </Link>
          .
        </p>
      </div>
    );
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-700">Nearest Showroom Availability</h2>
        <p className="text-sm text-slate-500">
          Select your current showroom and model to quickly locate nearby branches with available stock — perfect for helping
          sales teams redirect customers without delay.
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <BranchSelector label="Your showroom" />
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="font-medium">Vehicle model</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-honda-red focus:outline-none focus:ring-1 focus:ring-honda-red"
            value={selectedModelId ?? ""}
            onChange={(event) => setSelectedModelId(event.target.value ? Number(event.target.value) : null)}
            disabled={!sortedModels.length}
          >
            <option value="" className="font-normal text-slate-500">
              Select a model
            </option>
            {sortedModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
        {renderStatus()}
      </div>
    </section>
  );
};

export default NearestAvailabilityWidget;
