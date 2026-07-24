import type { Opportunity } from '@/types/market-command-center';
import { CommandCenterCard } from './CommandCenterCard';

type TodaysOpportunitiesProps = {
  opportunities: Opportunity[];
};

export function TodaysOpportunities({ opportunities }: TodaysOpportunitiesProps) {
  return (
    <CommandCenterCard title="Today's Opportunities" subtitle="AI-generated ideas">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {opportunities.map((opportunity) => (
          <article key={opportunity.symbol} className="rounded-xl border border-white/10 bg-[#050D18]/45 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#F8FAFC]">{opportunity.symbol}</p>
              <p className={`text-xs font-semibold ${opportunity.side === 'BUY' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{opportunity.side}</p>
            </div>
            <p className="mt-2 text-xs text-[#94A3B8]">Confidence</p>
            <p className="text-2xl font-semibold text-[#F8FAFC]">{opportunity.confidence}%</p>
            <div className="mt-3 space-y-1 text-xs text-[#CBD5E1]">
              <p>Target: {opportunity.target}</p>
              <p>Stop: {opportunity.stop}</p>
              <p>Risk: {opportunity.risk}</p>
              <p>Reward: {opportunity.reward}</p>
            </div>
          </article>
        ))}
      </div>
    </CommandCenterCard>
  );
}
