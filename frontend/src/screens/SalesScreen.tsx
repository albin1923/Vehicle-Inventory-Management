import { useMemo } from "react";

import { useListRecentSalesQuery, useListVehicleModelsQuery, type SaleRecord, type VehicleModel } from "../store/api";
import { formatCurrency } from "../utils/format";

const SalesScreen = () => {
  const { data, isFetching } = useListRecentSalesQuery();
  const { data: models } = useListVehicleModelsQuery();

  const modelLookup = useMemo(() => {
    const map = new Map<number, VehicleModel>();
    models?.forEach((model) => map.set(model.id, model));
    return map;
  }, [models]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Recent Sales</h2>
      </header>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Loading sales data...</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Sale</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((sale: SaleRecord) => (
                <tr key={sale.id} className="border-t border-slate-100">
                  <td className="py-2">
                    {sale.model?.name ?? modelLookup.get(sale.model_id)?.name ?? `Sale #${sale.id}`}
                  </td>
                  <td className="py-2 font-medium">{formatCurrency(sale.sale_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-6 text-center text-sm text-slate-500">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default SalesScreen;
