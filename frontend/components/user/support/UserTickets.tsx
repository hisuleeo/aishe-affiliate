'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMyTickets, 
  createTicket, 
  addReplyToTicket,
  type SupportTicket,
  type CreateTicketPayload
} from '@/services/supportService';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  MessageSquare, 
  Plus, 
  Send,
  X,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock
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

const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'Genel' },
  { value: 'TECHNICAL', label: 'Teknik' },
  { value: 'BILLING', label: 'Faturalama' },
  { value: 'ACCOUNT', label: 'Hesap' },
  { value: 'FEATURE_REQUEST', label: 'Özellik İsteği' },
  { value: 'BUG_REPORT', label: 'Hata Bildirimi' },
];

export function UserTickets() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [formData, setFormData] = useState<CreateTicketPayload>({
    subject: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: getMyTickets,
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      showToast({ title: 'Destek talebi oluşturuldu', variant: 'success' });
      setShowCreateModal(false);
      setFormData({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
    },
    onError: () => {
      showToast({ title: 'Talep oluşturulurken hata oluştu', variant: 'error' });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addReplyToTicket(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      showToast({ title: 'Yanıt gönderildi', variant: 'success' });
      setReplyMessage('');
    },
    onError: () => {
      showToast({ title: 'Yanıt gönderilirken hata oluştu', variant: 'error' });
    },
  });

  const handleCreate = () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      showToast({ title: 'Lütfen tüm alanları doldurun', variant: 'error' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    replyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Destek Taleplerim</h2>
          <p className="mt-1 text-sm text-slate-400">
            Tüm destek taleplerinizi buradan takip edebilirsiniz
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-600"
        >
          <Plus className="h-5 w-5" />
          Yeni Talep
        </button>
      </div>

      {/* Tickets List */}
      {!tickets || tickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">Henüz destek talebi oluşturmadınız</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-600 mx-auto"
          >
            <Plus className="h-4 w-4" />
            İlk Talebinizi Oluşturun
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 line-clamp-2">{ticket.description}</p>

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
                    {ticket.replies && ticket.replies.length > 0 && (
                      <span className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-300">
                        <MessageSquare className="h-3 w-3" />
                        {ticket.replies.length} yanıt
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Yeni Destek Talebi</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Konu</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Destek talebinizin konusu"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sorunuzupersonununuzu detaylı olarak açıklayın"
                  rows={6}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Öncelik</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="LOW">Düşük</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="HIGH">Yüksek</option>
                    <option value="URGENT">Acil</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Talep Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedTicket.createdAt).toLocaleString('tr-TR')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

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

            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-400">Açıklama</h3>
                <p className="text-slate-200">{selectedTicket.description}</p>
              </div>

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
                          {reply.isStaff ? 'Destek Ekibi' : 'Sen'}
                          {reply.isStaff && (
                            <span className="ml-2 rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                              Yetkili
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

              {(selectedTicket.status === 'OPEN' || selectedTicket.status === 'IN_PROGRESS' || selectedTicket.status === 'WAITING') && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400">Yanıt Ekle</h3>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={handleReply}
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
              )}

              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      Bu talep {selectedTicket.status === 'RESOLVED' ? 'çözüldü' : 'kapatıldı'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
