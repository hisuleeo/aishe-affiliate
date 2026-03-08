import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const DefaultIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-10 w-10 text-slate-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7.5h18M6 7.5V5.25A2.25 2.25 0 018.25 3h7.5A2.25 2.25 0 0118 5.25V7.5M5.25 7.5v11.25A2.25 2.25 0 007.5 21h9a2.25 2.25 0 002.25-2.25V7.5"
    />
  </svg>
);

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 px-6 py-8 text-center">
      {icon ?? <DefaultIcon />}
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-200"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
