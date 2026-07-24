"use client";

import Link from 'next/link';
import {
  Home,
  LayoutDashboard,
  ShoppingCart,
  User,
  Package,
  MessageCircle,
  LogOut,
} from 'lucide-react';

export type SidebarProfileTab = 'profile' | 'packages' | 'support';

const PROFILE_LINKS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'packages', label: 'My AISHE', icon: Package },
  { key: 'support', label: 'Support', icon: MessageCircle },
] as const;

type UserData = { name?: string | null; email?: string } | null;

type Props = {
  user: UserData;
  onLogout: () => void;
  activeSection?: 'dashboard' | 'order';
  activeProfileTab?: SidebarProfileTab;
  onSelectProfileTab?: (tab: SidebarProfileTab) => void;
  newOrderHref?: string;
};

export function UserPortalSidebar({
  user,
  onLogout,
  activeSection,
  activeProfileTab,
  onSelectProfileTab,
  newOrderHref = '/order',
}: Props) {
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'User';

  return (
    <aside className="hidden lg:block w-56 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-8">
      <div className="mb-6 rounded-2xl border border-white/12 bg-[#2a2a2a]/92 p-5 backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4b5563] text-lg font-bold text-white select-none">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <p className="mt-3 text-sm font-semibold text-white truncate">{displayName}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
      </div>

      <nav className="space-y-1">
        {PROFILE_LINKS.map((item) => {
          const isActive = activeProfileTab === item.key;

          if (onSelectProfileTab) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectProfileTab(item.key)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="text-[13px] font-medium">{item.label}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-200" />}
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={`/profile?tab=${item.key}`}
              className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-slate-200"
            >
              <item.icon className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors" />
              <span className="text-[13px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-white/12 space-y-1">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition">
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs transition ${
            activeSection === 'dashboard'
              ? 'text-slate-200 bg-white/10 border border-white/16'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <Link
          href={newOrderHref}
          className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs transition ${
            activeSection === 'order'
              ? 'text-slate-200 bg-white/10 border border-white/16'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Get New AISHE
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs text-rose-300/85 hover:bg-rose-500/10 hover:text-rose-200 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
