'use client';

import { useMemo, useState } from 'react';
import { CommandCenterCard } from './CommandCenterCard';

type RiskChecklistProps = {
  items: string[];
};

export function RiskChecklist({ items }: RiskChecklistProps) {
  const initialState = useMemo(() => items.map(() => false), [items]);
  const [checked, setChecked] = useState<boolean[]>(initialState);

  return (
    <CommandCenterCard title="Risk Checklist" subtitle="Pre-trade safety protocol">
      <div className="space-y-2">
        {items.map((item, index) => (
          <label
            key={`${item}-${index}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#F8FAFC]"
          >
            <input
              type="checkbox"
              checked={checked[index] ?? false}
              onChange={() =>
                setChecked((prev) => {
                  const next = [...prev];
                  next[index] = !next[index];
                  return next;
                })
              }
              className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#06B6D4]"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </CommandCenterCard>
  );
}
