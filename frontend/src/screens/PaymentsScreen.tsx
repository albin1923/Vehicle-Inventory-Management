import { useMemo } from "react";

import { useListBranchesQuery, useListPendingPaymentsQuery, type Branch, type PaymentRecord } from "../store/api";
import StatusPill from "../components/StatusPill";
import { formatCurrency, formatDate } from "../utils/format";

const PaymentsScreen = () => {
  const { data, isFetching } = useListPendingPaymentsQuery();
  const { data: branches } = useListBranchesQuery();

  const branchLookup = useMemo(() => {
    const map = new Map<number, Branch>();
    branches?.forEach((branch) => map.set(branch.id, branch));
    return map;
  }, [branches]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700">Payments Tracking</h2>
      <p className="mt-2 text-sm text-slate-500">
        Monitor receipts awaiting reconciliation. Once integrated with the ERP adapter, actions here will mark payments as posted.
      </p>
      {isFetching ? (
        <p className="mt-4 text-sm text-slate-500">Loading payments...</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Reference</th>
              <th className="py-2">Branch</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">Received</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((payment: PaymentRecord) => (
                <tr key={payment.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{payment.reference ?? `PAY-${payment.id}`}</td>
                  <td className="py-2 text-slate-500">
                    {branchLookup.get(payment.branch_id)?.code ?? payment.branch_id}
                  </td>
                  <td className="py-2 text-slate-600">{formatCurrency(payment.amount)}</td>
                  <td className="py-2 text-slate-500"><StatusPill value={payment.status} /></td>
                  <td className="py-2 text-slate-500">{formatDate(payment.received_on)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                  No pending payments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default PaymentsScreen;
