'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order, Package, PackageOption } from '@shared/types';
import { createOrder, getOrders } from '@/services/orderService';
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
import { User } from 'lucide-react';
import { UserTickets } from '@/components/user/support/UserTickets';

const formatCurrency = (amount: string, currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value);
};

export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });
  const {
    data: packages,
    isLoading: packagesLoading,
    isError: packagesError,
  } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
    enabled: isAuthenticated,
  });
  const { data: referral, isError: referralError } = useQuery({
    queryKey: ['referral-code'],
    queryFn: getReferralCode,
    enabled: isAuthenticated,
  });
  const { data: affiliateLinks, isLoading: affiliateLoading, isError: affiliateErrorState } = useQuery({
    queryKey: ['affiliate-links'],
    queryFn: getAffiliateLinks,
    enabled: isAuthenticated,
  });
  const { showToast } = useToast();
  const [affiliateTargetUrl, setAffiliateTargetUrl] = useState('');
  const [affiliateError, setAffiliateError] = useState<string | null>(null);
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false);
  const [affiliateMetrics, setAffiliateMetrics] = useState<Record<string, {
    totalClicks: number;
    uniqueCookies: number;
    lastClickedAt: string | null;
  }>>({});
  const affiliateInputRef = useRef<HTMLInputElement | null>(null);
  const latestOrders = useMemo(() => (orders ?? []).slice(0, 5), [orders]);
  const totalSpend = useMemo(() => {
    return (orders ?? []).reduce((sum, order) => sum + Number(order.amount), 0);
  }, [orders]);
  const isMetricsLoading = ordersLoading || packagesLoading;
  const spendTrend = useMemo(() => {
    const items = orders ?? [];
    if (items.length < 2) return null;
    const sorted = [...items].slice(0, 10);
    const recent = sorted.slice(0, 5).reduce((sum, order) => sum + Number(order.amount), 0);
    const previous = sorted.slice(5, 10).reduce((sum, order) => sum + Number(order.amount), 0);
    if (previous === 0) return null;
    return Math.round(((recent - previous) / previous) * 100);
  }, [orders]);

  const renderTrendChip = (trend: number | null) => {
    if (trend === null) return 'Son 5 siparişin toplamı.';
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

  const primaryCurrency = orders?.[0]?.currency ?? 'EUR';
  const packageMap = useMemo(
    () => new Map((packages ?? []).map((pkg) => [pkg.id, pkg.name])),
    [packages],
  );

  useEffect(() => {
    if (ordersError) {
      showToast({ title: 'Siparişler yüklenemedi', variant: 'error' });
    }
  }, [ordersError, showToast]);

  useEffect(() => {
    if (packagesError) {
      showToast({ title: 'Paketler yüklenemedi', variant: 'error' });
    }
  }, [packagesError, showToast]);

  useEffect(() => {
    if (referralError) {
      showToast({ title: 'Referral kodu alınamadı', variant: 'error' });
    }
  }, [referralError, showToast]);

  useEffect(() => {
    if (affiliateErrorState) {
      showToast({ title: 'Affiliate linkler yüklenemedi', variant: 'error' });
    }
  }, [affiliateErrorState, showToast]);

  useEffect(() => {
    if (!affiliateLinks || affiliateLinks.length === 0) {
      setAffiliateMetrics({});
      return;
    }

    let isMounted = true;
    Promise.all(
      affiliateLinks.map(async (link) => {
        const metrics = await getAffiliateLinkMetrics(link.id);
        return [
          link.id,
          {
            totalClicks: metrics.totals.totalClicks,
            uniqueCookies: metrics.totals.uniqueCookies,
            lastClickedAt: metrics.totals.lastClickedAt,
          },
        ] as const;
      }),
    )
      .then((entries) => {
        if (!isMounted) return;
        setAffiliateMetrics(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!isMounted) return;
        setAffiliateMetrics({});
      });

    return () => {
      isMounted = false;
    };
  }, [affiliateLinks]);

  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString('tr-TR') : '—';

  return (
    <section className="space-y-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold">Kullanıcı Paneli</h1>
          <p className="mt-2 text-sm text-slate-300">
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
          <button
            type="button"
            className="rounded-full border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-200"
          >
            Raporu Görüntüle
          </button>
          <Link
            href="/order"
            className={`rounded-full border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200 transition ${
              packagesLoading ? 'pointer-events-none opacity-60' : 'hover:border-indigo-400'
            }`}
          >
            Yeni Paket Keşfet
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Toplam Harcama"
          highlight
          value={ordersLoading ? '—' : formatCurrency(String(totalSpend), primaryCurrency)}
          subtitle={renderTrendChip(spendTrend)}
        />
        <StatCard
          title="Sipariş Sayısı"
          value={ordersLoading ? '—' : orders?.length ?? 0}
          subtitle="Son hareketlerini takip et."
        />
        <StatCard
          title="Aktif Paket"
          value={isMetricsLoading ? '—' : latestOrders[0]?.packageId 
            ? (packageMap.get(latestOrders[0].packageId) ?? '—')
            : '—'}
          subtitle="Yenileme için hazır."
        />
        <StatCard
          title="Affiliate Alanı"
          value={affiliateLoading ? '—' : affiliateLinks?.length ?? 0}
          subtitle={
            affiliateLoading ? (
              'Yükleniyor...'
            ) : (affiliateLinks?.length ?? 0) === 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400">Paylaş, kazanmaya başla.</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!referral?.code) return;
                    navigator.clipboard.writeText(referral.code);
                    showToast({ title: 'Referral kodu kopyalandı', variant: 'success' });
                  }}
                  disabled={!referral?.code}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:opacity-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7.5V6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-1.5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
                    />
                  </svg>
                  Kopyala
                </button>
              </div>
            ) : (
              'Paylaşım performansı.'
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Son Siparişler</h2>
            <span className="text-xs text-slate-400">{ordersLoading ? 'Yükleniyor...' : 'Güncel'}</span>
          </div>
          <div className="mt-4 divide-y divide-slate-800/60 rounded-xl border border-slate-800/70 bg-slate-950/40">
            {latestOrders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Henüz sipariş yok"
                  description="Yeni bir paket seçerek başlayabilirsin."
                />
              </div>
            ) : (
              latestOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-100">
                      {packageMap.get(order.packageId) ?? order.packageId}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
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

        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aktif Paketim</h2>
            <span className="text-xs text-slate-400">
              {ordersLoading ? 'Yükleniyor...' : latestOrders.length > 0 ? 'Aktif' : 'Yok'}
            </span>
          </div>
          <div className="mt-4">
            {latestOrders.length === 0 ? (
              <EmptyState
                title="Aktif paket yok"
                description="Henüz bir paket satın almadınız."
              />
            ) : (
              (() => {
                const activeOrder = latestOrders[0];
                const pkg = (packages ?? []).find((p) => p.id === activeOrder.packageId);
                return (
                  <div className="rounded-[28px] border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-500/10 p-5 shadow-[0_20px_50px_-40px_rgba(99,102,241,0.6)]">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{pkg?.name ?? 'Paket'}</p>
                      <p className="mt-2 text-2xl font-bold text-sky-200">
                        {formatCurrency(activeOrder.amount, activeOrder.currency)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(activeOrder.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>

                    {pkg?.description && (
                      <p className="mt-4 text-xs text-slate-400">{pkg.description}</p>
                    )}

                    {activeOrder.aisheId && (
                      <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Kullanılan AISHE ID
                        </p>
                        <p className="mt-1 text-sm font-mono font-semibold text-indigo-300">
                          {activeOrder.aisheId}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-slate-950/40 px-3 py-2">
                      <StatusBadge status={activeOrder.status} />
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aktivite Akışı</h2>
          <span className="text-xs text-slate-400">Son hareketler</span>
        </div>
        <div className="mt-4 space-y-4">
          {ordersLoading ? (
            <EmptyState title="Aktivite yükleniyor" />
          ) : latestOrders.length === 0 ? (
            <EmptyState title="Henüz aktivite kaydı yok" />
          ) : (
            latestOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-500/50 bg-indigo-500/10 text-xs text-indigo-200">
                  {order.status.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">
                    {packageMap.get(order.packageId) ?? 'Paket'} siparişi {order.status}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {formatCurrency(order.amount, order.currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Destek Talepleri Bölümü */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <UserTickets />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Referral Kodum</h2>
            <span className="text-xs text-slate-400">Kişisel kod</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-4">
            <div>
              <p className="text-xs text-slate-400">Kod</p>
              <p className="text-xl font-semibold text-white">{referral?.code ?? '—'}</p>
              <p className="mt-1 text-xs text-slate-500">
                Bu kodu paylaşarak ödül kazanabilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!referral?.code) return;
                navigator.clipboard.writeText(referral.code);
                showToast({ title: 'Kod kopyalandı', variant: 'success' });
              }}
              disabled={!referral?.code}
              className="rounded-lg border border-indigo-500/60 px-4 py-2 text-xs font-semibold text-indigo-200"
            >
              Kopyala
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Affiliate Linkler</h2>
            <span className="text-xs text-slate-400">{affiliateLinks?.length ?? 0} link</span>
          </div>
          <div className="mt-4 space-y-3">
            {affiliateLoading ? (
              <EmptyState title="Affiliate linkler yükleniyor" />
            ) : affiliateLinks && affiliateLinks.length > 0 ? (
              affiliateLinks.slice(0, 3).map((link) => {
                const metrics = affiliateMetrics[link.id];
                return (
                  <div key={link.id} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 text-sm">
                    <p className="font-semibold text-slate-100">{link.code}</p>
                    <p className="mt-1 text-xs text-slate-400">{link.targetUrl}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em]">Tıklama</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {metrics ? metrics.totalClicks : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em]">Tekil</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {metrics ? metrics.uniqueCookies : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em]">Son tıklama</p>
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
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300">Hedef URL</label>
            <input
              ref={affiliateInputRef}
              value={affiliateTargetUrl}
              onChange={(event) => {
                setAffiliateTargetUrl(event.target.value);
                if (affiliateError) setAffiliateError(null);
              }}
              placeholder="https://aishe.app"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />
            {affiliateError ? (
              <p className="text-xs text-rose-300">{affiliateError}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Kampanya veya landing sayfanızın linkini ekleyin.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isCreatingAffiliate}
            onClick={async () => {
              const trimmedUrl = affiliateTargetUrl.trim();
              if (!trimmedUrl) {
                setAffiliateError('Lütfen geçerli bir URL girin.');
                showToast({ title: 'Hedef URL boş olamaz', variant: 'error' });
                return;
              }
              try {
                new URL(trimmedUrl);
              } catch {
                setAffiliateError('Lütfen http/https içeren bir URL girin.');
                showToast({ title: 'Geçersiz URL', variant: 'error' });
                return;
              }

              setIsCreatingAffiliate(true);
              try {
                await createAffiliateLink({ targetUrl: trimmedUrl });
                await queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
                showToast({ title: 'Affiliate link oluşturuldu', variant: 'success' });
                setAffiliateTargetUrl('');
              } catch {
                showToast({
                  title: 'Affiliate link oluşturulamadı',
                  description: 'Lütfen daha sonra tekrar deneyin.',
                  variant: 'error',
                });
              } finally {
                setIsCreatingAffiliate(false);
              }
            }}
            className="mt-4 w-full rounded-lg border border-indigo-500/60 px-4 py-2 text-xs font-semibold text-indigo-200 disabled:opacity-60"
          >
            {isCreatingAffiliate ? 'Oluşturuluyor...' : 'Yeni Affiliate Link Oluştur'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Paket Süresini Uzat</h2>
            <p className="mt-1 text-sm text-slate-400">
              Mevcut paketini 1 ay uzatarak kesintisiz kullanmaya devam et.
            </p>
          </div>
          <button
            type="button"
            disabled={!latestOrders[0]}
            onClick={async () => {
              const activeOrder = latestOrders[0];
              if (!activeOrder) return;
              try {
                await createOrder({ packageId: activeOrder.packageId });
                showToast({ title: 'Uzatma siparişi oluşturuldu', variant: 'success' });
              } catch {
                showToast({
                  title: 'Uzatma işlemi başarısız',
                  description: 'Lütfen tekrar deneyin.',
                  variant: 'error',
                });
              }
            }}
            className="rounded-lg border border-indigo-500/60 px-4 py-2 text-xs font-semibold text-indigo-200 disabled:opacity-50"
          >
            1 Ay Uzat
          </button>
        </div>
      </div>
    </section>
  );
}
