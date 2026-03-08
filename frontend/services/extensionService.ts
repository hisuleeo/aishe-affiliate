import type { ExtensionRequest } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export const getExtensionRequests = async () => {
  const response = await apiClient.get<ExtensionRequest[]>('/extensions');
  return response.data;
};

export type CreateExtensionRequestPayload = {
  orderId: string;
};

export const createExtensionRequest = async (payload: CreateExtensionRequestPayload) => {
  const response = await apiClient.post<ExtensionRequest>('/extensions', payload);
  return response.data;
};
