import { useMemo } from "react";
import { Link } from "react-router-dom";

import BranchSelector from "../components/BranchSelector";
import useBranchFilter from "../hooks/useBranchFilter";
import { useListBranchesQuery } from "../store/api";

const quickLinks = [
  { to: "/inventory", label: "Inventory" },
  { to: "/sales", label: "Sales" },
  { to: "/transfers", label: "Transfers" },
  { to: "/imports", label: "Imports" },
];

const DashboardHero = () => {
  const { branchId } = useBranchFilter();
  const { data: branches } = useListBranchesQuery();

  const branchLabel = useMemo(() => {
    if (branchId === null) {
      return "All branches";
    }

    const branch = branches?.find((item) => item.id === branchId);
    return branch ? `${branch.name} — ${branch.city}` : "Selected branch";
  }, [branchId, branches]);

  return (
    <section className="rounded-3xl bg-gradient-to-r from-honda-red to-[#ff4d4d] text-white shadow-xl">
      <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Honda Modernization</p>
          <h2 className="text-3xl font-semibold">Unified Operations Console</h2>
          <p className="max-w-xl text-sm text-white/80">
            Monitor inventory, sales velocity, and transfer activity across the Honda network. Use the quick links to jump into
            focused workspaces, or narrow the dashboard by selecting a branch.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3 rounded-2xl bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Focus</p>
          <BranchSelector label="" />
          <p className="text-sm text-white/80">Currently viewing: {branchLabel}</p>
        </div>
      </div>
    </section>
  );
};

export default DashboardHero;
