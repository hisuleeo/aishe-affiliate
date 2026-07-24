"use client";

import type { Order } from "@shared/types";

type Props = {
  order: Order;
  pkg?: {
    isCustom?: boolean;
  } | null;
};

export function AddOrderFeaturesPanel({ order, pkg }: Props) {
  const options = Array.isArray(order.selectedOptions) ? order.selectedOptions : [];

  if (!pkg?.isCustom || options.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#262626]/80 p-3">
      <p className="text-xs font-semibold text-slate-300">Selected features</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <span key={opt} className="rounded-md border border-teal-500/20 bg-teal-500/10 px-2 py-1 text-[11px] text-teal-300">
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}
