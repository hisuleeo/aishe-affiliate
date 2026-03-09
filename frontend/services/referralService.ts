import type { AffiliateLink, ReferralCode, UserAffiliateLinkMetrics } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export const getReferralCode = async () => {
  const response = await apiClient.get<ReferralCode>('/users/me/referral-code');
  return response.data;
};

export const getAffiliateLinks = async () => {
  const response = await apiClient.get<AffiliateLink[]>('/users/me/affiliate-links');
  return response.data;
};

export const createAffiliateLink = async (payload: { targetUrl: string }) => {
  const response = await apiClient.post<AffiliateLink>('/users/me/affiliate-links', payload);
  return response.data;
};

export const getAffiliateLinkMetrics = async (linkId: string) => {
  const response = await apiClient.get<UserAffiliateLinkMetrics>(`/users/me/affiliate-links/${linkId}/metrics`);
  return response.data;
};

export const getReferralStats = async () => {
  const response = await apiClient.get<{
    totalInvites: number;
    successfulInvites: number;
    totalRewards: string;
    currency: string;
  }>('/users/me/referral-stats');
  return response.data;
};
