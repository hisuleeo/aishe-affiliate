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

const formatCurrency = (amount: string, currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
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
    },
    onError: () => {
      showToast({
        title: 'Sipariş güncellenemedi',
        description: 'Lütfen admin yetkisini kontrol edin.',
        variant: 'error',
      });
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
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4">
        <div>
          <p className="text-xs uppercase text-slate-400">Attribution Filtresi</p>
          <p className="text-sm text-slate-200">Siparişleri attribution türüne göre filtrele.</p>
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

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="sticky top-0 z-10 grid grid-cols-6 gap-4 border-b border-slate-800 bg-slate-950/95 px-6 py-4 text-xs uppercase text-slate-400">
        <span>Paket</span>
        <span>Tutar</span>
        <span>Durum</span>
        <span>Attribution</span>
        <span className="text-right">Tarih</span>
        <span className="text-right">Aksiyon</span>
      </div>
        <div className="divide-y divide-slate-800">
          {orders.length === 0 ? (
            <div className="px-6 py-6">
              <EmptyState
                title="Henüz sipariş bulunamadı"
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
              <div key={order.id} className="grid grid-cols-6 gap-4 px-6 py-4 text-sm text-slate-200">
                <span className="truncate text-xs text-slate-400">
                  {packageMap.get(order.packageId)?.name ?? order.packageId}
                </span>
                <span>{formatCurrency(order.amount, order.currency)}</span>
                <StatusBadge status={order.status} />
                <span>{order.attributionType}</span>
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
                    disabled={updateMutation.isPending}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-indigo-500 disabled:opacity-60"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {orders.length > pageSize ? (
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
