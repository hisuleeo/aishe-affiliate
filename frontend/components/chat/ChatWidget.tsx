"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { sendSupportQuestion, getPreferredLanguage } from '@/services/supportService';
import { Bot, User, Sparkles, Package, CreditCard, HelpCircle, MessageCircle, Send, Smile, Trash2, Check, CheckCheck, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { useAuth } from '@/components/auth/useAuth';

const DEFAULT_GREETING = {
  id: 'aishe-welcome',
  role: 'assistant' as const,
  content: 'Merhaba! AISHE destek asistanıyım. Nasıl yardımcı olabilirim?',
};

const getPersonalizedGreeting = (userName?: string | null) => {
  if (userName) {
    return `Merhaba ${userName}! AISHE destek asistanıyım. Size nasıl yardımcı olabilirim?`;
  }
  return DEFAULT_GREETING.content;
};

// Quick reply suggestions
const QUICK_REPLIES = [
  { id: 'pricing', icon: CreditCard, text: 'Paket fiyatları', query: 'Paket fiyatları nedir?' },
  { id: 'features', icon: Sparkles, text: 'Özellikler', query: 'AISHE\'nin özellikleri nelerdir?' },
  { id: 'packages', icon: Package, text: 'Paket karşılaştır', query: 'Paketler arasındaki farklar nelerdir?' },
  { id: 'support', icon: HelpCircle, text: 'Teknik destek', query: 'Teknik destek nasıl alırım?' },
];

// Popüler emojiler
const EMOJI_LIST = ['😊', '👍', '❤️', '🎉', '🤔', '😅', '🙏', '✨', '💡', '🚀', '📦', '💳', '🎯', '⚡', '🔥'];

// LocalStorage key
const CHAT_HISTORY_KEY = 'aishe-chat-history';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp?: number;
};

// Load chat history from localStorage
const loadChatHistory = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [DEFAULT_GREETING];
  try {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChatMessage[];
      return parsed.length > 0 ? parsed : [DEFAULT_GREETING];
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
  return [DEFAULT_GREETING];
};

