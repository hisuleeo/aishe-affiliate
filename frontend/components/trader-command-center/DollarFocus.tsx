import type { DollarFocus as DollarFocusType } from '@/types/market-command-center';
import { CommandCenterCard } from './CommandCenterCard';

type DollarFocusProps = {
  data: DollarFocusType;
};

export function DollarFocus({ data }: DollarFocusProps) {
  return (
    <CommandCenterCard title="Dollar Focus" subtitle="DXY, US10Y and macro pressure">
      <div className="space-y-3 text-sm text-[#F8FAFC]">
        <p><span className="text-[#94A3B8]">DXY:</span> {data.dxy}</p>
        <p><span className="text-[#94A3B8]">US10Y:</span> {data.us10y}</p>
        <p><span className="text-[#94A3B8]">Fed:</span> {data.fedTone}</p>
        <p><span className="text-[#94A3B8]">Makro Haber:</span> {data.macroNews}</p>
        <p className="rounded-lg border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3 py-2 text-[#FDE68A]">AI Yorumu: {data.aiCommentary}</p>
        <p><span className="text-[#94A3B8]">Altina Etkisi:</span> {data.goldImpact}</p>
      </div>
    </CommandCenterCard>
  );
}
