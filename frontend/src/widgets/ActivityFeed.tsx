import { useMemo } from "react";

import { useListRecentSalesQuery, useListVehicleModelsQuery, type SaleRecord } from "../store/api";
import { formatCurrency } from "../utils/format";

const ActivityFeed = () => {
  const { data } = useListRecentSalesQuery();
  const { data: models } = useListVehicleModelsQuery();

  const modelLookup = useMemo(() => {
    const map = new Map<number, string>();
    models?.forEach((model) => map.set(model.id, model.name));
    return map;
  }, [models]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700">Recent Sales Activity</h2>
      <ul className="mt-4 space-y-3">
        {data && data.length > 0 ? (
          data.slice(0, 5).map((sale: SaleRecord) => (
            <li key={sale.id} className="flex items-center justify-between text-sm text-slate-600">
              <span>{sale.model?.name ?? modelLookup.get(sale.model_id) ?? `Sale #${sale.id}`}</span>
              <span className="font-medium">{formatCurrency(sale.sale_price)}</span>
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">No recent sales yet.</li>
        )}
      </ul>
    </section>
  );
};

export default ActivityFeed;
