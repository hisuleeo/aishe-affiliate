import type { User } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
  wantsAffiliateProgram?: boolean;
  wantsReferralProgram?: boolean;
};

export type ProfileResponse = User & {
  wantsAffiliateProgram?: boolean;
  wantsReferralProgram?: boolean;
  aisheMoneyBalance?: string | number | null;
};

export const getProfile = async () => {
  const response = await apiClient.get<ProfileResponse>('/users/me/profile');
  return response.data;
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const response = await apiClient.patch<ProfileResponse>('/users/me/profile', payload);
  return response.data;
};
