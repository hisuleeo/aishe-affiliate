"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/auth/useAuth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import UserDashboard from '@/components/dashboard/UserDashboard';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/orderService';

const LoadingState = () => (
  <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
    Yükleniyor...
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user, logout } = useAuth();

  const { isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });

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

  if (isLoading || ordersLoading || !isAuthenticated || !DashboardComponent) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <LoadingState />
      </main>
    );
  }

  // Admin için özel layout - sidebar kendi içinde
  if (user?.role === 'admin') {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        {/* Admin Navbar - Sidebar üzerinde değil */}
        <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur">
          <div className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/aishelogo.png"
                alt="AISHE"
                width={120}
                height={40}
                className="h-7 sm:h-8 w-auto object-contain"
                priority
              />
              <span className="hidden text-xs uppercase tracking-[0.2em] text-slate-500 sm:inline">
                Admin Panel
              </span>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <Link href="/" className="transition hover:text-white">
                Ana sayfa
              </Link>
              <Link href="/dashboard" className="transition hover:text-white">
                Panel
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:inline">
                {user?.name ?? user?.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace('/login');
                }}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </header>
        {/* Admin Dashboard - Sidebar içinde, tam genişlik */}
        <AdminDashboard />
      </main>
    );
  }

  // Normal kullanıcılar için standart layout
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/aishelogo.png"
              alt="AISHE"
              width={120}
              height={40}
              className="h-7 sm:h-8 w-auto object-contain"
              priority
            />
            <span className="hidden text-xs uppercase tracking-[0.2em] text-slate-500 md:inline">
              Dashboard
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">
              Ana sayfa
            </Link>
            <Link href="/dashboard" className="transition hover:text-white">
              Panel
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 md:inline">
              {user?.name ?? user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 py-6 sm:py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
        <DashboardComponent />
      </div>
    </main>
  );
}
