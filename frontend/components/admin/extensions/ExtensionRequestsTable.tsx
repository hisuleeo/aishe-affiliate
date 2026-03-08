'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveExtensionRequest,
  ExtensionRequest,
  getAdminExtensionRequests,
  rejectExtensionRequest,
} from '@/services/adminService';
import { useToast } from '@/components/ui/ToastProvider';
import { Calendar, CheckCircle2, Clock, Package, User, XCircle } from 'lucide-react';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40',
  PAID: 'bg-green-500/10 text-green-400 border-green-500/40',
  FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/40',
  CANCELED: 'bg-slate-500/10 text-slate-400 border-slate-500/40',
};

const STATUS_LABELS = {
  PENDING: 'Beklemede',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
  CANCELED: 'İptal Edildi',
};

export function ExtensionRequestsTable() {
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery<ExtensionRequest[]>({
    queryKey: ['admin-extension-requests', filterStatus],
    queryFn: () => getAdminExtensionRequests(filterStatus),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveExtensionRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-extension-requests'] });
      showToast({ title: 'İstek onaylandı', variant: 'success' });
      setSelectedRequest(null);
    },
    onError: () => {
      showToast({ title: 'İstek onaylanamadı', variant: 'error' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      rejectExtensionRequest(requestId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-extension-requests'] });
      showToast({ title: 'İstek reddedildi', variant: 'success' });
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: () => {
      showToast({ title: 'İstek reddedilemedi', variant: 'error' });
    },
  });

  const handleApprove = (requestId: string) => {
    if (confirm('Bu uzatma isteğini onaylamak istediğinize emin misiniz?')) {
      approveMutation.mutate(requestId);
    }
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    if (confirm('Bu uzatma isteğini reddetmek istediğinize emin misiniz?')) {
      rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason });
    }
  };

  const requests = data ?? [];
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const paidCount = requests.filter((r) => r.status === 'PAID').length;
  const failedCount = requests.filter((r) => r.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Uzatma İstekleri</h2>
          <p className="mt-1 text-sm text-slate-400">
            Kullanıcıların paket uzatma taleplerini yönetin
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
          Tümü ({requests.length})
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

      {/* Extension Requests Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12">
          <Clock className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12">
          <Package className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-sm font-semibold text-slate-400">
            {filterStatus ? 'Bu filtrede uzatma isteği yok' : 'Henüz uzatma isteği yok'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {request.months} Ay Uzatma
                    </p>
                    <p className="text-xs text-slate-400">
                      {Number(request.amount).toFixed(2)} {request.currency}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[request.status]}`}
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User className="h-3.5 w-3.5" />
                  <span>{request.user.email}</span>
                </div>
                {request.user.name && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="ml-5">{request.user.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(request.createdAt).toLocaleString('tr-TR')}</span>
                </div>
                {request.paidAt && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Ödendi: {new Date(request.paidAt).toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-950/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Sipariş Bilgileri
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Paket ID: <span className="font-mono text-indigo-300">{request.order.packageId}</span>
                </p>
                {request.order.aisheId && (
                  <p className="mt-1 text-xs text-slate-300">
                    AISHE ID: <span className="font-mono text-indigo-300">{request.order.aisheId}</span>
                  </p>
                )}
              </div>

              {request.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id)}
                    disabled={approveMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-500/60 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-200 hover:border-green-400 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    disabled={rejectMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-400 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reddet
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">İsteği Reddet</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-300">
                Bu uzatma isteğini reddetmek istediğinize emin misiniz?
              </p>
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs text-slate-400">Kullanıcı: {selectedRequest.user.email}</p>
                <p className="text-xs text-slate-400">
                  Tutar: {Number(selectedRequest.amount).toFixed(2)} {selectedRequest.currency}
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
                placeholder="Kullanıcıya gönderilecek red nedeni..."
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleReject}
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
