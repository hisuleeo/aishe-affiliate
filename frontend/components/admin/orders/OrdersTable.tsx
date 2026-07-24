'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order, Package } from '@shared/types';
import { updateOrderStatus } from '@/services/orderService';
import { getAdminOrders } from '@/services/adminService';
import { useToast } from '@/components/ui/ToastProvider';
import { getPackages } from '@/services/packageService';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const formatCurrency = (amount: string, _currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value);
};

export function OrdersTable() {
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<Record<string, Order['status']>>({});
  const [attributionFilter, setAttributionFilter] = useState<'all' | 'affiliate' | 'referral' | 'none'>(
    'all',
  );
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { showToast } = useToast();
  const { data, isLoading, error } = useQuery<Order[]>({
    queryKey: ['admin-orders', attributionFilter],
    queryFn: () =>
      getAdminOrders(attributionFilter === 'all' ? undefined : attributionFilter),
  });
  const { data: packageData } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) =>
      updateOrderStatus(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      showToast({ title: 'Sipariş güncellendi', variant: 'success' });
    },
    onError: () => {
      showToast({
        title: 'Sipariş güncellenemedi',
        description: 'Lütfen admin yetkisini kontrol edin.',
        variant: 'error',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, { status: 'paid' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      showToast({ title: 'AISHE aktifleştirildi', description: 'Kullanıcının aboneliği başlatıldı.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Onaylama başarısız', variant: 'error' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, { status: 'canceled' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      showToast({ title: 'Sipariş iptal edildi', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'İptal başarısız', variant: 'error' });
    },
  });

  useEffect(() => {
    if (error) {
      showToast({
        title: 'Siparişler alınamadı',
        description: 'Lütfen admin yetkisini ve bağlantıyı kontrol edin.',
        variant: 'error',
      });
    }
  }, [error, showToast]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Siparişler yükleniyor...
      </div>
    );
  }

  const orders = data ?? [];
  const packageMap = new Map((packageData ?? []).map((pkg) => [pkg.id, pkg]));
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const otherOrders = orders.filter((o) => o.status !== 'pending');
  const totalPages = Math.max(1, Math.ceil(otherOrders.length / pageSize));
  const pagedOrders = otherOrders.slice((page - 1) * pageSize, page * pageSize);
  const isMutating = approveMutation.isPending || rejectMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">

      {/* Bekleyen Siparişler — Admin Onayı Gerekli */}
      {pendingOrders.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-3 border-b border-amber-500/20 px-6 py-4">
            <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-300">Onay Bekleyen Siparişler</p>
              <p className="text-xs text-amber-400/70">{pendingOrders.length} sipariş admin onayı bekliyor. Onaylandığında AISHE aktifleşir.</p>
            </div>
          </div>
          <div className="divide-y divide-amber-500/10">
            {pendingOrders.map((order) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">
                        {packageMap.get(order.packageId)?.name ?? 'Bilinmeyen Paket'}
                      </p>
                      <span className="text-xs text-slate-400">{formatCurrency(order.amount, order.currency)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        <span className="text-slate-500">Kullanıcı: </span>
                        <span className="text-slate-200">{order.buyer?.email ?? order.buyerId.slice(0, 8)}</span>
                        {order.buyer?.name && <span className="text-slate-400"> ({order.buyer.name})</span>}
                      </span>
                      {order.aisheId && (
                        <span>
                          <span className="text-slate-500">AISHE ID: </span>
                          <span className="font-mono text-amber-300">{order.aisheId}</span>
                        </span>
                      )}
                      <span>
                        <span className="text-slate-500">Tarih: </span>
                        {new Date(order.createdAt).toLocaleString('tr-TR')}
                      </span>
                      {order.attributionType !== 'NONE' && (
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">
                          {order.attributionType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(order.id)}
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Onayla & Aktifleştir
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMutation.mutate(order.id)}
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:border-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribution Filtresi */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4">
        <div>
          <p className="text-xs uppercase text-slate-400">Attribution Filtresi</p>
          <p className="text-sm text-slate-200">Onaylanan siparişleri filtrele.</p>
        </div>
        <select
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          value={attributionFilter}
          onChange={(event) =>
            setAttributionFilter(event.target.value as typeof attributionFilter)
          }
        >
          <option value="all">Tümü</option>
          <option value="affiliate">Affiliate</option>
          <option value="referral">Referral</option>
          <option value="none">Direct</option>
        </select>
      </div>

      {/* Tüm Siparişler Tablosu */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="sticky top-0 z-10 grid grid-cols-7 gap-3 border-b border-slate-800 bg-slate-950/95 px-6 py-4 text-xs uppercase text-slate-400">
          <span className="col-span-2">Kullanıcı / Paket</span>
          <span>AISHE ID</span>
          <span>Tutar</span>
          <span>Durum</span>
          <span className="text-right">Tarih</span>
          <span className="text-right">Aksiyon</span>
        </div>
        <div className="divide-y divide-slate-800">
          {otherOrders.length === 0 ? (
            <div className="px-6 py-6">
              <EmptyState
                title="Henüz onaylanmış sipariş bulunamadı"
                description="Filtreyi değiştirerek tekrar deneyin."
                actionLabel="Filtreyi Sıfırla"
                onAction={() => {
                  setAttributionFilter('all');
                  setPage(1);
                }}
              />
            </div>
          ) : null}
          {pagedOrders.map((order) => {
            const selectedStatus = pendingStatus[order.id] ?? order.status;
            return (
              <div key={order.id} className="grid grid-cols-7 gap-3 px-6 py-4 text-sm text-slate-200">
                <div className="col-span-2 min-w-0">
                  <p className="truncate text-xs font-medium text-white">{order.buyer?.email ?? order.buyerId.slice(0, 8)}</p>
                  <p className="truncate text-xs text-slate-400">{packageMap.get(order.packageId)?.name ?? order.packageId.slice(0, 8)}</p>
                </div>
                <span className="truncate font-mono text-xs text-slate-300">{order.aisheId ?? '—'}</span>
                <span className="text-xs">{formatCurrency(order.amount, order.currency)}</span>
                <StatusBadge status={order.status} />
                <span className="text-right text-xs text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                </span>
                <div className="flex justify-end gap-2">
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                    value={selectedStatus}
                    onChange={(event) =>
                      setPendingStatus((prev) => ({
                        ...prev,
                        [order.id]: event.target.value as Order['status'],
                      }))
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="failed">failed</option>
                    <option value="canceled">canceled</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ id: order.id, status: selectedStatus })}
                    disabled={isMutating}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-indigo-500 disabled:opacity-60"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {otherOrders.length > pageSize ? (
          <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 text-xs text-slate-400">
            <span>
              Sayfa {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
