type StatusPillProps = {
  value: string;
};

const toneMap: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  in_transit: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  posted: "bg-emerald-100 text-emerald-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  rejected: "bg-rose-100 text-rose-700",
  critical: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-slate-200 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  queued: "bg-amber-100 text-amber-700",
};

const StatusPill = ({ value }: StatusPillProps) => {
  const normalized = value.toLowerCase();
  const classes = toneMap[normalized] ?? "bg-slate-200 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
};

export default StatusPill;
