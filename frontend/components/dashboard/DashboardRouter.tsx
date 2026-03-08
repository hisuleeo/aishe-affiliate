'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/useAuth';

const AdminDashboard = dynamic(() => import('./AdminDashboard'), { ssr: false });
const AffiliateDashboard = dynamic(() => import('./AffiliateDashboard'), { ssr: false });
const UserDashboard = dynamic(() => import('./UserDashboard'), { ssr: false });

const LoadingState = () => (
  <div className="flex h-full min-h-[60vh] items-center justify-center">
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 px-8 py-6 text-sm text-slate-300">
      Dashboard yükleniyor...
    </div>
  </div>
);

export function DashboardRouter() {
  const router = useRouter();
  const { isLoading, user, isAuthenticated } = useAuth();

  const DashboardComponent = useMemo(() => {
    if (!user?.role) return null;

    if (user.role === 'admin') return AdminDashboard;
    if (user.role === 'affiliate') return AffiliateDashboard;
    return UserDashboard;
  }, [user?.role]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !DashboardComponent) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
      <DashboardComponent />
    </div>
  );
}
