"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getPreferredLanguage,
  sendSupportQuestion,
  type SupportHistoryMessage,
} from '@/services/supportService';
import { useAuth } from '@/components/auth/useAuth';
import { Bot, Check, CheckCheck, Clock, MessageSquarePlus, Send, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const DEFAULT_GREETING = {
  id: 'aishe-welcome',
  role: 'assistant' as const,
  content: 'Merhaba! AISHE destek asistanıyım. Size nasıl yardımcı olabilirim?',
};

const QUICK_PROMPTS = [
  'Paket fiyatları nedir?',
  'Siparişim görünmüyor, ne yapmalıyım?',
  'Affiliate linkim nasıl çalışır?',
  'Fatura detayları nasıl görüntülenir?',
];

const CHAT_HISTORY_KEY = 'aishe-chat-history';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp?: number;
};

const loadChatHistory = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [DEFAULT_GREETING];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [DEFAULT_GREETING];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_GREETING];
    return parsed;
  } catch {
    return [DEFAULT_GREETING];
  }
};

const saveChatHistory = (messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch {
    // noop
  }
};

const toSupportHistory = (messages: ChatMessage[]): SupportHistoryMessage[] =>
  messages
    .filter((item) => item.id !== DEFAULT_GREETING.id)
    .map((item) => ({ role: item.role, content: item.content }))
    .slice(-12);

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_GREETING]);

  useEffect(() => {
    const history = loadChatHistory();
    setMessages(history);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [isOpen, messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen]);

  const conversationTitle = useMemo(() => {
    const firstUser = messages.find((message) => message.role === 'user');
    if (!firstUser) return 'Yeni Sohbet';
    const raw = firstUser.content.trim();
    return raw.length > 36 ? `${raw.slice(0, 36)}...` : raw;
  }, [messages]);

  const clearHistory = () => {
    setMessages([DEFAULT_GREETING]);
    setError(null);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  const sendMessage = async (preset?: string) => {
    const question = (preset ?? input).trim();
    if (!question || isSending) return;

    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: 'user',
      content: question,
      status: 'sending',
      timestamp,
    };

    const historyForApi = toSupportHistory(messages);
    const userContext = user
      ? {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          role: user.role,
        }
      : undefined;

    setError(null);
    setIsSending(true);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg)),
      );
    }, 220);

    try {
      const response = await sendSupportQuestion(
        question,
        getPreferredLanguage(),
        userContext,
        historyForApi,
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'delivered' as const } : msg,
        ),
      );

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'read' as const } : msg,
          ),
        );
      }, 350);
    } catch {
      setError('Yanıt alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-sm">
          <div className="mx-auto mt-[4vh] h-[92vh] w-[min(1180px,96vw)] overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900 shadow-[0_30px_120px_rgba(2,6,23,0.8)]">
            <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
              <aside className="hidden border-r border-slate-800 bg-slate-950/95 md:flex md:flex-col">
                <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                    <img src="/brand/favicon.png" alt="AISHE" className="h-7 w-7 rounded-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">AISHE Assistant</p>
                    <p className="text-xs text-slate-400">Anthropic destekli sohbet</p>
                  </div>
                </div>

                <div className="p-3">
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    Yeni sohbet
                  </button>
                </div>

                <div className="px-3 pb-2">
                  <p className="px-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Hızlı başlat</p>
                </div>
                <div className="space-y-2 px-3">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/80"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="mt-auto border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
                  {isAuthenticated && user?.name ? `Giriş: ${user.name}` : 'Misafir modu'}
                </div>
              </aside>

              <main className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-950">
                <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 md:px-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{conversationTitle}</p>
                    <p className="text-xs text-slate-400">Yanıt dili: {getPreferredLanguage()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500"
                    >
                      Temizle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-300 transition hover:border-slate-500"
                      aria-label="Sohbeti kapat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                <div
                  ref={listRef}
                  className="flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-10 md:py-7"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[92%] md:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role === 'user'
                            ? 'rounded-br-md bg-slate-100 text-slate-900'
                            : 'rounded-bl-md border border-slate-700 bg-slate-800/90 text-slate-100'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:bg-slate-950 prose-code:text-emerald-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <>
                            <p>{message.content}</p>
                            <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                              <span>
                                {message.timestamp
                                  ? new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                              {message.status === 'sending' ? <Clock className="h-3 w-3" /> : null}
                              {message.status === 'sent' ? <Check className="h-3 w-3" /> : null}
                              {message.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> : null}
                              {message.status === 'read' ? (
                                <CheckCheck className="h-3 w-3 text-emerald-600" />
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {isSending ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800 px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.25s]" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.1s]" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                      {error}
                    </div>
                  ) : null}
                </div>

                <footer className="border-t border-slate-800 bg-slate-900/85 px-4 py-3 md:px-6">
                  <div className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3">
                    <Bot className="mb-1 h-4 w-4 shrink-0 text-slate-500" />
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="AISHE ile konuşmaya başlayın..."
                      className="max-h-32 min-h-7 flex-1 resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                      onInput={(event) => {
                        const target = event.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!input.trim() || isSending}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              </main>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-6 right-6 z-[70] max-sm:bottom-4 max-sm:right-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-slate-950/90 shadow-[0_14px_40px_rgba(16,185,129,0.35)] backdrop-blur transition hover:scale-105 hover:shadow-[0_18px_45px_rgba(16,185,129,0.45)]"
          aria-label="Sohbet penceresini aç"
        >
          <img src="/brand/favicon.png" alt="AISHE" className="h-9 w-9 rounded-full object-contain" />
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
        </button>
      </div>
    </>
  );
}
