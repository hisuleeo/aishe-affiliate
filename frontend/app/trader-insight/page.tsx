'use client';

import { useEffect, useMemo, useState } from 'react';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock3, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { UserPortalSidebar } from '@/components/layout/UserPortalSidebar';
import { marketCommandCenterData as baseCommandCenterData } from '@/lib/market-command-center/dummy-data';
import {
  buildCommandCenterFromInsight,
  getInsightMetaLabel,
  getQuickActionsFromInsight,
} from '@/lib/market-command-center/merge-insight';
import { getOrders } from '@/services/orderService';
import { getTraderInsight } from '@/services/traderInsightService';
import {
  AITradeCoach,
  CriticalEvents,
  DollarFocus,
  GoldFocus,
  HeaderIntelligence,
  LiveAICommentary,
  LiveNewsFeed,
  MarketSessions,
  QuickActionStrip,
  RiskChecklist,
  TodaysOpportunities,
  TodaysTimeline,
} from '@/components/trader-command-center';

type RefreshMode = 'live' | 'minute' | 'manual';

const REFRESH_INTERVALS: Record<RefreshMode, number> = {
  live: 15_000,
  minute: 60_000,
  manual: 0,
};

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'] });

export default function TraderInsightPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [refreshMode, setRefreshMode] = useState<RefreshMode>('minute');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const intervalMs = REFRESH_INTERVALS[refreshMode];

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });

  const insightAisheId = useMemo(() => {
    const paidOrder = (orders ?? []).find((order) => order.status === 'paid');
    const latestOrder = (orders ?? [])[0];
    return paidOrder?.aisheId ?? latestOrder?.aisheId ?? undefined;
  }, [orders]);

  const {
    data: traderInsight,
    isLoading: traderInsightLoading,
    isFetching: traderInsightFetching,
    refetch: refetchTraderInsight,
    error: traderInsightError,
  } = useQuery({
    queryKey: ['trader-insight', insightAisheId],
    queryFn: () => getTraderInsight(insightAisheId),
    enabled: isAuthenticated && !!insightAisheId,
    refetchInterval: intervalMs > 0 ? intervalMs : false,
  });

  const commandCenterData = useMemo(() => {
    if (!traderInsight || traderInsight.error) {
      return baseCommandCenterData;
    }
    return buildCommandCenterFromInsight(traderInsight, baseCommandCenterData);
  }, [traderInsight]);

  const quickActions = useMemo(() => {
    if (!traderInsight || traderInsight.error) {
      return {
        nowAction: 'Aktif AISHE lisansiniz icin backend baglantisi bekleniyor.',
        nextHourFocus: 'Odenmis siparis ve AISHE ID olusturulduktan sonra AI plani burada gorunur.',
        hardWarning: 'Lisans yoksa yeni paket siparisi verin.',
      };
    }
    return getQuickActionsFromInsight(traderInsight);
  }, [traderInsight]);

  const insightMeta = traderInsight ? getInsightMetaLabel(traderInsight) : null;

  useEffect(() => {
    if (intervalMs <= 0) {
      setSecondsLeft(null);
      return;
    }

    setSecondsLeft(Math.floor(intervalMs / 1000));
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 1) {
          setLastUpdatedAt(new Date());
          return Math.floor(intervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  useEffect(() => {
    if (traderInsight?.generatedAt) {
      setLastUpdatedAt(new Date(traderInsight.generatedAt));
    }
  }, [traderInsight?.generatedAt]);

  const refreshNow = async () => {
    await refetchTraderInsight();
    setLastUpdatedAt(new Date());
    if (intervalMs > 0) {
      setSecondsLeft(Math.floor(intervalMs / 1000));
    }
  };

  const pageLoading = isLoading || ordersLoading || (insightAisheId ? traderInsightLoading : false);

  if (pageLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-transparent text-white">
        <DashboardNavbar />
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 pt-24 sm:px-6">
          <div className="rounded-2xl border border-white/12 bg-[#252525]/85 px-8 py-6 text-sm text-slate-300 backdrop-blur-xl">
            Trader insight yükleniyor...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-[#050D18] text-[#F8FAFC] ${manrope.className}`}>
      <DashboardNavbar />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(6,182,212,0.16),transparent_35%),radial-gradient(circle_at_85%_12%,rgba(34,197,94,0.08),transparent_30%),linear-gradient(180deg,#050D18_0%,#071122_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="flex gap-8">
          <UserPortalSidebar
            user={user}
            activeSection="dashboard"
            newOrderHref="/order?from=trader-insight"
            onLogout={() => {
              logout();
              router.replace('/login');
            }}
          />

          <section className="min-w-0 flex-1 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#0F172A]/60 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#94A3B8]">Market Command Center</p>
                  <h1 className={`mt-2 text-3xl font-semibold text-[#F8FAFC] sm:text-4xl ${spaceGrotesk.className}`}>
                    AI-Powered Intraday Intelligence
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-[#94A3B8]">
                    Bugun ne olacak, su an ne yapmaliyim, onumuzdeki bir saatte nelere dikkat etmeliyim sorularina
                    tek ekranda cevap veren canli karar merkezi.
                  </p>
                  {insightMeta ? (
                    <p className="mt-3 text-xs text-[#A5F3FC]">{insightMeta}</p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-[#06B6D4]/35 bg-[#06B6D4]/10 px-4 py-3 text-xs text-[#CFFAFE]">
                  <p className="font-semibold">
                    Mod: {refreshMode === 'live' ? 'Anlik 15sn' : refreshMode === 'minute' ? 'Dakikalik 60sn' : 'Manuel'}
                    {traderInsightFetching ? ' · guncelleniyor' : ''}
                  </p>
                  <p className="mt-1 text-[#A5F3FC]">Son guncelleme: {lastUpdatedAt.toLocaleString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {!insightAisheId ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Trader insight icin odenmis bir AISHE siparisine ihtiyaciniz var.{' '}
                <button
                  type="button"
                  onClick={() => router.push('/order?from=trader-insight')}
                  className="font-semibold text-amber-50 underline"
                >
                  Siparis ver
                </button>
              </div>
            ) : null}

            {traderInsight?.error ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                {traderInsight.error}
              </div>
            ) : null}

            {traderInsightError ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                Trader insight alinirken bir hata olustu. Lutfen yeniden deneyin.
              </div>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-[#0F172A]/60 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRefreshMode('live')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      refreshMode === 'live' ? 'bg-[#06B6D4] text-[#042433]' : 'border border-white/15 text-[#CBD5E1] hover:border-[#06B6D4]/55'
                    }`}
                  >
                    Anlik (15sn)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefreshMode('minute')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      refreshMode === 'minute' ? 'bg-[#06B6D4] text-[#042433]' : 'border border-white/15 text-[#CBD5E1] hover:border-[#06B6D4]/55'
                    }`}
                  >
                    Dakikalik (60sn)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefreshMode('manual')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      refreshMode === 'manual' ? 'bg-[#06B6D4] text-[#042433]' : 'border border-white/15 text-[#CBD5E1] hover:border-[#06B6D4]/55'
                    }`}
                  >
                    Manuel
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshNow()}
                    disabled={!insightAisheId || traderInsightFetching}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#06B6D4]/35 bg-[#06B6D4]/10 px-3 py-2 text-xs font-semibold text-[#CFFAFE] hover:bg-[#06B6D4]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${traderInsightFetching ? 'animate-spin' : ''}`} />
                    Yenile
                  </button>
                </div>

                <div className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Geri sayim: {secondsLeft == null ? 'manuel' : `${secondsLeft}s`}
                </div>
              </div>
            </div>

            <HeaderIntelligence
              marketScore={commandCenterData.marketScore}
              metrics={commandCenterData.metrics}
              decision={commandCenterData.decision}
            />

            <QuickActionStrip
              nowAction={quickActions.nowAction}
              nextHourFocus={quickActions.nextHourFocus}
              hardWarning={quickActions.hardWarning}
            />

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <TodaysTimeline events={commandCenterData.timeline} />
              <CriticalEvents events={commandCenterData.criticalEvents} />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <MarketSessions sessions={commandCenterData.sessions} />
              <GoldFocus data={commandCenterData.goldFocus} />
              <DollarFocus data={commandCenterData.dollarFocus} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <AITradeCoach messages={commandCenterData.coachMessages} />
              <LiveNewsFeed items={commandCenterData.newsFeed} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
              <RiskChecklist items={commandCenterData.defaultRiskChecklist} />
              <TodaysOpportunities opportunities={commandCenterData.opportunities} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0F172A]/60 p-4 text-xs text-[#94A3B8] backdrop-blur-xl">
              <p>
                {traderInsight?.disclaimer ??
                  'Minimal mod aktif: sadece karar, uyari ve uygulama odakli bilgiler gosterilir.'}
              </p>
              {traderInsight?.source ? (
                <p className="mt-2 text-[#64748B]">
                  Veri kaynagi: {traderInsight.source === 'anthropic' ? 'Anthropic AI' : 'Kural tabanli fallback'}
                  {traderInsight.timezone ? ` · ${traderInsight.timezone}` : ''}
                </p>
              ) : null}
            </div>

            <div className="xl:hidden">
              <div className="rounded-2xl border border-[#06B6D4]/30 bg-[#0F172A]/70 p-4 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#94A3B8]">Live AI Commentary</p>
                <div className="mt-2 space-y-2 text-xs text-[#CFFAFE]">
                  {commandCenterData.liveCommentary.slice(0, 3).map((line, idx) => (
                    <p key={`${line}-${idx}`}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <LiveAICommentary lines={commandCenterData.liveCommentary} />
    </main>
  );
}
