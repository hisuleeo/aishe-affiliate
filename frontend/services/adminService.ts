import type { AdminAffiliateLink, AdminAffiliateLinkMetrics, Order, User } from '@shared/types';
import { apiClient } from '@/lib/api-client';

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
  _count?: {
    replies: number;
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

export interface ExtensionRequest {
  id: string;
  orderId: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';
  amount: string;
  currency: string;
  months: number;
  createdAt: string;
  paidAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  order: {
    id: string;
    packageId: string;
    aisheId: string | null;
    status: string;
  };
}

export const getAdminUsers = async () => {
  const response = await apiClient.get<User[]>('/admin/users');
  return response.data;
};

export const getAdminOrders = async (attribution?: 'affiliate' | 'referral' | 'none') => {
  const response = await apiClient.get<Order[]>('/admin/orders', {
    params: attribution ? { attribution } : undefined,
  });
  return response.data;
};

export const getAdminAffiliateLinks = async () => {
  const response = await apiClient.get<AdminAffiliateLink[]>('/admin/affiliate-links');
  return response.data;
};

export const getAdminAffiliateLinkMetrics = async (id: string) => {
  const response = await apiClient.get<AdminAffiliateLinkMetrics>(
    `/admin/affiliate-links/${id}/metrics`,
  );
  return response.data;
};

// Support Ticket Admin Functions
export const getAdminTickets = async () => {
  const response = await apiClient.get<SupportTicket[]>('/support/admin/tickets');
  return response.data;
};

export const updateTicketStatus = async (
  ticketId: string,
  status: SupportTicket['status'],
) => {
  const response = await apiClient.patch<SupportTicket>(
    `/support/admin/tickets/${ticketId}/status`,
    { status },
  );
  return response.data;
};

export const addTicketReply = async (ticketId: string, message: string) => {
  const response = await apiClient.post<SupportTicketReply>(
    `/support/tickets/${ticketId}/replies`,
    { message },
  );
  return response.data;
};

export const deleteTicket = async (ticketId: string) => {
  const response = await apiClient.delete(`/support/admin/tickets/${ticketId}`);
  return response.data;
};

// Extension Request Admin Functions
export const getAdminExtensionRequests = async (status?: string) => {
  const response = await apiClient.get<ExtensionRequest[]>('/admin/extension-requests', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const approveExtensionRequest = async (requestId: string) => {
  const response = await apiClient.patch<ExtensionRequest>(
    `/admin/extension-requests/${requestId}/approve`,
  );
  return response.data;
};

export const rejectExtensionRequest = async (requestId: string, reason?: string) => {
  const response = await apiClient.patch<ExtensionRequest>(
    `/admin/extension-requests/${requestId}/reject`,
    { reason },
  );
  return response.data;
};

// Payout Admin Functions
export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  totalAmount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  affiliate: {
    id: string;
    email: string;
    name: string | null;
  };
  payoutItems: Array<{
    commission: {
      id: string;
      amount: string;
      currency: string;
      type: string;
      status: string;
      conversion: {
        id: string;
        externalOrderId: string;
        amount: string;
      };
    };
  }>;
}

export interface UnpaidCommissionGroup {
  affiliate: {
    id: string;
    email: string;
    name: string | null;
  };
  commissions: Array<{
    id: string;
    amount: string;
    currency: string;
    type: string;
    status: string;
    conversion: {
      id: string;
      externalOrderId: string;
      amount: string;
    };
  }>;
  totalAmount: number;
  currency: string;
}

export const getAdminPayouts = async (status?: string) => {
  const response = await apiClient.get<AffiliatePayout[]>('/admin/payouts', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const approveAdminPayout = async (payoutId: string) => {
  const response = await apiClient.post<AffiliatePayout>(`/admin/payouts/${payoutId}/approve`);
  return response.data;
};

export const completeAdminPayout = async (payoutId: string) => {
  const response = await apiClient.post<AffiliatePayout>(`/admin/payouts/${payoutId}/complete`);
  return response.data;
};

export const rejectAdminPayout = async (payoutId: string, reason?: string) => {
  const response = await apiClient.post<AffiliatePayout>(`/admin/payouts/${payoutId}/reject`, {
    reason,
  });
  return response.data;
};

export const getUnpaidCommissions = async () => {
  const response = await apiClient.get<UnpaidCommissionGroup[]>('/admin/commissions/unpaid');
  return response.data;
};

// ============ Programs API ============

export interface Program {
  id: string;
  name: string;
  status: string;
  attributionWindowDays: number;
  cookieTtlDays: number;
  defaultCurrency: string;
  createdAt: string;
  _count?: {
    campaigns: number;
    affiliateLinks: number;
    conversions: number;
  };
  campaigns?: Campaign[];
  commissionTiers?: CommissionTier[];
}

export interface Campaign {
  id: string;
  programId: string;
  name: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  _count?: {
    affiliateLinks: number;
  };
}

export interface CommissionTier {
  id: string;
  programId: string;
  tierName: string;
  minSalesThreshold: number;
  commissionRate: number;
  currency: string;
}

export interface CreateProgramDto {
  name: string;
  status?: string;
  attributionWindowDays?: number;
  cookieTtlDays?: number;
  defaultCurrency: string;
}

export interface UpdateProgramDto {
  name?: string;
  status?: string;
  attributionWindowDays?: number;
  cookieTtlDays?: number;
  defaultCurrency?: string;
}

export interface CreateCampaignDto {
  programId: string;
  name: string;
  status?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  status?: string;
  startsAt?: string;
  endsAt?: string;
}

export const getPrograms = async () => {
  const response = await apiClient.get<Program[]>('/programs');
  return response.data;
};

export const getProgram = async (id: string) => {
  const response = await apiClient.get<Program>(`/programs/${id}`);
  return response.data;
};

export const createProgram = async (data: CreateProgramDto) => {
  const response = await apiClient.post<Program>('/programs', data);
  return response.data;
};

export const updateProgram = async (id: string, data: UpdateProgramDto) => {
  const response = await apiClient.patch<Program>(`/programs/${id}`, data);
  return response.data;
};

export const deleteProgram = async (id: string) => {
  const response = await apiClient.delete(`/programs/${id}`);
  return response.data;
};

export const getCampaigns = async (programId: string) => {
  const response = await apiClient.get<Campaign[]>(`/programs/${programId}/campaigns`);
  return response.data;
};

export const createCampaign = async (data: CreateCampaignDto) => {
  const response = await apiClient.post<Campaign>('/programs/campaigns', data);
  return response.data;
};

export const updateCampaign = async (id: string, data: UpdateCampaignDto) => {
  const response = await apiClient.patch<Campaign>(`/programs/campaigns/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id: string) => {
  const response = await apiClient.delete(`/programs/campaigns/${id}`);
  return response.data;
};
