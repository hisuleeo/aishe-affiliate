import axios from 'axios';
import type { AffiliateStats, ReferralStats, AffiliateCommission, ReferralReward } from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const getAffiliateStats = async (token: string): Promise<AffiliateStats> => {
  const response = await axios.get(`${API_URL}/api/v1/affiliate/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getAffiliateCommissions = async (token: string): Promise<AffiliateCommission[]> => {
  const response = await axios.get(`${API_URL}/api/v1/affiliate/commissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getReferralStats = async (token: string): Promise<ReferralStats> => {
  const response = await axios.get(`${API_URL}/api/v1/referral/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getReferralRewards = async (token: string): Promise<ReferralReward[]> => {
  const response = await axios.get(`${API_URL}/api/v1/referral/rewards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
