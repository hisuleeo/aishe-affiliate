"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  MessageCircle, Send, CheckCircle2, Clock, ArrowLeft, Plus,
  Loader2, AlertCircle, ChevronRight, Inbox, User, Shield,
} from 'lucide-react';
import {
  createTicket, getMyTickets, getTicketById, addReplyToTicket,
  type SupportTicket, type SupportTicketReply, type CreateTicketPayload,
} from '@/services/supportService';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/ToastProvider';

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN:        { label: 'Open',        color: 'bg-blue-500/10 text-blue-300 border-blue-500/30',    icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30', icon: Loader2 },
  WAITING:     { label: 'Waiting',     color: 'bg-purple-500/10 text-purple-300 border-purple-500/30', icon: Clock },
  RESOLVED:    { label: 'Resolved',    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  CLOSED:      { label: 'Closed',      color: 'bg-slate-500/10 text-slate-400 border-slate-600/30', icon: AlertCircle },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Low',    color: 'text-slate-400' },
  MEDIUM: { label: 'Medium', color: 'text-blue-400' },
  HIGH:   { label: 'High',   color: 'text-orange-400' },
  URGENT: { label: 'Urgent', color: 'text-rose-400' },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

type View = 'list' | 'create' | 'detail';

export function SupportTicketForm({ neutralMode = false }: { neutralMode?: boolean }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [view, setView] = useState<View>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Create form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<CreateTicketPayload['category']>('GENERAL');
  const [priority, setPriority] = useState<CreateTicketPayload['priority']>('MEDIUM');
  const [sending, setSending] = useState(false);

  // Reply
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicketDetail = async (ticketId: string) => {
    try {
      const detail = await getTicketById(ticketId);
      setSelectedTicket(detail);
      setView('detail');
    } catch {
      showToast({ title: 'Could not load ticket details', variant: 'error' });
    }
  };

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast({ title: 'Please fill in the subject and message', variant: 'error' });
      return;
    }
    setSending(true);
    try {
      await createTicket({ subject: subject.trim(), description: message.trim(), category, priority });
      showToast({ title: 'Support ticket created', variant: 'success' });
      setSubject(''); setMessage(''); setCategory('GENERAL'); setPriority('MEDIUM');
      setView('list');
      await fetchTickets();
    } catch {
      showToast({ title: 'Could not create support ticket', variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setReplying(true);
    try {
      await addReplyToTicket(selectedTicket.id, reply.trim());
      showToast({ title: 'Message sent', variant: 'success' });
      setReply('');
      const detail = await getTicketById(selectedTicket.id);
      setSelectedTicket(detail);
      await fetchTickets();
    } catch {
      showToast({ title: 'Could not send message', variant: 'error' });
    } finally {
      setReplying(false);
    }
  };

  /* ═══════════ LIST VIEW ═══════════ */
  if (view === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Your Support Tickets</h3>
            <p className="text-sm text-slate-400">Track your tickets and view replies</p>
          </div>
          <button onClick={() => setView('create')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] ${neutralMode ? 'bg-[#4b5563] shadow-black/25 hover:bg-[#5b6472]' : 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-500/15 hover:shadow-cyan-500/30 hover:brightness-110'}`}>
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20 p-12 text-center">
            <Inbox className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">You don&apos;t have any support tickets yet</p>
            <button onClick={() => setView('create')}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${neutralMode ? 'bg-white/8 border-white/16 text-slate-200 hover:bg-white/12' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'}`}>
              <Plus className="h-4 w-4" /> Create your first ticket
            </button>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="space-y-2">
            {tickets.map((t) => {
              const st = STATUS_MAP[t.status] ?? STATUS_MAP.OPEN;
              const replyCount = t.replies?.length ?? 0;
              const hasStaffReply = t.replies?.some((r) => r.isStaff) ?? false;
              return (
                <button key={t.id} type="button" onClick={() => openTicketDetail(t.id)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-700/30 bg-slate-800/20 p-4 text-left transition-all hover:border-cyan-500/20 hover:bg-cyan-500/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/30 bg-slate-800/40">
                    <MessageCircle className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{t.subject}</p>
                      {hasStaffReply && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                          Replied
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {fmtDate(t.createdAt)}
                      {replyCount > 0 && <span className="ml-2">· {replyCount} messages</span>}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${st.color}`}>
                    {st.label}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════ CREATE VIEW ═══════════ */
  if (view === 'create') {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('list')}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>

        <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/15">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">New Support Ticket</h3>
              <p className="text-sm text-slate-400">Our team will respond as soon as possible</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g.: About package extension"
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as CreateTicketPayload['category'])}
                  className="w-full rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all">
                  <option value="GENERAL">General</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BILLING">Billing</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="BUG_REPORT">Bug Report</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as CreateTicketPayload['priority'])}
                  className="w-full rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Your Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Share the details so we can help you better..."
                rows={5}
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all resize-none" />
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleCreate} disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition-all hover:shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50 active:scale-[0.98]">
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Submit Ticket</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ DETAIL VIEW ═══════════ */
  if (view === 'detail' && selectedTicket) {
    const st = STATUS_MAP[selectedTicket.status] ?? STATUS_MAP.OPEN;
    const pr = PRIORITY_MAP[selectedTicket.priority] ?? PRIORITY_MAP.MEDIUM;
    const isClosed = selectedTicket.status === 'CLOSED' || selectedTicket.status === 'RESOLVED';
    const allMessages: Array<{ type: 'initial' | 'reply'; date: string; content: string; isStaff: boolean; name: string }> = [
      { type: 'initial', date: selectedTicket.createdAt, content: selectedTicket.description, isStaff: false, name: user?.name ?? 'Me' },
      ...(selectedTicket.replies ?? []).map((r) => ({
        type: 'reply' as const,
        date: r.createdAt,
        content: r.message,
        isStaff: r.isStaff,
        name: r.isStaff ? (r.user?.name ?? 'Support Team') : (r.user?.name ?? 'Me'),
      })),
    ];

    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelectedTicket(null); }}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>

        <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20 p-5">
          <h3 className="text-lg font-semibold text-white">{selectedTicket.subject}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${st.color}`}>{st.label}</span>
            <span className={`text-[11px] font-medium ${pr.color}`}>● {pr.label} priority</span>
            <span className="text-[11px] text-slate-500">{fmtDate(selectedTicket.createdAt)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {allMessages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.isStaff ? 'justify-start' : 'justify-end'}`}>
              {m.isStaff && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-indigo-500/15">
                  <Shield className="h-4 w-4 text-cyan-400" />
                </div>
              )}
              <div className={m.isStaff ? 'max-w-[85%]' : 'max-w-[85%]'}>
                <div className={`rounded-2xl px-4 py-3 ${
                  m.isStaff
                    ? 'rounded-tl-md border border-slate-700/30 bg-slate-800/30'
                    : neutralMode
                      ? 'rounded-tr-md bg-[#4b5563] text-white shadow-lg shadow-black/20'
                      : 'rounded-tr-md bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${m.isStaff ? 'text-slate-200' : 'text-white'}`}>
                    {m.content}
                  </p>
                </div>
                <p className={`mt-1 text-[10px] text-slate-600 ${m.isStaff ? '' : 'text-right'}`}>
                  {m.isStaff && <span className="text-cyan-500/70 font-medium">Support Team · </span>}
                  {fmtDate(m.date)}
                </p>
              </div>
              {!m.isStaff && (
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${neutralMode ? 'border-white/18 bg-white/10 text-slate-200' : 'border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-teal-500/15 text-cyan-300'}`}>
                  {user?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isClosed ? (
          <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20 p-4">
            <div className="flex items-end gap-2">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                className={`flex-1 rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all resize-none ${neutralMode ? 'focus:border-white/30 focus:ring-2 focus:ring-white/10' : 'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/15'}`} />
              <button type="button" onClick={handleReply} disabled={!reply.trim() || replying}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-all disabled:opacity-30 active:scale-95 ${neutralMode ? 'bg-[#4b5563] shadow-black/25 hover:bg-[#5b6472]' : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/15 hover:shadow-cyan-500/30 hover:brightness-110'}`}>
                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700/30 bg-slate-800/20 p-4 text-center text-sm text-slate-500">
            This ticket has been closed. You can create a new ticket.
          </div>
        )}
      </div>
    );
  }

  return null;
}
