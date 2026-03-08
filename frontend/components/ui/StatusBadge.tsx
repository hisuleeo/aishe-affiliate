type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  pending: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  paid: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  failed: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  canceled: 'border-slate-500/40 bg-slate-500/10 text-slate-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? 'unknown';
  const classes = statusStyles[key] ?? 'border-slate-700 bg-slate-800/40 text-slate-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes}`}>
      {status}
    </span>
  );
}