// Save chat history to localStorage
const saveChatHistory = (messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_GREETING]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Personalize greeting when user changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'aishe-welcome') {
      setMessages([{
        ...DEFAULT_GREETING,
        content: getPersonalizedGreeting(user?.name),
      }]);
    }
  }, [user?.name]);

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory();
    setMessages(history);
    setShowQuickReplies(history.length === 1); // Show quick replies only for fresh chat
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);

  // Smooth auto-scroll when new messages arrive
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]); // isSending değiştiğinde de scroll olsun

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setError(null);
    setShowQuickReplies(false); // Quick replies'ı gizle

    const nextUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      status: 'sending',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, nextUserMessage]);
    setInput('');
    setIsSending(true);

    // Update to 'sent' after a brief delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === nextUserMessage.id ? { ...msg, status: 'sent' as const } : msg
        )
      );
    }, 300);

    try {
      const userContext = user ? {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email,
        role: user.role,
      } : undefined;

      const response = await sendSupportQuestion(trimmed, getPreferredLanguage(), userContext);
      
      // Update to 'delivered'
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === nextUserMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      );

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Mark as 'read' after assistant responds
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === nextUserMessage.id ? { ...msg, status: 'read' as const } : msg
          )
        );
      }, 500);
    } catch {
      setError('Yanıt alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (query: string) => {
    setInput(query);
    setShowQuickReplies(false);
    // Otomatik gönder
    setTimeout(() => {
      const trimmed = query.trim();
      if (!trimmed || isSending) return;
      setError(null);

      const nextUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        status: 'sending',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, nextUserMessage]);
      setInput('');
      setIsSending(true);

      // Update to 'sent'
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === nextUserMessage.id ? { ...msg, status: 'sent' as const } : msg
          )
        );
      }, 300);

      sendSupportQuestion(trimmed, getPreferredLanguage(), user ? {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email,
        role: user.role,
      } : undefined)
        .then((response) => {
          // Update to 'delivered'
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === nextUserMessage.id ? { ...msg, status: 'delivered' as const } : msg
            )
          );

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.answer,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Mark as 'read'
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === nextUserMessage.id ? { ...msg, status: 'read' as const } : msg
              )
            );
          }, 500);
        })
        .catch(() => {
          setError('Yanıt alınamadı. Lütfen tekrar deneyin.');
        })
        .finally(() => {
          setIsSending(false);
        });
    }, 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    const confirmed = window.confirm('Sohbet geçmişini temizlemek istediğinize emin misiniz?');
    if (confirmed) {
      setMessages([DEFAULT_GREETING]);
      setShowQuickReplies(true);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 max-sm:bottom-4 max-sm:right-4">
      {isOpen ? (
        <div className="w-[320px] max-sm:w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(15,23,42,0.65)] backdrop-blur animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 max-sm:px-3 max-sm:py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-500/50 bg-indigo-500/10 text-indigo-200 max-sm:h-8 max-sm:w-8">
                <svg viewBox="0 0 24 24" className="h-5 w-5 max-sm:h-4 max-sm:w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9M7.5 12h4.5m-6.75 7.5V6a2.25 2.25 0 0 1 2.25-2.25h9A2.25 2.25 0 0 1 19.5 6v8.25a2.25 2.25 0 0 1-2.25 2.25H9l-3.75 3Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white max-sm:text-xs">AISHE Chatbot</p>
                <p className="text-xs text-slate-400 max-sm:text-[10px]">
                  {isAuthenticated && user?.name ? `${user.name} için destek` : 'Her dilde destek'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Clear History Button */}
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded-full border border-slate-700 p-1.5 text-slate-400 transition-all hover:border-rose-500 hover:text-rose-400 max-sm:p-1"
                  title="Geçmişi temizle"
                >
                  <Trash2 className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 max-sm:px-1.5 max-sm:text-[10px]"
              >
                Kapat
              </button>
            </div>
          </div>

          <div ref={listRef} className="max-h-[360px] max-sm:max-h-[50vh] space-y-4 overflow-y-auto px-4 py-4 max-sm:px-3 max-sm:py-3 scroll-smooth">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot Avatar - Sol tarafta */}
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg animate-in zoom-in duration-200 max-sm:h-7 max-sm:w-7">
                    <Bot className="h-4 w-4 text-white max-sm:h-3.5 max-sm:w-3.5" />
                  </div>
                )}

                {/* Message Bubble - Glassmorphism effect */}
                <div
                  className={`max-w-[75%] max-sm:max-w-[80%] rounded-2xl px-4 py-2.5 max-sm:px-3 max-sm:py-2 text-xs max-sm:text-[11px] leading-relaxed shadow-lg backdrop-blur-sm transition-all hover:shadow-xl ${
                    message.role === 'user'
                      ? 'rounded-tr-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
                      : 'rounded-tl-md border border-slate-700/50 bg-slate-800/80 text-slate-100 shadow-slate-900/40 hover:border-slate-600/50'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-slate-950 prose-code:text-indigo-300 prose-headings:text-slate-100 prose-strong:text-white prose-a:text-indigo-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div>
                      <div>{message.content}</div>
                      {/* Status Indicator for User Messages */}
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span className="text-[9px] text-white/60">
                          {message.timestamp && new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.status === 'sending' && (
                          <Clock className="h-3 w-3 text-white/60" />
                        )}
                        {message.status === 'sent' && (
                          <Check className="h-3 w-3 text-white/60" />
                        )}
                        {message.status === 'delivered' && (
                          <CheckCheck className="h-3 w-3 text-white/60" />
                        )}
                        {message.status === 'read' && (
                          <CheckCheck className="h-3 w-3 text-indigo-300" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar - Sağ tarafta */}
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg animate-in zoom-in duration-200 max-sm:h-7 max-sm:w-7">
                    <User className="h-4 w-4 text-white max-sm:h-3.5 max-sm:w-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isSending ? (
              <div className="flex gap-2 justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
                {/* Bot Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg animate-pulse max-sm:h-7 max-sm:w-7">
                  <Bot className="h-4 w-4 text-white max-sm:h-3.5 max-sm:w-3.5" />
                </div>

                {/* Typing Indicator - Animasyonlu Noktalar */}
                <div className="rounded-2xl rounded-tl-md border border-slate-700/50 bg-slate-800/80 px-5 py-3 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></div>
                  </div>
                </div>
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                {error}
              </div>
            ) : null}

            {/* Quick Reply Chips - Sadece ilk mesajdan sonra göster */}
            {showQuickReplies && messages.length === 1 && !isSending && (
              <div className="flex flex-wrap gap-2 pt-2 animate-in slide-in-from-bottom-3 fade-in duration-500">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    onClick={() => handleQuickReply(reply.query)}
                    className="group flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] max-sm:text-[10px] text-indigo-200 backdrop-blur-sm transition-all hover:border-indigo-400 hover:bg-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                    <reply.icon className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5 transition-transform group-hover:scale-110" />
                    <span>{reply.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 px-4 py-3 max-sm:px-3 max-sm:py-2">
            <div className="flex items-end gap-2">
              {/* Emoji Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 transition-all hover:border-indigo-500 hover:text-indigo-400 max-sm:h-7 max-sm:w-7"
                >
                  <Smile className="h-4 w-4 max-sm:h-3.5 max-sm:w-3.5" />
                </button>

                {/* Emoji Picker Dropdown */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <div className="grid grid-cols-5 gap-2">
                      {EMOJI_LIST.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:bg-slate-800 hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-line Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sorunuzu yazın... (Shift+Enter: yeni satır)"
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs max-sm:text-[11px] text-slate-100 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 max-h-24 overflow-y-auto max-sm:px-3 max-sm:py-1.5"
                style={{
                  minHeight: '32px',
                  height: 'auto',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
                }}
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none max-sm:h-7 max-sm:w-7"
              >
                <Send className="h-4 w-4 max-sm:h-3.5 max-sm:w-3.5" />
              </button>
            </div>
            {lastMessage?.role === 'assistant' ? (
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Yanıt dili: {getPreferredLanguage()}</span>
                {isAuthenticated && user && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {user.name || user.email || 'Kullanıcı'}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-100 shadow-[0_12px_30px_rgba(79,70,229,0.35)] transition-all hover:scale-105 hover:shadow-[0_16px_40px_rgba(79,70,229,0.45)] active:scale-95 max-sm:px-3 max-sm:py-1.5 max-sm:text-[10px]"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse max-sm:h-1.5 max-sm:w-1.5" />
        <span className="max-sm:hidden">AISHE Chat</span>
        <span className="sm:hidden">Chat</span>
      </button>
    </div>
  );
}
