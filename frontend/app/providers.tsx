'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { SiteThemeProvider } from '@/components/layout/SiteThemeProvider';

export default function Providers({
  children,
  initialIsUkSite = false,
  initialIsMyAisheSite = false,
}: {
  children: React.ReactNode;
  initialIsUkSite?: boolean;
  initialIsMyAisheSite?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SiteThemeProvider initialIsUkSite={initialIsUkSite} initialIsMyAisheSite={initialIsMyAisheSite}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </SiteThemeProvider>
    </QueryClientProvider>
  );
}
