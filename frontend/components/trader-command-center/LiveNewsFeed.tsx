import type { NewsItem } from '@/types/market-command-center';
import { CommandCenterCard } from './CommandCenterCard';

type LiveNewsFeedProps = {
  items: NewsItem[];
};

function impactClass(impact: NewsItem['impact']) {
  if (impact === 'high') return 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#FECACA]';
  if (impact === 'medium') return 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#FDE68A]';
  return 'border-white/10 bg-white/[0.02] text-[#CBD5E1]';
}

export function LiveNewsFeed({ items }: LiveNewsFeedProps) {
  return (
    <CommandCenterCard title="Live News Feed" subtitle="FinancialJuice · Bloomberg · ForexFactory · TradingEconomics">
      <div className="space-y-2">
        {items.map((item, index) => (
          <article key={`${item.source}-${index}`} className={`rounded-xl border px-3 py-2 text-xs ${impactClass(item.impact)}`}>
            <p className="font-semibold">{item.time} · {item.source}</p>
            <p className="mt-1">{item.headline}</p>
          </article>
        ))}
      </div>
    </CommandCenterCard>
  );
}
