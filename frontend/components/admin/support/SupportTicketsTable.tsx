'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAdminTickets, 
  updateTicketStatus, 
  addTicketReply, 
  deleteTicket,
  type SupportTicket 
} from '@/services/adminService';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Send,
  User,
  Mail,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

const STATUS_COLORS = {
  OPEN: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  WAITING: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  RESOLVED: 'bg-green-500/10 text-green-300 border-green-500/30',
  CLOSED: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const STATUS_LABELS = {
  OPEN: 'Açık',
  IN_PROGRESS: 'İşlemde',
  WAITING: 'Bekliyor',
  RESOLVED: 'Çözüldü',
  CLOSED: 'Kapalı',
};

const PRIORITY_COLORS = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-blue-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-rose-400',
};

const PRIORITY_LABELS = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  URGENT: 'Acil',
};

export function SupportTicketsTable() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: getAdminTickets,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: SupportTicket['status'] }) =>
      updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      showToast({ title: 'Ticket durumu güncellendi', variant: 'success' });
      setSelectedTicket(null);
    },
    onError: () => {
      showToast({ title: 'Durum güncellenirken hata oluştu', variant: 'error' });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addTicketReply(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      showToast({ title: 'Yanıt gönderildi', variant: 'success' });
      setReplyMessage('');
      setSelectedTicket(null);
    },
    onError: () => {
      showToast({ title: 'Yanıt gönderilirken hata oluştu', variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      showToast({ title: 'Ticket silindi', variant: 'success' });
      setSelectedTicket(null);
    },
    onError: () => {
      showToast({ title: 'Ticket silinirken hata oluştu', variant: 'error' });
    },
  });

  const filteredTickets = tickets?.filter(
    (ticket) => filterStatus === 'ALL' || ticket.status === filterStatus
  ) || [];

  const handleStatusChange = (ticketId: string, status: SupportTicket['status']) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    replyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage });
  };

  const handleDelete = (ticketId: string) => {
    if (confirm('Bu ticket\'ı silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(ticketId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'
            }`}
          >
            {status === 'ALL' ? 'Tümü' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
            {status !== 'ALL' && tickets && (
              <span className="ml-2 rounded-full bg-slate-700/50 px-2 py-0.5 text-xs">
                {tickets.filter((t) => t.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">Ticket bulunamadı</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {ticket.user.name || ticket.user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {ticket.user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 line-clamp-2">{ticket.description}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                        STATUS_COLORS[ticket.status]
                      }`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium ${
                        PRIORITY_COLORS[ticket.priority]
                      }`}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                    <span className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-300">
                      {ticket.category}
                    </span>
                    {ticket._count && ticket._count.replies > 0 && (
                      <span className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-300">
                        <MessageSquare className="h-3 w-3" />
                        {ticket._count.replies} yanıt
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                  >
                    Detay
                  </button>
                  <button
                    onClick={() => handleDelete(ticket.id)}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-800 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedTicket.user.name || selectedTicket.user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedTicket.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    STATUS_COLORS[selectedTicket.status]
                  }`}
                >
                  {STATUS_LABELS[selectedTicket.status]}
                </span>
                <span
                  className={`flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-sm font-medium ${
                    PRIORITY_COLORS[selectedTicket.priority]
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  {PRIORITY_LABELS[selectedTicket.priority]}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-6">
              {/* Description */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-400">Açıklama</h3>
                <p className="text-slate-200">{selectedTicket.description}</p>
              </div>

              {/* Replies (if any) */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400">Yanıtlar</h3>
                  {selectedTicket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`rounded-xl border p-4 ${
                        reply.isStaff
                          ? 'border-indigo-500/30 bg-indigo-500/5'
                          : 'border-slate-800 bg-slate-950/50'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-white">
                          {reply.user.name || reply.user.email}
                          {reply.isStaff && (
                            <span className="ml-2 rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                              Destek Ekibi
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(reply.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400">Yanıt Gönder</h3>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Yanıtınızı yazın..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || replyMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-50"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Yanıt Gönder
                    </>
                  )}
                </button>
              </div>

              {/* Status Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400">Durum Değiştir</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() =>
                        handleStatusChange(selectedTicket.id, status as SupportTicket['status'])
                      }
                      disabled={
                        selectedTicket.status === status || updateStatusMutation.isPending
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        selectedTicket.status === status
                          ? STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                          : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
