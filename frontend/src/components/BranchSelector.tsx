import { useEffect, useMemo } from "react";

import useBranchFilter from "../hooks/useBranchFilter";
import { useListBranchesQuery, type Branch } from "../store/api";

type Props = {
  label?: string;
};

const BranchSelector = ({ label = "Select Branch" }: Props) => {
  const { branchId, setBranchId } = useBranchFilter();
  const { data } = useListBranchesQuery();

  const options = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (branchId === null && options.length > 0) {
      setBranchId(options[0].id);
    }
  }, [branchId, options, setBranchId]);

  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="font-medium text-slate-600">{label}</span> : null}
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-honda-red focus:outline-none focus:ring-1 focus:ring-honda-red"
        value={branchId ?? ""}
        onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : null)}
        aria-label={label || "Branch"}
      >
        <option value="" className="font-normal text-slate-500">
          Choose a branch
        </option>
        {options.map((branch: Branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} ({branch.city})
          </option>
        ))}
      </select>
    </label>
  );
};

export default BranchSelector;
