import type { Package } from '@shared/types';
import { apiClient } from '@/lib/api-client';
import type { PackageFormValues } from '@/components/admin/packages/PackageForm';

export const getPackages = async () => {
  const response = await apiClient.get<Package[]>('/packages');
  return response.data;
};

export const createPackage = async (payload: PackageFormValues) => {
  const response = await apiClient.post<Package>('/packages', payload);
  return response.data;
};

export const updatePackage = async (id: string, payload: PackageFormValues) => {
  const response = await apiClient.patch<Package>(`/packages/${id}`, payload);
  return response.data;
};

export const deletePackage = async (id: string) => {
  const response = await apiClient.delete<Package>(`/packages/${id}`);
  return response.data;
};
