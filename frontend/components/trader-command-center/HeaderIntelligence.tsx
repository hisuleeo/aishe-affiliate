import type { IntelligenceMetric, TradeDecision } from '@/types/market-command-center';
import { CommandCenterCard } from './CommandCenterCard';

function metricToneClass(tone: IntelligenceMetric['tone']) {
  if (tone === 'success') return 'bg-[#22C55E]';
  if (tone === 'warning') return 'bg-[#F59E0B]';
  if (tone === 'danger') return 'bg-[#EF4444]';
  return 'bg-[#06B6D4]';
}

type HeaderIntelligenceProps = {
  marketScore: number;
  metrics: IntelligenceMetric[];
  decision: TradeDecision;
};

export function HeaderIntelligence({ marketScore, metrics, decision }: HeaderIntelligenceProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
      <CommandCenterCard title="AI Market Intelligence" subtitle="Today at a glance">
        <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-cyan-300/20 bg-[#050D18]/70 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#94A3B8]">Market Score</p>
            <p className="mt-3 text-5xl font-semibold leading-none text-[#F8FAFC]">{marketScore}</p>
            <p className="mt-1 text-xs text-[#94A3B8]">/ 100</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-[#94A3B8]">{metric.label}</p>
                  <p className="text-xs text-[#F8FAFC]">{metric.value}</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${metricToneClass(metric.tone)} shadow-[0_0_18px_rgba(6,182,212,0.35)]`}
                    style={{ width: `${Math.max(6, Math.min(100, metric.value))}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </CommandCenterCard>

      <CommandCenterCard title="Su an islem alinabilir mi?" subtitle="Execution decision">
        <div className="rounded-2xl border border-white/10 bg-[#050D18]/65 p-4">
          <p
            className={`text-4xl font-semibold ${decision.isTradableNow ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
          >
            {decision.isTradableNow ? 'EVET' : 'HAYIR'}
          </p>
          <div className="mt-4 space-y-3 text-sm text-[#F8FAFC]">
            <p><span className="text-[#94A3B8]">En guclu senaryo:</span> {decision.strongestScenario}</p>
            <p><span className="text-[#94A3B8]">Iptal seviyesi:</span> {decision.invalidationLevel}</p>
            <p><span className="text-[#94A3B8]">Beklenen hedef:</span> {decision.expectedTarget}</p>
          </div>
        </div>
      </CommandCenterCard>
    </div>
  );
}
