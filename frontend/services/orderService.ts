import type { Order } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export const getOrders = async () => {
  const response = await apiClient.get<Order[]>('/orders');
  return response.data;
};

export type CreateOrderPayload = {
  packageId: string;
  affiliateId?: string;
  referralCode?: string;
  aisheId?: string;
  selectedOptions?: string[];
  limitSize?: number;
  needsInvoice?: boolean;
  invoiceInfo?: {
    companyName: string;
    taxNumber: string;
    taxOffice: string;
    address: string;
  };
};

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await apiClient.post<Order>('/orders', payload);
  return response.data;
};

export type UpdateOrderStatusPayload = {
  status: Order['status'];
};

export const updateOrderStatus = async (id: string, payload: UpdateOrderStatusPayload) => {
  const response = await apiClient.patch<Order>(`/orders/${id}/status`, payload);
  return response.data;
};
