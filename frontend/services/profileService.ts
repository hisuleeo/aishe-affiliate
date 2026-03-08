import type { User } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
};

export const getProfile = async () => {
  const response = await apiClient.get<User>('/users/me/profile');
  return response.data;
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const response = await apiClient.patch<User>('/users/me/profile', payload);
  return response.data;
};
