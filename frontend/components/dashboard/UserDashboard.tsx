'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import type { Order, Package } from '@shared/types';
import { getOrders } from '@/services/orderService';
import { getPackages } from '@/services/packageService';
import {
  createAffiliateLink,
  getAffiliateLinkMetrics,
  getAffiliateLinks,
  getReferralCode,
} from '@/services/referralService';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/components/auth/useAuth';
import { getTraderInsight, type TraderInsightResponse } from '@/services/traderInsightService';
import {
  User,
  Package as PackageIcon,
  Clock,
  ShoppingBag,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Gift,
  Zap,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { UserTickets } from '@/components/user/support/UserTickets';

const formatCurrency = (amount: string | number, _currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value);
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('tr-TR') : '—';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast({ title: 'Kopyalandı', variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:border-indigo-400/60 hover:bg-indigo-500/20"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Kopyalandı' : 'Kopyala'}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="space-y-2">
        <div className="h-3.5 w-32 animate-pulse rounded bg-slate-800" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-800/70" />
      </div>
      <div className="h-3.5 w-16 animate-pulse rounded bg-slate-800" />
    </div>
  );
}

export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });
  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
    enabled: isAuthenticated,
  });
  const { data: referral } = useQuery({
    queryKey: ['referral-code'],
    queryFn: getReferralCode,
    enabled: isAuthenticated,
  });
  const { data: affiliateLinks, isLoading: affiliateLoading } = useQuery({
    queryKey: ['affiliate-links'],
    queryFn: getAffiliateLinks,
    enabled: isAuthenticated,
  });

  // Affiliate link metrikleri useQueries ile (proper React Query caching)
  const metricsQueries = useQueries({
    queries: (affiliateLinks ?? []).map((link) => ({
      queryKey: ['affiliate-link-metrics', link.id],
      queryFn: () => getAffiliateLinkMetrics(link.id),
      enabled: isAuthenticated && !!link.id,
      staleTime: 60_000,
    })),
  });

  const affiliateMetrics = useMemo(() => {
    const map: Record<string, { totalClicks: number; uniqueCookies: number; lastClickedAt: string | null }> = {};
    (affiliateLinks ?? []).forEach((link, i) => {
      const data = metricsQueries[i]?.data;
      if (data) {
        map[link.id] = {
          totalClicks: data.totals.totalClicks,
          uniqueCookies: data.totals.uniqueCookies,
          lastClickedAt: data.totals.lastClickedAt,
        };
      }
    });
    return map;
  }, [affiliateLinks, metricsQueries]);

  const [affiliateTargetUrl, setAffiliateTargetUrl] = useState('');
  const [affiliateError, setAffiliateError] = useState<string | null>(null);
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false);
  const affiliateInputRef = useRef<HTMLInputElement | null>(null);

  const latestOrders = useMemo(() => (orders ?? []).slice(0, 5), [orders]);
  const latestOrder = latestOrders[0] ?? null;
  const activeOrder = useMemo(() => (orders ?? []).find((o) => o.status === 'paid') ?? null, [orders]);
  const pendingOrder = useMemo(() => (orders ?? []).find((o) => o.status === 'pending') ?? null, [orders]);
  const insightAisheId = activeOrder?.aisheId ?? latestOrder?.aisheId ?? undefined;

  const { data: traderInsight, isLoading: traderInsightLoading } = useQuery<TraderInsightResponse>({
    queryKey: ['trader-insight', insightAisheId],
    queryFn: () => getTraderInsight(insightAisheId),
    enabled: isAuthenticated && !!insightAisheId,
    staleTime: 2 * 60 * 1000,
  });

  const totalSpend = useMemo(
    () => (orders ?? []).reduce((sum, o) => sum + Number(o.amount), 0),
    [orders],
  );

  const primaryCurrency = 'USD';

  const packageMap = useMemo(
    () => new Map((packages ?? []).map((pkg) => [pkg.id, pkg])),
    [packages],
  );

  const spendTrend = useMemo(() => {
    const items = orders ?? [];
    if (items.length < 2) return null;
    const sorted = [...items].slice(0, 10);
    const recent = sorted.slice(0, 5).reduce((sum, o) => sum + Number(o.amount), 0);
    const previous = sorted.slice(5, 10).reduce((sum, o) => sum + Number(o.amount), 0);
    if (previous === 0) return null;
    return Math.round(((recent - previous) / previous) * 100);
  }, [orders]);

  const renderTrendChip = (trend: number | null) => {
    if (trend === null) return 'Toplam harcama.';
    const isPositive = trend >= 0;
    return (
      <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-3 w-3 ${isPositive ? '' : 'rotate-180'}`}
          fill="currentColor"
        >
          <path d="M10 3l5 6H5l5-6z" />
        </svg>
        %{Math.abs(trend)} {isPositive ? 'artış' : 'düşüş'}
      </span>
    );
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }, []);

  const displayName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Kullanıcı';

  return (
    <section className="space-y-6 sm:space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 lg:p-8 shadow-lg">

      {/* Header — Selamlama */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Kullanıcı Paneli</p>
          <h1 className="mt-2 text-2xl font-semibold">
            {greeting}, <span className="text-indigo-300">{displayName}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Siparişlerini, paketlerini ve avantajlarını tek ekranda yönet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            <User className="h-4 w-4" />
            Profilim
          </Link>
          <Link
            href="/order"
            className={`rounded-full border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200 transition ${
              packagesLoading ? 'pointer-events-none opacity-60' : 'hover:border-indigo-400 hover:bg-indigo-500/20'
            }`}
          >
            Yeni Paket Keşfet
          </Link>
        </div>
      </div>

      {/* Pending Sipariş Uyarısı */}
      {!ordersLoading && pendingOrder && !activeOrder && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Siparişiniz admin onayı bekliyor</p>
              <p className="mt-1 text-xs text-amber-400/80">
                <span className="font-medium text-amber-200">{packageMap.get(pendingOrder.packageId)?.name ?? 'Paketiniz'}</span> için
                siparişiniz alındı. Admin onayladıktan sonra AISHE aboneliğiniz otomatik olarak başlayacak.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          title="Toplam Harcama"
          highlight
          value={ordersLoading ? '—' : formatCurrency(totalSpend, primaryCurrency)}
          subtitle={renderTrendChip(spendTrend)}
        />
        <StatCard
          title="Sipariş Sayısı"
          value={ordersLoading ? '—' : (orders?.length ?? 0)}
          subtitle="Tüm siparişlerin."
        />
        <StatCard
          title="Aktif Paket"
          value={
            ordersLoading || packagesLoading
              ? '—'
              : activeOrder
              ? (packageMap.get(activeOrder.packageId)?.name ?? '—')
              : pendingOrder
              ? 'Onay Bekleniyor'
              : 'Yok'
          }
          subtitle={
            activeOrder?.validUntil
              ? `Geçerlilik: ${formatDate(activeOrder.validUntil)}`
              : pendingOrder
              ? (packageMap.get(pendingOrder.packageId)?.name ?? 'Sipariş beklemede')
              : 'Henüz paket yok.'
          }
        />
        <StatCard
          title="Affiliate Linkler"
          value={affiliateLoading ? '—' : (affiliateLinks?.length ?? 0)}
          subtitle={
            (affiliateLinks?.length ?? 0) > 0
              ? 'Paylaşım performansı.'
              : 'İlk linkinizi oluşturun.'
          }
        />
      </div>

      {/* AI Trader Rehberi */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 via-slate-950/40 to-slate-950/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-cyan-100">AI Trader Rehberi</h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1">
              {traderInsight?.source === 'anthropic' ? 'AI Mode' : 'Rule Mode'}
            </span>
            {traderInsight?.aisheId ? (
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 font-mono text-cyan-200">
                {traderInsight.aisheId}
              </span>
            ) : null}
          </div>
        </div>

        {traderInsightLoading ? (
          <div className="mt-4 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-800/70" />
          </div>
        ) : !insightAisheId ? (
          <p className="mt-4 text-sm text-slate-400">
            Rehber üretimi için AISHE ID içeren aktif bir sipariş gerekli.
          </p>
        ) : traderInsight?.error ? (
          <p className="mt-4 text-sm text-amber-300">{traderInsight.error}</p>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-200">{traderInsight?.summary}</p>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Saatlik Odak</p>
                <div className="mt-2 space-y-2 text-xs text-slate-300">
                  {(traderInsight?.hourlyFocus ?? []).map((item, i) => (
                    <p key={`${item}-${i}`}>• {item}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Pozisyon Senaryoları</p>
                <div className="mt-2 space-y-2 text-xs text-slate-300">
                  {(traderInsight?.positionIdeas ?? []).map((idea, i) => (
                    <div key={`${idea.instrument}-${i}`} className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5">
                      <p className="font-semibold text-cyan-200">{idea.instrument} · {idea.bias}</p>
                      <p className="mt-1">Setup: {idea.setup}</p>
                      <p className="mt-1 text-slate-400">Invalidation: {idea.invalidation}</p>
                      <p className="mt-1 text-amber-200">Risk: {idea.risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200">Risk Checklist</p>
              <div className="mt-2 space-y-1.5 text-xs text-amber-100/90">
                {(traderInsight?.riskChecks ?? []).map((item, i) => (
                  <p key={`${item}-${i}`}>• {item}</p>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-amber-200/80">{traderInsight?.disclaimer}</p>
            </div>
          </div>
        )}
      </div>

      {/* Son Siparişler + Aktif Paket */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

        {/* Sol: Son Siparişler */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-indigo-400" />
              Son Siparişler
            </h2>
            <Link
              href="/profile"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              Tümü <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800/70 bg-slate-950/40">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : latestOrders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Henüz sipariş yok"
                  description="Yeni bir paket seçerek başlayabilirsin."
                />
              </div>
            ) : (
              latestOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 truncate">
                      {packageMap.get(order.packageId)?.name ?? order.packageId?.slice(0, 8) ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <p className="font-semibold text-white">
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ: Aktif Paket */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-indigo-400" />
              Aktif Paketim
            </h2>
            <span className={`text-xs font-semibold ${activeOrder ? 'text-emerald-400' : 'text-slate-500'}`}>
              {ordersLoading ? 'Yükleniyor...' : activeOrder ? 'Aktif' : 'Yok'}
            </span>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-800" />
              <div className="h-8 w-1/2 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-800/60" />
            </div>
          ) : !activeOrder && pendingOrder ? (
            <div className="rounded-[24px] border border-amber-500/30 bg-amber-500/5 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <p className="font-semibold text-amber-300">Onay Bekleniyor</p>
              <p className="mt-1 text-xs text-amber-400/70">
                {packageMap.get(pendingOrder.packageId)?.name ?? 'Paketiniz'} siparişi admin tarafından inceleniyor.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(pendingOrder.createdAt).toLocaleString('tr-TR')}
              </p>
              {pendingOrder.aisheId && (
                <div className="mt-3 rounded-xl border border-amber-500/20 bg-slate-950/60 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">AISHE ID</p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-amber-300">{pendingOrder.aisheId}</p>
                </div>
              )}
            </div>
          ) : !activeOrder ? (
            <EmptyState
              title="Aktif paket yok"
              description="Bir paket satın alarak başlayın."
              actionLabel="Paket Keşfet"
              onAction={() => { window.location.href = '/order'; }}
            />
          ) : (() => {
            const pkg = packageMap.get(activeOrder.packageId);
            return (
              <div className="rounded-[24px] border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-500/10 p-5 shadow-[0_20px_50px_-40px_rgba(99,102,241,0.6)]">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{pkg?.name ?? 'Paket'}</p>
                  <p className="mt-2 text-2xl font-bold text-sky-200">
                    {formatCurrency(activeOrder.amount, activeOrder.currency)}
                  </p>
                  {activeOrder.validUntil && (
                    <p className="mt-1 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(activeOrder.validUntil)}&apos;e kadar geçerli
                    </p>
                  )}
                </div>

                {activeOrder.aisheId && (
                  <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      AISHE ID
                    </p>
                    <p className="mt-1 text-sm font-mono font-semibold text-indigo-300">
                      {activeOrder.aisheId}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <StatusBadge status={activeOrder.status} />
                  <Link
                    href="/profile?tab=extensions"
                    className="rounded-lg border border-indigo-500/50 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20 flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Uzat
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Hızlı Erişim */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <h2 className="mb-4 text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          Hızlı Erişim
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <Link
            href="/profile?tab=orders"
            className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm font-semibold text-slate-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/5"
          >
            <ShoppingBag className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Tüm Siparişler</span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
          </Link>
          <Link
            href="/profile?tab=extensions"
            className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm font-semibold text-slate-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/5"
          >
            <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Paket Uzat</span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
          </Link>
          <Link
            href="/profile?tab=affiliate"
            className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm font-semibold text-slate-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/5"
          >
            <TrendingUp className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Affiliate Kazanç</span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
          </Link>
          <Link
            href="/profile?tab=referral"
            className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm font-semibold text-slate-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/5"
          >
            <Gift className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Referral Ödüller</span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
          </Link>
          <Link
            href="/trader-insight"
            className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
          >
            <Activity className="h-5 w-5 text-cyan-300 shrink-0" />
            <span>Trader Insight</span>
            <ArrowRight className="ml-auto h-4 w-4 text-cyan-300/70" />
          </Link>
        </div>
      </div>

      {/* Destek Talepleri */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <UserTickets />
      </div>

      {/* Referral Kodu + Affiliate Linkler */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">

        {/* Referral Kodu */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <h2 className="mb-4 text-base font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-400" />
            Referral Kodum
          </h2>
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
            <p className="text-xs text-slate-500">Kişisel kodun</p>
            <p className="mt-1 text-2xl font-bold tracking-widest text-white">
              {referral?.code ?? '—'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Bu kodu arkadaşlarınla paylaş, her siparişlerinden ödül kazan.
            </p>
            <div className="mt-3">
              {referral?.code ? (
                <CopyButton text={referral.code} />
              ) : (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
              )}
            </div>
          </div>
        </div>

        {/* Affiliate Linkler */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Affiliate Linkler
            </h2>
            <span className="text-xs text-slate-500">{affiliateLinks?.length ?? 0} link</span>
          </div>

          <div className="space-y-3 mb-4">
            {affiliateLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-slate-800" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded bg-slate-800/70" />
                </div>
              ))
            ) : affiliateLinks && affiliateLinks.length > 0 ? (
              affiliateLinks.slice(0, 3).map((link) => {
                const metrics = affiliateMetrics[link.id];
                return (
                  <div key={link.id} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-100">{link.code}</p>
                      <div className="flex items-center gap-1.5">
                        <CopyButton text={`${link.targetUrl}?ref=${link.code}`} />
                        <a
                          href={link.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-400 transition hover:text-slate-200"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 truncate">{link.targetUrl}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Tıklama</p>
                        <p className="mt-1 font-semibold text-slate-100">
                          {metrics ? metrics.totalClicks : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Tekil</p>
                        <p className="mt-1 font-semibold text-slate-100">
                          {metrics ? metrics.uniqueCookies : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Son tıklama</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-100">
                          {metrics ? formatDateTime(metrics.lastClickedAt) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="Henüz affiliate linkiniz yok"
                description="İlk linkinizi oluşturup paylaşmaya başlayın."
                actionLabel="Link Oluştur"
                onAction={() => affiliateInputRef.current?.focus()}
              />
            )}
          </div>

          {/* Yeni link oluşturma formu */}
          <div className="space-y-2 pt-3 border-t border-slate-800/60">
            <label className="text-xs font-semibold text-slate-400">Hedef URL</label>
            <input
              ref={affiliateInputRef}
              value={affiliateTargetUrl}
              onChange={(e) => {
                setAffiliateTargetUrl(e.target.value);
                if (affiliateError) setAffiliateError(null);
              }}
              placeholder="https://aishe.app"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-base text-slate-100 outline-none focus:border-indigo-500 transition min-h-[44px]"
            />
            {affiliateError ? (
              <p className="text-xs text-rose-300">{affiliateError}</p>
            ) : (
              <p className="text-xs text-slate-600">
                Kampanya veya landing sayfanızın linkini ekleyin.
              </p>
            )}
            <button
              type="button"
              disabled={isCreatingAffiliate}
              onClick={async () => {
                const trimmed = affiliateTargetUrl.trim();
                if (!trimmed) {
                  setAffiliateError('Lütfen geçerli bir URL girin.');
                  return;
                }
                try { new URL(trimmed); } catch {
                  setAffiliateError('Lütfen http/https içeren bir URL girin.');
                  return;
                }
                setIsCreatingAffiliate(true);
                try {
                  await createAffiliateLink({ targetUrl: trimmed });
                  await queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
                  showToast({ title: 'Affiliate link oluşturuldu', variant: 'success' });
                  setAffiliateTargetUrl('');
                } catch {
                  showToast({ title: 'Affiliate link oluşturulamadı', variant: 'error' });
                } finally {
                  setIsCreatingAffiliate(false);
                }
              }}
              className="w-full rounded-lg border border-indigo-500/60 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50 min-h-[44px]"
            >
              {isCreatingAffiliate ? 'Oluşturuluyor...' : '+ Yeni Affiliate Link Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
