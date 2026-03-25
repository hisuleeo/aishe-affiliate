import type { AffiliateStats, ReferralStats, AffiliateCommission, ReferralReward } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export const getAffiliateStats = async (): Promise<AffiliateStats> => {
  const response = await apiClient.get('/api/v1/affiliate/stats');
  return response.data;
};

export const getAffiliateCommissions = async (): Promise<AffiliateCommission[]> => {
  const response = await apiClient.get('/api/v1/affiliate/commissions');
  return response.data;
};

export const getReferralRewards = async (): Promise<ReferralReward[]> => {
  const response = await apiClient.get('/api/v1/referral/rewards');
  return response.data;
};
