"use client";

import { useState } from 'react';
import { MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { sendSupportQuestion, getPreferredLanguage } from '@/services/supportService';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'open' | 'resolved';
  answer?: string;
};

export function SupportTicketForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast({ title: 'Lütfen konu ve mesajı doldurun', variant: 'error' });
      return;
    }

    setSending(true);
    try {
      const response = await sendSupportQuestion(
        message.trim(), 
        getPreferredLanguage(),
        {
          id: user?.id,
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
          role: user?.role
        }
      );

      const newTicket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'resolved',
        answer: response.answer,
      };

      setTickets((prev) => [newTicket, ...prev]);
      setSubject('');
      setMessage('');
      showToast({ title: 'Destek talebi gönderildi', variant: 'success' });
    } catch {
      showToast({
        title: 'Destek talebi gönderilemedi',
        description: 'Lütfen daha sonra tekrar deneyin.',
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-8 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Yeni Destek Talebi Oluştur</h3>
            <p className="text-sm text-slate-400">Sorularınız için bize ulaşın</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Konu
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Örn: Paket süresi uzatma hakkında"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Mesajınız
            </label>
            <textarea
              className="w-full h-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detayları paylaşın, size daha iyi yardımcı olalım..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                {sending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Talep Gönder</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Destek Talepleriniz</h3>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-white">{ticket.subject}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {ticket.status === 'resolved' ? 'Yanıtlandı' : 'Açık'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-white/5 p-4 border-l-2 border-indigo-500">
                  <p className="text-xs font-medium text-slate-400 mb-2">Mesajınız:</p>
                  <p className="text-sm text-slate-200">{ticket.message}</p>
                </div>

                {ticket.answer && (
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-4 border-l-2 border-emerald-500">
                    <p className="text-xs font-medium text-emerald-400 mb-2">AISHE Destek Yanıtı:</p>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold text-white mt-3 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-white mt-2 mb-1" {...props} />,
                          p: ({node, ...props}) => <p className="text-sm text-slate-200 mb-2" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 text-sm text-slate-200 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 text-sm text-slate-200 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="text-slate-200" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? 
                              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-cyan-400" {...props} /> :
                              <code className="block rounded-lg bg-slate-900 p-3 text-xs text-slate-200 overflow-x-auto" {...props} />
                        }}
                      >
                        {ticket.answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
