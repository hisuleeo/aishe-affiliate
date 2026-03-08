import type { User, UserRoleKey } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export const getUsers = async () => {
  const response = await apiClient.get<User[]>('/users');
  return response.data;
};

export type CreateUserPayload = {
  email: string;
  username: string;
  name?: string;
  password: string;
};

export type UpdateUserPayload = {
  username?: string;
  name?: string;
  status?: User['status'];
  role?: UserRoleKey;
};

export const createUser = async (payload: CreateUserPayload) => {
  const response = await apiClient.post<User>('/users', payload);
  return response.data;
};

const mapRole = (role?: UpdateUserPayload['role']) => {
  if (!role) return undefined;
  return role;
};

const mapStatus = (status?: UpdateUserPayload['status']) => {
  if (!status) return undefined;
  return status.toUpperCase();
};

export const updateUser = async (id: string, payload: UpdateUserPayload) => {
  const response = await apiClient.patch<User>(`/users/${id}`, {
    ...payload,
    role: mapRole(payload.role),
    status: mapStatus(payload.status),
  });
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete<User>(`/users/${id}`);
  return response.data;
};
