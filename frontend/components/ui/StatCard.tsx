import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  highlight?: boolean;
};

export function StatCard({ title, value, subtitle, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 p-4 shadow-sm ${
        highlight
          ? 'bg-gradient-to-br from-indigo-500/10 via-slate-950/60 to-slate-950/30'
          : 'bg-slate-950/40'
      }`}
    >
      <p className="text-xs font-medium uppercase text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {subtitle ? <div className="mt-2 text-xs text-slate-500">{subtitle}</div> : null}
    </div>
  );
}
