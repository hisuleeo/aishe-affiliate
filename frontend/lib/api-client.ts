import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Token interceptor
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global error interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  },
);
