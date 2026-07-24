export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;

export type IntelligenceMetric = {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'danger';
};

export type TradeDecision = {
  isTradableNow: boolean;
  strongestScenario: string;
  invalidationLevel: string;
  expectedTarget: string;
};

export type TimelineEvent = {
  time: string;
  title: string;
  subtitle: string;
  importance: ImportanceLevel;
};

export type CriticalEvent = {
  time: string;
  currency: string;
  title: string;
  impact: ImportanceLevel;
  forecast: string;
  previous: string;
  aiCommentary: string;
};

export type MarketSession = {
  name: 'Sydney' | 'Tokyo' | 'London' | 'New York';
  open: string;
  close: string;
};

export type GoldFocus = {
  bias: 'Bullish' | 'Bearish' | 'Range';
  premiumDiscount: string;
  liquidity: string;
  orderBlock: string;
  fvg: string;
  mss: string;
  scenario: string;
  aiCommentary: string;
  criticalHours: string[];
  support: string[];
  resistance: string[];
  volatility: 'Low' | 'Medium' | 'High';
};

export type DollarFocus = {
  dxy: string;
  us10y: string;
  fedTone: string;
  macroNews: string;
  aiCommentary: string;
  goldImpact: string;
};

export type NewsItem = {
  source: 'FinancialJuice' | 'Bloomberg' | 'ForexFactory' | 'TradingEconomics';
  headline: string;
  time: string;
  impact: 'low' | 'medium' | 'high';
};

export type Opportunity = {
  symbol: string;
  side: 'BUY' | 'SELL';
  confidence: number;
  target: string;
  stop: string;
  risk: string;
  reward: string;
};

export type MarketCommandCenterData = {
  marketScore: number;
  metrics: IntelligenceMetric[];
  decision: TradeDecision;
  timeline: TimelineEvent[];
  criticalEvents: CriticalEvent[];
  sessions: MarketSession[];
  goldFocus: GoldFocus;
  dollarFocus: DollarFocus;
  coachMessages: string[];
  newsFeed: NewsItem[];
  defaultRiskChecklist: string[];
  opportunities: Opportunity[];
  liveCommentary: string[];
};
