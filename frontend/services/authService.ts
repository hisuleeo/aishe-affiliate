import type { UserRole, User } from '@shared/types';
import { apiClient } from '@/lib/api-client';

export type DemoLoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  username: string;
  name?: string;
  referralCode?: string;
};

export type DemoLoginResponse = {
  token: string;
  user: User & { role: UserRole };
};

type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
};

const decodeToken = (token: string): JwtPayload => {
  const base64 = token.split('.')[1] ?? '';
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const json = typeof window !== 'undefined'
    ? window.atob(normalized)
    : Buffer.from(normalized, 'base64').toString('utf-8');
  return JSON.parse(json) as JwtPayload;
};

const normalizeRole = (roles: string[]): UserRole => {
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.includes('AFFILIATE')) return 'affiliate';
  return 'user';
};

export async function apiLogin(payload: DemoLoginRequest): Promise<DemoLoginResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  const token = response.data.accessToken;
  const decoded = decodeToken(token);

  return {
    token,
    user: {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.email,
      status: 'active',
      role: normalizeRole(decoded.roles),
    },
  };
}

export async function apiRegister(payload: RegisterRequest): Promise<DemoLoginResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  const token = response.data.accessToken;
  const decoded = decodeToken(token);

  return {
    token,
    user: {
      id: decoded.sub,
      email: decoded.email,
      name: payload.name ?? payload.username,
      status: 'active',
      role: normalizeRole(decoded.roles),
    },
  };
}

// Demo login: hardcoded admin/affiliate kullanıcı
export async function demoLogin(payload: DemoLoginRequest): Promise<DemoLoginResponse> {
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (normalizedEmail === 'admin@aishe.local' && payload.password === 'Admin123!') {
    return {
      token: 'demo-admin-token',
      user: {
        id: 'admin-user',
        email: 'admin@aishe.local',
        name: 'Demo Admin',
        status: 'active',
        role: 'admin',
      },
    };
  }

  if (normalizedEmail === 'affiliate@aishe.local' && payload.password === 'Affiliate123!') {
    return {
      token: 'demo-affiliate-token',
      user: {
        id: 'affiliate-user',
        email: 'affiliate@aishe.local',
        name: 'Demo Affiliate',
        status: 'active',
        role: 'affiliate',
      },
    };
  }

  return {
    token: 'demo-user-token',
    user: {
      id: 'standard-user',
      email: normalizedEmail,
      name: 'Demo User',
      status: 'active',
      role: 'user',
    },
  };
}
