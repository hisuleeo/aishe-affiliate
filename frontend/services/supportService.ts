import { apiClient } from '@/lib/api-client';

const DEFAULT_LANG = 'tr';

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export const getPreferredLanguage = () => {
  const cookie = getCookie('googtrans');
  if (cookie) {
    const [, target] = cookie.split('/');
    if (target) return target;
  }
  return DEFAULT_LANG;
};

export type SupportResponse = {
  answer: string;
};

export const sendSupportQuestion = async (
  question: string, 
  lang?: string,
  userContext?: { id?: string; name?: string; email?: string; role?: string }
) => {
  const response = await apiClient.post<SupportResponse>('/support/chat', {
    question,
    lang: lang ?? getPreferredLanguage(),
    userContext, // User bilgisini backend'e gönderiyoruz
  });
  return response.data;
};

// Ticket Management
export interface CreateTicketPayload {
  subject: string;
  description: string;
  category?: 'GENERAL' | 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG_REPORT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  replies?: SupportTicketReply[];
}

export interface SupportTicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export const createTicket = async (payload: CreateTicketPayload) => {
  const response = await apiClient.post<SupportTicket>('/support/tickets', payload);
  return response.data;
};

export const getMyTickets = async () => {
  const response = await apiClient.get<SupportTicket[]>('/support/tickets/my');
  return response.data;
};

export const getTicketById = async (ticketId: string) => {
  const response = await apiClient.get<SupportTicket>(`/support/tickets/${ticketId}`);
  return response.data;
};

export const addReplyToTicket = async (ticketId: string, message: string) => {
  const response = await apiClient.post<SupportTicketReply>(
    `/support/tickets/${ticketId}/replies`,
    { message },
  );
  return response.data;
};
