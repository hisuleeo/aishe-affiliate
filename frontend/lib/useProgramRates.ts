import { useMemo } from "react";

export function useProgramRates() {
  return useMemo(
    () => ({
      tier1Percent: 0.1,
      tier2Percent: 0.03,
    }),
    [],
  );
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
