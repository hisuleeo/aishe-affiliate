'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AffiliatePayout,
  approveAdminPayout,
  completeAdminPayout,
  getAdminPayouts,
  rejectAdminPayout,
} from '@/services/adminService';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  User,
  XCircle,
} from 'lucide-react';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/40',
  PAID: 'bg-green-500/10 text-green-400 border-green-500/40',
  FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/40',
};

const STATUS_LABELS = {
  PENDING: 'Beklemede',
  PROCESSING: 'İşleniyor',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
};

export function PayoutManagement() {
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [selectedPayout, setSelectedPayout] = useState<AffiliatePayout | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery<AffiliatePayout[]>({
    queryKey: ['admin-payouts', filterStatus],
    queryFn: () => getAdminPayouts(filterStatus),
  });

  const approveMutation = useMutation({
    mutationFn: (payoutId: string) => approveAdminPayout(payoutId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      showToast({ title: 'Payout onaylandı ve işleme alındı', variant: 'success' });
      setSelectedPayout(null);
    },
    onError: () => {
      showToast({ title: 'Payout onaylanamadı', variant: 'error' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (payoutId: string) => completeAdminPayout(payoutId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      showToast({ title: 'Payout ödeme tamamlandı', variant: 'success' });
      setSelectedPayout(null);
    },
    onError: () => {
      showToast({ title: 'Payout tamamlanamadı', variant: 'error' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ payoutId, reason }: { payoutId: string; reason?: string }) =>
      rejectAdminPayout(payoutId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      showToast({ title: 'Payout reddedildi', variant: 'success' });
      setSelectedPayout(null);
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: () => {
      showToast({ title: 'Payout reddedilemedi', variant: 'error' });
    },
  });

  const handleApprove = (payoutId: string) => {
    if (confirm('Bu payout\'ı onaylayıp işleme almak istediğinize emin misiniz?')) {
      approveMutation.mutate(payoutId);
    }
  };

  const handleComplete = (payoutId: string) => {
    if (confirm('Bu payout\'ın ödemesinin tamamlandığını onaylıyor musunuz?')) {
      completeMutation.mutate(payoutId);
    }
  };

  const handleRejectSubmit = () => {
    if (!selectedPayout) return;
    if (confirm('Bu payout\'ı reddetmek istediğinize emin misiniz?')) {
      rejectMutation.mutate({ payoutId: selectedPayout.id, reason: rejectReason });
    }
  };

  const payouts = data ?? [];
  const pendingCount = payouts.filter((p) => p.status === 'PENDING').length;
  const processingCount = payouts.filter((p) => p.status === 'PROCESSING').length;
  const paidCount = payouts.filter((p) => p.status === 'PAID').length;
  const failedCount = payouts.filter((p) => p.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Payout Yönetimi</h2>
          <p className="mt-1 text-sm text-slate-400">
            Affiliate ödemelerini onaylayın ve işleyin
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilterStatus(undefined)}
          className={`flex-shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            filterStatus === undefined
              ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200'
              : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
          }`}
        >
          Tümü ({payouts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('PENDING')}
          className={`flex-shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            filterStatus === 'PENDING'
              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-200'
              : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
          }`}
        >
          Beklemede ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('PROCESSING')}
          className={`flex-shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            filterStatus === 'PROCESSING'
              ? 'border-blue-500/60 bg-blue-500/10 text-blue-200'
              : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
          }`}
        >
          İşleniyor ({processingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('PAID')}
          className={`flex-shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            filterStatus === 'PAID'
              ? 'border-green-500/60 bg-green-500/10 text-green-200'
              : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
          }`}
        >
          Ödendi ({paidCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('FAILED')}
          className={`flex-shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            filterStatus === 'FAILED'
              ? 'border-rose-500/60 bg-rose-500/10 text-rose-200'
              : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
          }`}
        >
          Başarısız ({failedCount})
        </button>
      </div>

      {/* Payouts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12">
          <DollarSign className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-sm font-semibold text-slate-400">
            {filterStatus ? 'Bu filtrede payout yok' : 'Henüz payout yok'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {Number(payout.totalAmount).toFixed(2)} {payout.currency}
                    </p>
                    <p className="text-xs text-slate-400">
                      {payout.payoutItems.length} komisyon
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[payout.status]}`}
                >
                  {STATUS_LABELS[payout.status]}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User className="h-3.5 w-3.5" />
                  <span>{payout.affiliate.email}</span>
                </div>
                {payout.affiliate.name && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="ml-5">{payout.affiliate.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(payout.periodStart).toLocaleDateString('tr-TR')} -{' '}
                    {new Date(payout.periodEnd).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {payout.paidAt && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Ödendi: {new Date(payout.paidAt).toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-950/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Komisyon Detayları
                </p>
                <div className="mt-2 space-y-1">
                  {payout.payoutItems.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300">
                      <span className="font-mono text-indigo-300">
                        {Number(item.commission.amount).toFixed(2)} {item.commission.currency}
                      </span>
                      <span className="ml-2 text-slate-500">
                        - Order: {item.commission.conversion.externalOrderId.slice(0, 8)}...
                      </span>
                    </div>
                  ))}
                  {payout.payoutItems.length > 3 && (
                    <p className="text-xs text-slate-500">
                      +{payout.payoutItems.length - 3} daha...
                    </p>
                  )}
                </div>
              </div>

              {payout.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(payout.id)}
                    disabled={approveMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-500/60 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 hover:border-blue-400 disabled:opacity-50"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Onayla & İşle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayout(payout);
                      setShowRejectModal(true);
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-400 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reddet
                  </button>
                </div>
              )}

              {payout.status === 'PROCESSING' && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleComplete(payout.id)}
                    disabled={completeMutation.isPending}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-green-500/60 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-200 hover:border-green-400 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ödemeyi Tamamla
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Payout\'ı Reddet</h3>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPayout(null);
                  setRejectReason('');
                }}
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-300">
                Bu payout\'ı reddetmek istediğinize emin misiniz?
              </p>
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs text-slate-400">
                  Affiliate: {selectedPayout.affiliate.email}
                </p>
                <p className="text-xs text-slate-400">
                  Tutar: {Number(selectedPayout.totalAmount).toFixed(2)}{' '}
                  {selectedPayout.currency}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Red Nedeni (Opsiyonel)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Affiliate'e gönderilecek red nedeni..."
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPayout(null);
                  setRejectReason('');
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isPending}
                className="rounded-lg border border-rose-500/60 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 hover:border-rose-400 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Reddediliyor...' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
