"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, ShoppingCart, Package, User, MessageCircle, Clock3, Activity } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { getOrders } from '@/services/orderService';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { UserPortalSidebar } from '@/components/layout/UserPortalSidebar';

const QUICK_LINKS = [
  {
    href: '/profile?tab=packages',
    label: 'My AISHEs',
    desc: 'Active plans and licenses',
    icon: Package,
  },
  {
    href: '/order?from=dashboard',
    label: 'Create Order',
    desc: 'Start a new AISHE order',
    icon: ShoppingCart,
  },
  {
    href: '/profile?tab=profile',
    label: 'Profile',
    desc: 'Account and personal settings',
    icon: User,
  },
  {
    href: '/profile?tab=support',
    label: 'Support',
    desc: 'Open and track tickets',
    icon: MessageCircle,
  },
  {
    href: '/trader-insight',
    label: 'Trader Insight',
    desc: 'Live and minute guidance panel',
    icon: Activity,
  },
];

function LoadingState() {
  return (
    <main className="min-h-screen bg-transparent text-white">
      <DashboardNavbar />
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 pt-24 sm:px-6">
        <div className="rounded-2xl border border-white/12 bg-[#252525]/85 px-8 py-6 text-sm text-slate-300 backdrop-blur-xl">
          Dashboard is loading...
        </div>
      </div>
    </main>
  );
}

function UserDashboardContent({ userRole }: { userRole?: string }) {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    staleTime: 60_000,
  });

  const orderSummary = useMemo(() => {
    const active = orders.filter((o) => o.status?.toLowerCase() === 'paid').length;
    const pending = orders.filter((o) => o.status?.toLowerCase() === 'pending').length;
    const total = orders.length;
    return { active, pending, total };
  }, [orders]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/12 bg-[#262626]/90 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Quick Access</h1>
            <p className="mt-2 text-sm text-slate-400">Fast links for the pages you use most.</p>
          </div>
          {userRole === 'affiliate' && (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-slate-200">
              Affiliate account
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-white/12 bg-[#232323]/92 p-5 transition hover:border-white/25 hover:bg-[#2a2a2a]/95"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-xl border border-white/12 bg-[#2f2f2f] p-2.5 text-slate-200">
                  <Icon className="h-4 w-4" />
                </div>
                <LayoutDashboard className="h-4 w-4 text-slate-500 transition group-hover:text-slate-300" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/12 bg-[#232323]/90 p-4">
          <p className="text-xs text-slate-400">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold text-white">{orderSummary.total}</p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-[#232323]/90 p-4">
          <p className="text-xs text-slate-400">Active AISHEs</p>
          <p className="mt-2 text-2xl font-semibold text-white">{orderSummary.active}</p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-[#232323]/90 p-4">
          <p className="text-xs text-slate-400">Pending Orders</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
            {orderSummary.pending}
            <Clock3 className="h-4 w-4 text-slate-400" />
          </p>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <LoadingState />;
  }

  if (user?.role === 'admin') {
    return (
      <main className="min-h-screen bg-transparent text-white">
        <DashboardNavbar />
        <div className="pt-[72px]">
          <AdminDashboard />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent text-white">
      <DashboardNavbar />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-0 h-[26rem] w-[26rem] rounded-full bg-white/[0.05] blur-[110px]" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-white/[0.04] blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        <div className="flex gap-8">
          <UserPortalSidebar
            user={user}
            activeSection="dashboard"
            newOrderHref="/order?from=dashboard"
            onLogout={() => {
              logout();
              router.replace('/login');
            }}
          />

          <div className="min-w-0 flex-1">
            <UserDashboardContent userRole={user?.role} />
          </div>
        </div>
      </div>
    </main>
  );
}
