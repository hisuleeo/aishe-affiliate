'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminAffiliateLink, AdminAffiliateLinkMetrics, Order } from '@shared/types';
import { PackageManagement } from '../admin/packages/PackageManagement';
import { UsersTable } from '../admin/users/UsersTable';
import { AdminUsersTable } from '../admin/users/AdminUsersTable';
import { OrdersTable } from '../admin/orders/OrdersTable';
import { SupportTicketsTable } from '../admin/support/SupportTicketsTable';
import { ExtensionRequestsTable } from '../admin/extensions/ExtensionRequestsTable';
import { PayoutManagement } from '../admin/payouts/PayoutManagement';
import { ProgramManagement } from '../admin/programs/ProgramManagement';
import { CampaignManagement } from '../admin/campaigns/CampaignManagement';
import { SystemSettings } from '../admin/system/SystemSettings';
import { LogViewer } from '../admin/system/LogViewer';
import { ReportsPanel } from '../admin/reports/ReportsPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/ToastProvider';
import {
  getAdminAffiliateLinkMetrics,
  getAdminAffiliateLinks,
  getAdminOrders,
} from '@/services/adminService';

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount);

export default function AdminDashboard() {
  const { showToast } = useToast();
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => getAdminOrders(),
  });
  const {
    data: affiliateLinks,
    isLoading: linksLoading,
    isError: linksError,
  } = useQuery<AdminAffiliateLink[]>({
    queryKey: ['admin-affiliate-links'],
    queryFn: getAdminAffiliateLinks,
  });
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [affiliatePage, setAffiliatePage] = useState(1);
  const affiliatePageSize = 6;
  const {
    data: linkMetrics,
    isLoading: metricsLoading,
    isError: metricsError,
  } = useQuery<AdminAffiliateLinkMetrics>({
    queryKey: ['admin-affiliate-link-metrics', selectedLinkId],
    queryFn: () => getAdminAffiliateLinkMetrics(selectedLinkId ?? ''),
    enabled: Boolean(selectedLinkId),
  });

  const ordersSummary = useMemo(() => {
    const items = orders ?? [];
    const affiliateOrders = items.filter((order) => order.attributionType === 'AFFILIATE');
    const referralOrders = items.filter((order) => order.attributionType === 'REFERRAL');
    const totalRevenue = items.reduce((sum, order) => sum + Number(order.amount), 0);
    const affiliateRevenue = affiliateOrders.reduce((sum, order) => sum + Number(order.amount), 0);
    const referralRevenue = referralOrders.reduce((sum, order) => sum + Number(order.amount), 0);
    const currency = items[0]?.currency ?? 'EUR';

    return {
      totalOrders: items.length,
      affiliateOrders: affiliateOrders.length,
      referralOrders: referralOrders.length,
      totalRevenue,
      affiliateRevenue,
      referralRevenue,
      currency,
    };
  }, [orders]);

  const revenueTrend = useMemo(() => {
    const items = orders ?? [];
    if (items.length < 2) return null;
    const recent = items.slice(0, 10).reduce((sum, order) => sum + Number(order.amount), 0);
    const previous = items.slice(10, 20).reduce((sum, order) => sum + Number(order.amount), 0);
    if (previous === 0) return null;
    return Math.round(((recent - previous) / previous) * 100);
  }, [orders]);

  const renderTrendChip = (trend: number | null) => {
    if (trend === null) return 'Son 10 sipariş trendi';
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

  useEffect(() => {
    if (ordersError) {
      showToast({ title: 'Sipariş raporu yüklenemedi', variant: 'error' });
    }
  }, [ordersError, showToast]);

  useEffect(() => {
    if (linksError) {
      showToast({ title: 'Affiliate linkler yüklenemedi', variant: 'error' });
    }
  }, [linksError, showToast]);

  const exportAffiliateCsv = () => {
    if (!affiliateLinks || affiliateLinks.length === 0) return;
    const headers = [
      'affiliate_email',
      'affiliate_name',
      'program',
      'target_url',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'total_clicks',
      'created_at',
    ];
    const rows = affiliateLinks.map((link) => [
      link.affiliate.email,
      link.affiliate.name ?? '',
      link.program.name,
      link.targetUrl,
      link.metrics?.topSource ?? '',
      link.metrics?.topMedium ?? '',
      link.metrics?.topCampaign ?? '',
      String(link.metrics?.totalClicks ?? 0),
      link.createdAt ?? '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `affiliate-links-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin panel</p>
          <h1 className="mt-2 text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">
            Yönetim paneline hoş geldin. Tüm API’leri buradan canlı olarak
            görüntüleyebilirsin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-200"
          >
            Günlük Özet
          </button>
          <button
            type="button"
            className="rounded-full border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200"
          >
            Rapor İndir
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Attribution Özeti</h2>
          <span className="text-xs text-slate-400">
            {ordersLoading ? 'Yükleniyor...' : 'Güncel'}
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Toplam Sipariş"
            highlight
            value={ordersSummary.totalOrders}
            subtitle={renderTrendChip(revenueTrend)}
          />
          <StatCard title="Affiliate Sipariş" value={ordersSummary.affiliateOrders} />
          <StatCard title="Referral Sipariş" value={ordersSummary.referralOrders} />
          <StatCard
            title="Toplam Ciro"
            value={formatCurrency(ordersSummary.totalRevenue, ordersSummary.currency)}
          />
          <StatCard
            title="Affiliate Ciro"
            value={formatCurrency(ordersSummary.affiliateRevenue, ordersSummary.currency)}
          />
          <StatCard
            title="Referral Ciro"
            value={formatCurrency(ordersSummary.referralRevenue, ordersSummary.currency)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Affiliate Linkler</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {linksLoading ? 'Yükleniyor...' : `${affiliateLinks?.length ?? 0} link`}
            </span>
            <button
              type="button"
              onClick={exportAffiliateCsv}
              disabled={!affiliateLinks || affiliateLinks.length === 0}
              className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-200 disabled:opacity-50"
            >
              CSV Export
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="sticky top-0 z-10 grid grid-cols-8 gap-4 border-b border-slate-800 bg-slate-950/95 px-6 py-4 text-xs uppercase text-slate-400">
            <span>Affiliate</span>
            <span>Program</span>
            <span>Link</span>
            <span>UTM Source</span>
            <span>UTM Medium</span>
            <span>UTM Campaign</span>
            <span className="text-right">Tıklama</span>
            <span className="text-right">Aksiyon</span>
          </div>
          <div className="divide-y divide-slate-800">
            {linksLoading ? (
              <div className="px-6 py-6">
                <EmptyState title="Affiliate linkler yükleniyor" />
              </div>
            ) : null}
            {(affiliateLinks ?? [])
              .slice((affiliatePage - 1) * affiliatePageSize, affiliatePage * affiliatePageSize)
              .map((link) => (
                <div key={link.id} className="grid grid-cols-8 gap-4 px-6 py-4 text-sm text-slate-200">
                  <div>
                    <p className="font-semibold text-slate-100">
                      {link.affiliate.name ?? link.affiliate.email}
                    </p>
                    <p className="text-xs text-slate-500">{link.affiliate.email}</p>
                  </div>
                  <span className="text-xs text-slate-300">{link.program.name}</span>
                  <div className="truncate text-xs text-slate-400">{link.targetUrl}</div>
                  <span className="text-xs text-slate-400">{link.metrics?.topSource ?? '—'}</span>
                  <span className="text-xs text-slate-400">{link.metrics?.topMedium ?? '—'}</span>
                  <span className="text-xs text-slate-400">{link.metrics?.topCampaign ?? '—'}</span>
                  <span className="text-right text-xs text-slate-200">
                    {link.metrics?.totalClicks ?? 0}
                  </span>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedLinkId(link.id)}
                      className="rounded-lg border border-indigo-500/60 px-3 py-1 text-xs font-semibold text-indigo-200"
                    >
                      Detay
                    </button>
                  </div>
                </div>
              ))}
            {(!affiliateLinks || affiliateLinks.length === 0) && !linksLoading ? (
              <div className="px-6 py-6">
                <EmptyState title="Henüz affiliate link bulunamadı" />
              </div>
            ) : null}
          </div>
          {affiliateLinks && affiliateLinks.length > affiliatePageSize ? (
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 text-xs text-slate-400">
              <span>
                Sayfa {affiliatePage} / {Math.ceil(affiliateLinks.length / affiliatePageSize)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAffiliatePage((prev) => Math.max(1, prev - 1))}
                  disabled={affiliatePage === 1}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAffiliatePage((prev) =>
                      Math.min(prev + 1, Math.ceil(affiliateLinks.length / affiliatePageSize)),
                    )
                  }
                  disabled={affiliatePage >= Math.ceil(affiliateLinks.length / affiliatePageSize)}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {selectedLinkId ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Affiliate Link Detayları</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {linkMetrics?.link.code ?? 'Link bilgileri yükleniyor...'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLinkId(null)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Kapat
              </button>
            </div>

            {metricsLoading ? (
              <div className="mt-4 text-sm text-slate-400">Metrikler yükleniyor...</div>
            ) : metricsError ? (
              <div className="mt-4">
                <EmptyState title="Metrikler yüklenemedi" description="Lütfen tekrar deneyin." />
              </div>
            ) : linkMetrics ? (
              <div className="mt-4 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase text-slate-400">Toplam Tıklama</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {linkMetrics.totals.totalClicks}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase text-slate-400">Tekil Çerez</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {linkMetrics.totals.uniqueCookies}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase text-slate-400">Son Tıklama</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {linkMetrics.totals.lastClickedAt
                        ? new Date(linkMetrics.totals.lastClickedAt).toLocaleString('tr-TR')
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs font-semibold text-slate-300">UTM Source</p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {linkMetrics.utm.sources.length > 0 ? (
                        linkMetrics.utm.sources.map((item) => (
                          <li key={item.value ?? 'none'} className="flex justify-between">
                            <span>{item.value ?? 'unknown'}</span>
                            <span className="text-slate-400">{item.count}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">Henüz UTM kaydı yok.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs font-semibold text-slate-300">UTM Medium</p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {linkMetrics.utm.mediums.length > 0 ? (
                        linkMetrics.utm.mediums.map((item) => (
                          <li key={item.value ?? 'none'} className="flex justify-between">
                            <span>{item.value ?? 'unknown'}</span>
                            <span className="text-slate-400">{item.count}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">Henüz UTM kaydı yok.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs font-semibold text-slate-300">UTM Campaign</p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {linkMetrics.utm.campaigns.length > 0 ? (
                        linkMetrics.utm.campaigns.map((item) => (
                          <li key={item.value ?? 'none'} className="flex justify-between">
                            <span>{item.value ?? 'unknown'}</span>
                            <span className="text-slate-400">{item.count}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">Henüz UTM kaydı yok.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-6 text-sm text-slate-400">
            Detay görmek için listeden bir affiliate link seçin.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Destek Talepleri</h2>
        <SupportTicketsTable />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Uzatma İstekleri</h2>
        <ExtensionRequestsTable />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Payout Yönetimi</h2>
        <PayoutManagement />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Program Yönetimi</h2>
        <ProgramManagement />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Kampanya Yönetimi</h2>
        <CampaignManagement />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sistem Ayarları</h2>
        <SystemSettings />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sistem Logları</h2>
        <LogViewer />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Raporlar ve İstatistikler</h2>
        <ReportsPanel />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Kullanıcılar (ADMIN)</h2>
        <AdminUsersTable />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tüm Kullanıcılar</h2>
        <UsersTable />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Siparişler</h2>
        <OrdersTable />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Paket Yönetimi</h2>
        <PackageManagement />
      </div>
    </section>
  );
}
