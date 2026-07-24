import type { GoldFocus as GoldFocusType } from '@/types/market-command-center';
import { CommandCenterCard } from './CommandCenterCard';

type GoldFocusProps = {
  data: GoldFocusType;
};

export function GoldFocus({ data }: GoldFocusProps) {
  return (
    <CommandCenterCard title="Gold Focus · XAUUSD" subtitle="Bias, structure and execution map">
      <div className="space-y-3 text-sm text-[#F8FAFC]">
        <p><span className="text-[#94A3B8]">Bugunku Bias:</span> {data.bias}</p>
        <p><span className="text-[#94A3B8]">Premium / Discount:</span> {data.premiumDiscount}</p>
        <p><span className="text-[#94A3B8]">Likidite:</span> {data.liquidity}</p>
        <p><span className="text-[#94A3B8]">Order Block:</span> {data.orderBlock}</p>
        <p><span className="text-[#94A3B8]">FVG:</span> {data.fvg}</p>
        <p><span className="text-[#94A3B8]">MSS:</span> {data.mss}</p>
        <p><span className="text-[#94A3B8]">Beklenen Senaryo:</span> {data.scenario}</p>
        <p className="rounded-lg border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-3 py-2 text-[#CFFAFE]">AI Yorumu: {data.aiCommentary}</p>
        <div className="grid gap-2 pt-1 text-xs sm:grid-cols-2">
          <p>Kritik Saatler: <span className="text-[#F8FAFC]">{data.criticalHours.join(', ')}</span></p>
          <p>Volatilite: <span className={data.volatility === 'High' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>{data.volatility}</span></p>
          <p>Destek: <span className="text-[#22C55E]">{data.support.join(' · ')}</span></p>
          <p>Direnc: <span className="text-[#EF4444]">{data.resistance.join(' · ')}</span></p>
        </div>
      </div>
    </CommandCenterCard>
  );
}
