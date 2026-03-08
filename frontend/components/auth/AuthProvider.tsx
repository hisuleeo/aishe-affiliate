'use client';

import { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'admin' | 'affiliate' | 'user';

export type AuthUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string;
  status?: 'active' | 'blocked';
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Mock/stub auth provider (API entegrasyonu yerine localStorage okur)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = window.localStorage.getItem('auth_token');
    const role = (window.localStorage.getItem('auth_role') as UserRole | null) ?? 'user';

    if (!token) {
      return null;
    }

    const storedUser = window.localStorage.getItem('auth_user');
    const parsedUser = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;

    return (
      parsedUser ?? {
        id: 'demo-user',
        role,
        name: 'Demo Kullanıcı',
      }
    );
  });

  const login = (nextUser: AuthUser, token: string) => {
    window.localStorage.setItem('auth_token', token);
    window.localStorage.setItem('auth_role', nextUser.role);
    window.localStorage.setItem('auth_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('auth_role');
    window.localStorage.removeItem('auth_user');
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('auth_user', JSON.stringify(next));
      }
      return next;
    });
  };

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      user,
      login,
      logout,
      updateUser,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  }
  return context;
}
