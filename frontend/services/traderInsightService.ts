export type TraderPositionIdea = {
  instrument: string;
  bias: string;
  setup: string;
  invalidation: string;
  risk: string;
};

export type TraderInsightResponse = {
  source: 'anthropic' | 'rules';
  generatedAt: string;
  timezone: string;
  aisheId: string;
  packageName: string;
  licence: string;
  validUntil: string;
  summary: string;
  hourlyFocus: string[];
  positionIdeas: TraderPositionIdea[];
  riskChecks: string[];
  disclaimer: string;
  error?: string;
};

export const getTraderInsight = async (id?: string) => {
  const url = id
    ? `/api/v1/data/trader-insight?id=${encodeURIComponent(id)}`
    : '/api/v1/data/trader-insight';

  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    return { error: 'Trader insight alınamadı.' } as TraderInsightResponse;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { error: 'Trader insight için giriş yapmanız gerekiyor.' } as TraderInsightResponse;
  }

  return (await response.json()) as TraderInsightResponse;
};
