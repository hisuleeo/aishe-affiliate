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

type Tab = 
  | 'overview'
  | 'orders'
  | 'users'
  | 'affiliates'
  | 'packages'
  | 'support'
  | 'extensions'
  | 'payouts'
  | 'programs'
  | 'campaigns'
  | 'settings'
  | 'logs'
  | 'reports';

const menuItems = [
  { id: 'overview' as Tab, label: 'Genel Bakış', icon: '📊' },
  { id: 'orders' as Tab, label: 'Siparişler', icon: '🛒' },
  { id: 'users' as Tab, label: 'Kullanıcılar', icon: '👥' },
  { id: 'affiliates' as Tab, label: 'Affiliate Linkler', icon: '🔗' },
  { id: 'packages' as Tab, label: 'Paketler', icon: '📦' },
  { id: 'support' as Tab, label: 'Destek', icon: '💬' },
  { id: 'extensions' as Tab, label: 'Uzatmalar', icon: '⏱️' },
  { id: 'payouts' as Tab, label: 'Ödemeler', icon: '💰' },
  { id: 'programs' as Tab, label: 'Programlar', icon: '🎯' },
  { id: 'campaigns' as Tab, label: 'Kampanyalar', icon: '📢' },
  { id: 'reports' as Tab, label: 'Raporlar', icon: '📈' },
  { id: 'settings' as Tab, label: 'Ayarlar', icon: '⚙️' },
  { id: 'logs' as Tab, label: 'Loglar', icon: '📝' },
];

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const affiliatePageSize = 10;

  const {
    data: linkMetrics,
    isLoading: metricsLoading,
  } = useQuery<AdminAffiliateLinkMetrics>({
    queryKey: ['admin-affiliate-link-metrics', selectedLinkId],
    queryFn: () => getAdminAffiliateLinkMetrics(selectedLinkId ?? ''),
    enabled: Boolean(selectedLinkId),
  });

  const ordersSummary = useMemo(() => {
    const items = orders ?? [];
    const affiliateOrders = items.filter((order) => order.attributionType === 'affiliate');
    const referralOrders = items.filter((order) => order.attributionType === 'referral');
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
    if (trend === null) return <span className="text-slate-400 text-xs">Son 10 sipariş</span>;
    const isPositive = trend >= 0;
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-3 w-3 ${isPositive ? '' : 'rotate-180'}`}
          fill="currentColor"
        >
          <path d="M10 3l5 6H5l5-6z" />
        </svg>
        {isPositive ? '+' : ''}{Math.abs(trend)}%
      </span>
    );
  };

  const exportAffiliateCsv = () => {
    if (!affiliateLinks || affiliateLinks.length === 0) return;
    const headers = [
      'affiliate_email',
      'affiliate_name',
      'program',
      'link_code',
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
      link.code,
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
    showToast({ title: 'CSV başarıyla indirildi', variant: 'success' });
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold">Attribution Özeti</h2>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="group rounded-xl sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 sm:p-6 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Toplam Sipariş</p>
                      <p className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-bold text-white">{ordersSummary.totalOrders}</p>
                      <div className="mt-1 sm:mt-2">{renderTrendChip(revenueTrend)}</div>
                    </div>
                    <div className="text-3xl sm:text-5xl opacity-30 transition-opacity group-hover:opacity-50 flex-shrink-0">🛒</div>
                  </div>
                </div>

                <div className="group rounded-xl sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 sm:p-6 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Affiliate Sipariş</p>
                      <p className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-bold text-white">{ordersSummary.affiliateOrders}</p>
                      <p className="mt-1 sm:mt-2 text-xs text-slate-500">Link ile gelen</p>
                    </div>
                    <div className="text-3xl sm:text-5xl opacity-30 transition-opacity group-hover:opacity-50 flex-shrink-0">🔗</div>
                  </div>
                </div>

                <div className="group rounded-xl sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 sm:p-6 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Referral Sipariş</p>
                      <p className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-bold text-white">{ordersSummary.referralOrders}</p>
                      <p className="mt-1 sm:mt-2 text-xs text-slate-500">Kod ile gelen</p>
                    </div>
                    <div className="text-3xl sm:text-5xl opacity-30 transition-opacity group-hover:opacity-50 flex-shrink-0">🎁</div>
                  </div>
                </div>

                <div className="group rounded-xl sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 sm:p-6 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Toplam Ciro</p>
                      <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-white truncate">
                        {formatCurrency(ordersSummary.totalRevenue, ordersSummary.currency)}
                      </p>
                      <p className="mt-1 sm:mt-2 text-xs text-slate-500">Tüm siparişler</p>
                    </div>
                    <div className="text-3xl sm:text-5xl opacity-30 transition-opacity group-hover:opacity-50 flex-shrink-0">💰</div>
                  </div>
                </div>

                <div className="group rounded-xl sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4 sm:p-6 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Affiliate Ciro</p>
                      <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-white truncate">
                        {formatCurrency(ordersSummary.affiliateRevenue, ordersSummary.currency)}
                      </p>
                      <p className="mt-1 sm:mt-2 text-xs text-slate-500">Linklerden</p>
                    </div>
                    <div className="text-3xl sm:text-5xl opacity-30 transition-opacity group-hover:opacity-50 flex-shrink-0">📊</div>
                  </div>
                </div>

                <div className="group rounded-xl sm:rounded-2xl border border-slate-700/50 bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-4 sm:p-6 transition-all hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Referral Ciro</p>
                      <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-white truncate">
                        {formatCurrency(ordersSummary.referralRevenue, ordersSummary.currency)}
                      </p>
                      <p className="mt-1 sm:mt-2 text-xs text-slate-500">Kodlardan</p>
                    </div>
                    <div className="text-3xl sm:text-5xl opacity-30 transition-opacity group-hover:opacity-50 flex-shrink-0">🎯</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold">Hızlı Erişim</h2>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                  { tab: 'orders' as Tab, icon: '🛒', title: 'Siparişleri Görüntüle', desc: 'Tüm siparişleri yönet', color: 'indigo' },
                  { tab: 'affiliates' as Tab, icon: '🔗', title: 'Affiliate Linkler', desc: 'Link performansını takip et', color: 'blue' },
                  { tab: 'users' as Tab, icon: '👥', title: 'Kullanıcılar', desc: 'Kullanıcı yönetimi', color: 'green' },
                  { tab: 'support' as Tab, icon: '💬', title: 'Destek', desc: 'Destek taleplerini çöz', color: 'amber' },
                ].map((action) => (
                  <button
                    key={action.tab}
                    onClick={() => setActiveTab(action.tab)}
                    className={`group rounded-lg sm:rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 sm:p-6 text-left transition-all hover:border-${action.color}-500/50 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-${action.color}-500/10`}
                  >
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 transition-transform group-hover:scale-110">{action.icon}</div>
                    <h3 className="font-semibold text-sm sm:text-base text-white transition-colors group-hover:text-white">{action.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400 hidden sm:block">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Siparişler</h2>
                <p className="mt-2 text-sm text-slate-400">Tüm siparişleri görüntüle ve yönet</p>
              </div>
              <div className="rounded-xl bg-slate-800/50 px-4 sm:px-6 py-2 sm:py-3 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Toplam:</span>{' '}
                <span className="ml-2 text-lg sm:text-xl font-bold text-white">{ordersSummary.totalOrders}</span>
              </div>
            </div>
            <OrdersTable />
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Kullanıcı Yönetimi</h2>
              <p className="mt-2 text-sm text-slate-400">Tüm kullanıcıları görüntüle ve yönet</p>
            </div>
            <div className="space-y-6 sm:space-y-8">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 sm:p-6">
                <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold">Admin Kullanıcılar</h3>
                <AdminUsersTable />
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 sm:p-6">
                <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold">Tüm Kullanıcılar</h3>
                <UsersTable />
              </div>
            </div>
          </div>
        );

      case 'affiliates':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Affiliate Linkler</h2>
                <p className="mt-2 text-sm text-slate-400">Link performansını izle ve yönet</p>
              </div>
              <button
                onClick={exportAffiliateCsv}
                disabled={!affiliateLinks || affiliateLinks.length === 0}
                className="flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg sm:text-xl">📥</span>
                <span className="hidden sm:inline">CSV İndir</span>
                <span className="sm:hidden">İndir</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-slate-900/70 border-b border-slate-700/50">
                    <tr>
                      {['Affiliate', 'Link Kodu', 'Program', 'UTM Bilgileri', 'Tıklama', 'İşlem'].map((header) => (
                        <th
                          key={header}
                          className={`px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                            header === 'Tıklama' || header === 'İşlem' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {linksLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-indigo-500" />
                            <span className="text-slate-400">Yükleniyor...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (affiliateLinks ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="text-5xl mb-4 opacity-30">🔗</div>
                          <p className="text-lg text-slate-400">Henüz affiliate link bulunamadı</p>
                        </td>
                      </tr>
                    ) : (
                      (affiliateLinks ?? [])
                        .slice((affiliatePage - 1) * affiliatePageSize, affiliatePage * affiliatePageSize)
                        .map((link) => (
                          <tr key={link.id} className="transition-colors hover:bg-slate-800/40">
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div>
                                <p className="font-semibold text-white text-sm">{link.affiliate.name ?? 'İsimsiz'}</p>
                                <p className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-none">{link.affiliate.email}</p>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <span className="inline-flex rounded-full bg-indigo-500/20 px-2 sm:px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                                {link.code}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300">{link.program.name}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="space-y-1 text-xs">
                                {link.metrics?.topSource && (
                                  <div className="text-slate-400">
                                    <span className="text-slate-500">Source:</span> <span className="text-slate-300">{link.metrics.topSource}</span>
                                  </div>
                                )}
                                {link.metrics?.topMedium && (
                                  <div className="text-slate-400">
                                    <span className="text-slate-500">Medium:</span> <span className="text-slate-300">{link.metrics.topMedium}</span>
                                  </div>
                                )}
                                {!link.metrics?.topSource && !link.metrics?.topMedium && (
                                  <span className="text-slate-500">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                              <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-slate-700/50 px-2 sm:px-4 py-1 sm:py-1.5 text-sm font-bold text-white">
                                <span className="text-sm sm:text-base">🔥</span>
                                {link.metrics?.totalClicks ?? 0}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                              <button
                                onClick={() => setSelectedLinkId(link.id)}
                                className="rounded-lg bg-slate-700/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:text-white"
                              >
                                <span className="hidden sm:inline">Detay →</span>
                                <span className="sm:hidden">→</span>
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {affiliateLinks && affiliateLinks.length > affiliatePageSize && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700/50 bg-slate-900/50 px-4 sm:px-6 py-3 sm:py-4">
                  <span className="text-xs sm:text-sm text-slate-400">
                    Sayfa {affiliatePage} / {Math.ceil(affiliateLinks.length / affiliatePageSize)}
                  </span>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => setAffiliatePage((prev) => Math.max(1, prev - 1))}
                      disabled={affiliatePage === 1}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← <span className="hidden sm:inline">Önceki</span>
                    </button>
                    <button
                      onClick={() =>
                        setAffiliatePage((prev) =>
                          Math.min(prev + 1, Math.ceil(affiliateLinks.length / affiliatePageSize))
                        )
                      }
                      disabled={affiliatePage >= Math.ceil(affiliateLinks.length / affiliatePageSize)}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Sonraki</span> →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Link Details Modal */}
            {selectedLinkId && linkMetrics && (
              <div className="rounded-xl sm:rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-800/70 to-slate-900/70 p-4 sm:p-8 shadow-2xl shadow-indigo-500/10">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Link Detayları</h3>
                    <p className="mt-2 text-sm text-slate-400">{linkMetrics.link.code}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLinkId(null)}
                    className="rounded-lg bg-slate-700/50 px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                  >
                    ✕ <span className="hidden sm:inline">Kapat</span>
                  </button>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
                  {[
                    { label: 'Toplam Tıklama', value: linkMetrics.totals.totalClicks, icon: '🔥' },
                    { label: 'Tekil Ziyaretçi', value: linkMetrics.totals.uniqueCookies, icon: '👤' },
                    { 
                      label: 'Son Tıklama', 
                      value: linkMetrics.totals.lastClickedAt
                        ? new Date(linkMetrics.totals.lastClickedAt).toLocaleDateString('tr-TR')
                        : '—',
                      icon: '⏰'
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <span className="text-xl sm:text-2xl">{stat.icon}</span>
                        <p className="text-xs uppercase tracking-wider text-slate-400">{stat.label}</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                  {[
                    { title: 'UTM Source', data: linkMetrics.utm.sources },
                    { title: 'UTM Medium', data: linkMetrics.utm.mediums },
                    { title: 'UTM Campaign', data: linkMetrics.utm.campaigns },
                  ].map((section) => (
                    <div key={section.title} className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 sm:p-5">
                      <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {section.data.length > 0 ? (
                          section.data.map((item) => (
                            <div key={item.value ?? 'none'} className="flex justify-between text-sm">
                              <span className="text-slate-300 truncate">{item.value ?? 'unknown'}</span>
                              <span className="font-semibold text-white ml-3">{item.count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 italic">Henüz veri yok</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'packages':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Paket Yönetimi</h2>
              <p className="mt-2 text-sm text-slate-400">Paketleri düzenle ve yönet</p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 sm:p-6">
              <PackageManagement />
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Destek Talepleri</h2>
              <p className="mt-2 text-sm text-slate-400">Müşteri destek taleplerini görüntüle ve çöz</p>
            </div>
            <SupportTicketsTable />
          </div>
        );

      case 'extensions':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Uzatma İstekleri</h2>
              <p className="mt-2 text-sm text-slate-400">Sipariş uzatma isteklerini yönet</p>
            </div>
            <ExtensionRequestsTable />
          </div>
        );

      case 'payouts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Ödeme Yönetimi</h2>
              <p className="mt-2 text-sm text-slate-400">Affiliate ödemelerini yönet</p>
            </div>
            <PayoutManagement />
          </div>
        );

      case 'programs':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Program Yönetimi</h2>
              <p className="mt-2 text-sm text-slate-400">Affiliate programlarını yönet</p>
            </div>
            <ProgramManagement />
          </div>
        );

      case 'campaigns':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Kampanya Yönetimi</h2>
              <p className="mt-2 text-sm text-slate-400">Pazarlama kampanyalarını yönet</p>
            </div>
            <CampaignManagement />
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Raporlar ve İstatistikler</h2>
              <p className="mt-2 text-sm text-slate-400">Detaylı raporları görüntüle</p>
            </div>
            <ReportsPanel />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Sistem Ayarları</h2>
              <p className="mt-2 text-sm text-slate-400">Sistem yapılandırmasını yönet</p>
            </div>
            <SystemSettings />
          </div>
        );

      case 'logs':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Sistem Logları</h2>
              <p className="mt-2 text-sm text-slate-400">Sistem aktivitelerini izle</p>
            </div>
            <LogViewer />
          </div>
        );

      default:
        return <div>Tab bulunamadı</div>;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] bg-slate-950">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - navbar altından başlar */}
      <aside
        className={`fixed left-0 top-[56px] z-30 h-[calc(100vh-56px)] transition-all duration-300 ${
          sidebarCollapsed ? 'w-16 sm:w-20' : 'w-56 sm:w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 border-r border-slate-800/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-12 items-center justify-between border-b border-slate-800/50 px-3">
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold text-slate-300">Menü</span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded bg-slate-800/50 p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-white hidden lg:block"
            >
              <span className="text-xs">{sidebarCollapsed ? '→' : '←'}</span>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="border-t border-slate-800/50 p-2">
              <div className="rounded-lg bg-slate-800/30 p-2 text-xs text-slate-500">
                <p className="font-medium text-slate-400">AISHE v1.0</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Button - navbar altında */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-[68px] left-3 z-40 lg:hidden rounded-lg bg-slate-800/90 p-2.5 text-white shadow-lg backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Content */}
      <main
        className={`relative min-w-0 flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="min-h-[calc(100vh-56px)] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
