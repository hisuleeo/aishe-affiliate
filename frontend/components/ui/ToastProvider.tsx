'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { Toaster, toast } from 'sonner';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastPayload = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback(({ duration = 4000, variant = 'info', ...payload }: ToastPayload) => {
    const options = {
      duration,
      description: payload.description,
    };
    if (variant === 'success') {
      toast.success(payload.title, options);
      return;
    }
    if (variant === 'error') {
      toast.error(payload.title, options);
      return;
    }
    toast(payload.title, options);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100',
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast, ToastProvider içinde kullanılmalı.');
  }
  return context;
}
