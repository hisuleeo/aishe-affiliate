import type { TraderInsightResponse } from '@/services/traderInsightService';
import type { MarketCommandCenterData } from '@/types/market-command-center';
import { marketCommandCenterData as baseData } from './dummy-data';

function inferSide(bias: string): 'BUY' | 'SELL' {
  const normalized = bias.toLowerCase();
  if (normalized.includes('bear') || normalized.includes('short') || normalized.includes('sat')) {
    return 'SELL';
  }
  return 'BUY';
}

export function buildCommandCenterFromInsight(
  insight: TraderInsightResponse,
  base: MarketCommandCenterData = baseData,
): MarketCommandCenterData {
  const hourly = insight.hourlyFocus ?? [];
  const ideas = insight.positionIdeas ?? [];
  const firstIdea = ideas[0];
  const riskChecks = insight.riskChecks?.length ? insight.riskChecks : base.defaultRiskChecklist;

  const opportunities =
    ideas.length > 0
      ? ideas.map((idea, index) => ({
          symbol: idea.instrument.split('/')[0]?.trim() || `SETUP-${index + 1}`,
          side: inferSide(idea.bias),
          confidence: insight.source === 'anthropic' ? 78 : 62,
          target: idea.setup,
          stop: idea.invalidation,
          risk: idea.risk,
          reward: idea.setup,
        }))
      : base.opportunities;

  return {
    ...base,
    marketScore: insight.source === 'anthropic' ? 78 : 64,
    decision: {
      isTradableNow: !insight.error && ideas.length > 0,
      strongestScenario: firstIdea?.setup ?? insight.summary ?? base.decision.strongestScenario,
      invalidationLevel: firstIdea?.invalidation ?? base.decision.invalidationLevel,
      expectedTarget: firstIdea?.risk ?? base.decision.expectedTarget,
    },
    coachMessages: insight.summary ? [insight.summary, ...hourly] : base.coachMessages,
    defaultRiskChecklist: riskChecks,
    opportunities,
    liveCommentary: hourly.length > 0 ? hourly : base.liveCommentary,
    goldFocus: {
      ...base.goldFocus,
      scenario: firstIdea?.setup ?? base.goldFocus.scenario,
      aiCommentary: insight.summary ?? base.goldFocus.aiCommentary,
    },
    dollarFocus: {
      ...base.dollarFocus,
      aiCommentary: hourly[0] ?? base.dollarFocus.aiCommentary,
    },
    newsFeed: base.newsFeed.map((item, index) =>
      index === 0 && insight.summary
        ? { ...item, headline: insight.summary, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
        : item,
    ),
  };
}

export function getQuickActionsFromInsight(insight: TraderInsightResponse) {
  const hourly = insight.hourlyFocus ?? [];
  const firstRisk = insight.riskChecks?.[0];
  const firstIdea = insight.positionIdeas?.[0];

  return {
    nowAction: firstIdea?.setup ?? insight.summary ?? 'Pozisyon acmadan once teyitli kirilim bekle.',
    nextHourFocus: hourly[0] ?? 'Sonraki saat icin haber ve likidite takibi yap.',
    hardWarning: firstRisk ?? insight.disclaimer ?? 'Risk limitini asma, stop-loss disiplinini koru.',
  };
}

export function getInsightMetaLabel(insight: TraderInsightResponse) {
  if (insight.error) return null;
  const parts = [
    insight.aisheId ? `AISHE ${insight.aisheId}` : null,
    insight.packageName || null,
    insight.licence ? `Lisans: ${insight.licence}` : null,
    insight.validUntil ? `Gecerlilik: ${insight.validUntil}` : null,
    insight.source === 'anthropic' ? 'AI Mode' : 'Rule Mode',
  ].filter(Boolean);

  return parts.join(' · ');
}
