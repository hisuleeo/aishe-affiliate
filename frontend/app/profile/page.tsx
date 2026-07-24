"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { ExtensionRequest as ExtensionRequestType, AffiliateCommission, ReferralReward, Order } from '@shared/types';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { UserPortalSidebar, type SidebarProfileTab } from '@/components/layout/UserPortalSidebar';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';
import TranslateSelect from '@/components/TranslateSelect';
import { getOrders, updateOrderLabel } from '@/services/orderService';
import { AddOrderFeaturesPanel } from '@/components/user/AddOrderFeaturesPanel';
import { useProgramRates, formatPercent } from '@/lib/useProgramRates';
import { isMyAisheHostname } from '@/lib/is-uk-site';
import { getPackages } from '@/services/packageService';
import { getProfile, updateProfile } from '@/services/profileService';
import { getExtensionRequests, createExtensionRequest } from '@/services/extensionService';
import { getReferralStats, getReferralRewards } from '@/services/referralService';
import { getAffiliateStats, getAffiliateCommissions } from '@/services/affiliateService';
import { getHighwayCertificate } from '@/services/highwayQuizService';
import { HighwayLicenseCard } from '@/components/highway-quiz/HighwayLicenseCard';
import {
  User,
  Package,
  Clock,
  ShoppingBag,
  MessageCircle,
  Mail,
  Tag,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Link as LinkIcon,
  Hash,
  TrendingUp,
  Users,
  Gift,
  Copy,
  ChevronDown,
  Sparkles,
  Trophy,
  Pencil,
  Award,
} from 'lucide-react';

/* ═══════════════════════════════════════
   Constants
═══════════════════════════════════════ */
const BASE_TABS = [
  { key: 'profile',    label: 'Profile',      icon: User          },
  { key: 'packages',   label: 'My AISHEs',    icon: Package       },
  { key: 'extensions', label: 'Extensions',    icon: Clock         },
  { key: 'license',    label: 'License',       icon: Award         },
  { key: 'affiliate',  label: 'Affiliate',     icon: TrendingUp    },
  { key: 'referral',   label: 'Referral',      icon: Users         },
  { key: 'support',    label: 'Support',       icon: MessageCircle },
] as const;

const ALL_TAB_KEYS = BASE_TABS.map(t => t.key);
const SIDEBAR_TAB_KEYS: SidebarProfileTab[] = ['profile', 'packages', 'support'];
const fmtDate = (v: string) => new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtMoney = (v: string | number, _c = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isNaN(parseFloat(String(v))) ? 0 : parseFloat(String(v)));

const NEW_ORDER_HREF = '/order?from=my-aishes';

function getDefaultAisheName(order: Order, packageName: string): string {
  const aisheId = order.aisheId?.trim();
  if (aisheId) return `${aisheId}-AISHE`;
  return packageName;
}

function AisheTitleEditor({
  order,
  packageName,
  packageDescription,
}: {
  order: Order & { aisheLabel?: string | null };
  packageName: string;
  packageDescription?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const defaultName = getDefaultAisheName(order, packageName);
  const [value, setValue] = useState(order.aisheLabel?.trim() ? order.aisheLabel : defaultName);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labelMutation = useMutation({
    mutationFn: (label: string) => updateOrderLabel(order.id, { aisheLabel: label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setEditing(false);
      showToast({ title: 'Name saved', variant: 'success' });
    },
    onError: () => showToast({ title: 'Could not save name', variant: 'error' }),
  });
  useEffect(() => {
    setValue(order.aisheLabel?.trim() ? order.aisheLabel : defaultName);
  }, [order.id, order.aisheLabel, defaultName]);

  const display = order.aisheLabel?.trim() ? order.aisheLabel.trim() : defaultName;

  return (
    <div className="min-w-0 flex-1">
      {editing ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={80}
            placeholder="Name this AISHE"
            className="min-w-0 flex-1 rounded-lg border border-cyan-300/22 bg-[#071427]/80 px-2.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/45 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => labelMutation.mutate(value)}
              disabled={labelMutation.isPending}
              className="rounded-lg border border-cyan-300/35 bg-[linear-gradient(135deg,rgba(24,131,219,0.62),rgba(0,229,255,0.5))] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setValue(order.aisheLabel?.trim() ? order.aisheLabel : defaultName);
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white break-words">{display}</h3>
            {order.aisheLabel?.trim() ? (
              <p className="mt-0.5 text-[10px] text-slate-400">Plan: {packageName}</p>
            ) : null}
            {packageDescription ? (
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{packageDescription}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-lg border border-cyan-300/16 p-1.5 text-slate-400 transition hover:border-cyan-300/35 hover:text-cyan-300"
            title="Name this AISHE"
            aria-label="Name this AISHE"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Main Content
═══════════════════════════════════════ */
function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const programRates = useProgramRates();

  const [activeTab, setActiveTab] = useState(() => {
    const p = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    return ALL_TAB_KEYS.includes(p as (typeof ALL_TAB_KEYS)[number]) ? (p as string) : 'profile';
  });
  const [isMounted, setIsMounted] = useState(false);
  const [isMyAisheHost, setIsMyAisheHost] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  /* ── Queries ── */
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'], queryFn: getProfile, enabled: isAuthenticated,
  });
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'], queryFn: getOrders, enabled: isAuthenticated,
  });
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'], queryFn: getPackages, enabled: isAuthenticated,
  });
  const { data: extensionRequests = [], isLoading: extensionRequestsLoading } = useQuery({
    queryKey: ['extension-requests'], queryFn: getExtensionRequests, enabled: isAuthenticated,
  });

  const showAffiliateTab =
    user?.role === 'affiliate' ||
    (profile == null ? true : profile.wantsAffiliateProgram === true);
  const showReferralTab = profile == null ? true : profile.wantsReferralProgram === true;

  const { data: highwayCertificate, isLoading: highwayCertLoading } = useQuery({
    queryKey: ['highway-certificate'],
    queryFn: getHighwayCertificate,
    enabled: isAuthenticated && isMounted,
    retry: 1,
    staleTime: 60000,
  });

  const TABS = useMemo(
    () =>
      BASE_TABS.filter((t) => {
        if (t.key === 'affiliate') return showAffiliateTab;
        if (t.key === 'referral') return showReferralTab;
        if (t.key === 'license') return !!highwayCertificate;
        return true;
      }),
    [showAffiliateTab, showReferralTab, highwayCertificate],
  );

  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats'], queryFn: getReferralStats,
    enabled: isAuthenticated && isMounted && showReferralTab, retry: 1, staleTime: 30000,
  });
  const { data: affiliateStats } = useQuery({
    queryKey: ['affiliate-stats'], queryFn: getAffiliateStats,
    enabled: isAuthenticated && isMounted && showAffiliateTab, retry: 1, staleTime: 30000,
  });
  const { data: affiliateCommissions = [] } = useQuery({
    queryKey: ['affiliate-commissions'], queryFn: getAffiliateCommissions,
    enabled: isAuthenticated && isMounted && showAffiliateTab, retry: 1, staleTime: 30000,
  });
  const { data: referralRewards = [] } = useQuery({
    queryKey: ['referral-rewards'], queryFn: getReferralRewards,
    enabled: isAuthenticated && isMounted && showReferralTab, retry: 1, staleTime: 30000,
  });
  const packageOptions = useMemo(() => packages ?? [], [packages]);

  /* ── Effects ── */
  useEffect(() => {
    setIsMounted(true);
    setCurrentOrigin(window.location.origin);
    setIsMyAisheHost(isMyAisheHostname(window.location.hostname));
  }, []);
  useEffect(() => { if (!isLoading && !isAuthenticated) router.replace('/login'); }, [isAuthenticated, isLoading, router]);
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders') {
      setActiveTab('packages');
      return;
    }
    if (tab && ALL_TAB_KEYS.includes(tab as (typeof ALL_TAB_KEYS)[number])) setActiveTab(tab);
  }, [searchParams]);
  useEffect(() => {
    if (!profile) return;
    if (activeTab === 'affiliate' && !showAffiliateTab) setActiveTab('profile');
    if (activeTab === 'referral' && !showReferralTab) setActiveTab('profile');
  }, [profile, activeTab, showAffiliateTab, showReferralTab]);
  useEffect(() => {
    const n = profile?.name ?? user?.name ?? '';
    if (!n) { setFirstName(''); setLastName(''); }
    else { const [f, ...r] = n.split(' '); setFirstName(f ?? ''); setLastName(r.join(' ')); }
    setUsername(profile?.username ?? '');
  }, [profile, user?.name, profile?.username]);

  /* ── Handlers ── */
  const [programBusy, setProgramBusy] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    const u = username.trim();
    if (u && !/^[a-z0-9_]+$/i.test(u)) {
      showToast({ title: 'Invalid username', description: 'Only letters, numbers and underscores are allowed.', variant: 'error' });
      setIsSaving(false); return;
    }
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const updated = await updateProfile({ name: fullName || undefined, username: u || undefined });
      updateUser({ name: updated.name ?? fullName, email: updated.email, id: updated.id });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
      queryClient.invalidateQueries({ queryKey: ['referral-code'] });
      showToast({ title: 'Profile updated', variant: 'success' });
    } catch {
      showToast({ title: 'Failed to update profile', description: 'Please check your information and try again.', variant: 'error' });
    } finally { setIsSaving(false); }
  };

  const saveProgram = async (next: { wantsAffiliateProgram?: boolean; wantsReferralProgram?: boolean }) => {
    setProgramBusy(true);
    try {
      await updateProfile(next);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
      queryClient.invalidateQueries({ queryKey: ['referral-code'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
      showToast({ title: 'Program settings updated', variant: 'success' });
    } catch {
      showToast({ title: 'Could not update programs', variant: 'error' });
    } finally {
      setProgramBusy(false);
    }
  };

  const handleCreateExtension = async () => {
    if (!selectedOrderId) { showToast({ title: 'Please select an order', variant: 'error' }); return; }
    try {
      await createExtensionRequest({ orderId: selectedOrderId });
      queryClient.invalidateQueries({ queryKey: ['extension-requests'] });
      setSelectedOrderId('');
      showToast({ title: 'Extension request created', variant: 'success' });
    } catch {
      showToast({ title: 'Failed to create extension request', description: 'Please try again later.', variant: 'error' });
    }
  };

  const clip = (text: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    showToast({ title: label, variant: 'success' });
  };

  /* ── Loading ── */
  if (!isMounted || isLoading || profileLoading) {
    return (
      <main className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-cyan-500 border-t-transparent" />
          <p className="text-sm text-slate-400 animate-pulse">Loading…</p>
        </div>
      </main>
    );
  }

  const normalizedUsername = (profile?.username ?? '').trim().toLowerCase();
  const canonicalAffiliateLink = normalizedUsername ? `${currentOrigin}/ref/${normalizedUsername}` : '';
  const sidebarTabs = TABS.filter((tab) => SIDEBAR_TAB_KEYS.includes(tab.key as SidebarProfileTab));
  const curTab = sidebarTabs.find((t) => t.key === activeTab) ?? sidebarTabs[0] ?? TABS[0];
  const CurIcon = curTab.icon;

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <DashboardNavbar />

      <div className={`pointer-events-none absolute inset-0 z-0 ${isMyAisheHost ? 'bg-transparent' : 'bg-[radial-gradient(circle_at_14%_18%,rgba(0,229,255,0.12),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(45,126,255,0.16),transparent_32%),radial-gradient(circle_at_52%_92%,rgba(98,177,255,0.1),transparent_36%)]'}`} />

      {/* ═══ Body ═══ */}
      <div className="relative z-10 mx-auto mt-4 max-w-7xl px-4 sm:px-6 pt-20 pb-6 lg:mt-6 lg:pt-24 lg:pb-10 flex gap-8">

        {/* ── Sidebar (desktop) ── */}
        <UserPortalSidebar
          user={user}
          activeProfileTab={SIDEBAR_TAB_KEYS.includes(activeTab as SidebarProfileTab) ? (activeTab as SidebarProfileTab) : undefined}
          onSelectProfileTab={(tab) => setActiveTab(tab)}
          newOrderHref={NEW_ORDER_HREF}
          onLogout={() => {
            logout();
            router.replace('/login');
          }}
        />

        {/* ── Main ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile tab selector */}
          <div className="lg:hidden mb-6 relative">
            <button type="button" onClick={() => setMobileOpen(!mobileOpen)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${isMyAisheHost ? 'border-white/14 bg-[#2a2a2a]/92 hover:border-white/25' : 'border-cyan-300/16 bg-[#071427]/72 hover:border-cyan-300/28'}`}>
              <div className="flex items-center gap-3">
                <CurIcon className={`h-4 w-4 ${isMyAisheHost ? 'text-slate-300' : 'text-teal-400'}`} />
                <span className="text-sm font-semibold text-white">{curTab.label}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileOpen && (
              <div className="absolute inset-x-0 top-full z-30 mt-1.5 rounded-xl border border-neutral-800/50 bg-[#222228]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                {sidebarTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} type="button" onClick={() => { setActiveTab(tab.key); setMobileOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${active ? 'bg-teal-500/10 text-white' : 'text-neutral-400 hover:bg-white/[0.04]'}`}>
                      <Icon className={`h-4 w-4 ${active ? 'text-teal-400' : 'text-neutral-500'}`} />
                      <span className="text-sm font-medium">{tab.label}</span>
                      {active && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-teal-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ TAB: Profile ═══ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Hdr icon={User} title="My Profile" desc="Update your personal information" />
              <Bx>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Inp icon={User} label="First Name" value={firstName} onChange={setFirstName} ph="Your first name" />
                  <Inp icon={User} label="Last Name" value={lastName} onChange={setLastName} ph="Your last name" />
                  <Inp icon={Mail} label="Email" value={profile?.email ?? user?.email ?? ''} ro />
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <Inp icon={Tag} label="Username" value={username} onChange={setUsername} ph="username" />
                    <p className="mt-1.5 text-[11px] text-neutral-500">Only letters, numbers and underscores</p>
                    {username.trim() && (showReferralTab || showAffiliateTab) && (
                      <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/[0.04] p-3 space-y-1.5">
                        {showReferralTab && (
                          <p className="text-[11px] text-neutral-400"><span className="text-cyan-300">Referral username:</span>{' '}<span className="font-mono font-semibold text-white">{username.trim().toLowerCase()}</span></p>
                        )}
                        {showAffiliateTab && (
                          <p className="text-[11px] text-neutral-400"><span className="text-cyan-300">Sharing link:</span>{' '}<span className="font-mono text-white break-all">{currentOrigin}/{username.trim().toLowerCase()}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-end">
                    <button type="button" onClick={saveProfile} disabled={isSaving}
                      className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {isSaving && <Spin />} {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </Bx>
              {user?.role !== 'admin' && (
                <Bx className="border-violet-500/15">
                  <h3 className="text-sm font-semibold text-white mb-3">Referral &amp; Affiliate programs</h3>
                  <p className="text-[11px] text-neutral-500 mb-4">
                    Turn programs on to see the corresponding tabs and earn rewards. You can change this anytime.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-[#1a1a1f] accent-teal-500"
                        checked={user?.role === 'affiliate' ? true : Boolean(profile?.wantsAffiliateProgram)}
                        disabled={programBusy || user?.role === 'affiliate'}
                        onChange={(e) => saveProgram({ wantsAffiliateProgram: e.target.checked })}
                      />
                      <span className="text-sm text-neutral-300">
                        <span className="font-medium text-white">Affiliate program</span>
                        {' — '}commissions from your link
                        {user?.role === 'affiliate' ? (
                          <span className="block text-[11px] text-violet-400/90 mt-1">Always on for affiliate accounts.</span>
                        ) : null}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-[#1a1a1f] accent-teal-500"
                        checked={Boolean(profile?.wantsReferralProgram)}
                        disabled={programBusy}
                        onChange={(e) => saveProgram({ wantsReferralProgram: e.target.checked })}
                      />
                      <span className="text-sm text-neutral-300">
                        <span className="font-medium text-white">Referral program</span>
                        {' — '}rewards when friends use your code
                      </span>
                    </label>
                  </div>
                </Bx>
              )}
              {/* AISHE UNIT */}
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.06] to-transparent p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/70">AISHE UNIT</p>
                    <p className="text-xl font-bold text-amber-300">{profileLoading ? '—' : Number(profile?.aisheMoneyBalance ?? 0).toLocaleString('en-US')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/quiz" className="rounded-lg border border-amber-500/25 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/10">Take Quiz →</Link>
                  <Link href={NEW_ORDER_HREF} className="rounded-lg border border-teal-500/25 px-3 py-1.5 text-xs font-medium text-teal-300 transition hover:bg-teal-500/10">Place Order →</Link>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: Packages ═══ */}
          {activeTab === 'packages' && (() => {
            const now = new Date();
            const ao = (orders ?? []).filter(o => o.status?.toLowerCase() === 'paid' && (!o.validUntil || new Date(o.validUntil) >= now));
            const ld = ordersLoading || packagesLoading;
            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Hdr icon={Package} title="My AISHEs" desc={ld ? 'Loading…' : `${ao.length} active AISHE${ao.length !== 1 ? 's' : ''}`} />
                  <Link href={NEW_ORDER_HREF} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Get New AISHE</Link>
                </div>
                {ld ? <Skel /> : ao.length === 0 ? (
                  <Empty icon={Package} title="No active AISHEs yet" desc="Orders you complete will appear here." act={{ href: NEW_ORDER_HREF, label: 'Get New AISHE' }} />
                ) : (
                  <div className="space-y-4">
                    {ao.map(order => {
                      const pkg = (order as any).package ?? packageOptions.find(p => p.id === order.packageId);
                      const vu = order.validUntil ? new Date(order.validUntil) : null;
                      const trialEnd = order.trialEndsAt ? new Date(order.trialEndsAt) : null;
                      const inTrial = Boolean(trialEnd && trialEnd > now);
                      const trialDaysLeft =
                        trialEnd && inTrial
                          ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
                          : null;
                      const dl = vu ? Math.ceil((vu.getTime() - now.getTime()) / 86400000) : null;
                      const w = dl !== null && dl <= 14 && !inTrial;
                      return (
                        <Bx key={order.id} className="relative overflow-hidden">
                          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-teal-500/[0.06] blur-3xl" />
                          <div className="relative">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center"><Package className="h-5 w-5 text-teal-400" /></div>
                                <AisheTitleEditor
                                  order={order as Order}
                                  packageName={pkg?.name ?? 'AISHE Plan'}
                                  packageDescription={pkg?.description}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <GhBtn onClick={() => setActiveTab('extensions')} cls="text-teal-300 border-teal-500/20 hover:bg-teal-500/10"><Clock className="h-3.5 w-3.5" /> Extend Package</GhBtn>
                                {inTrial ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 text-cyan-200 border border-cyan-500/25 px-2.5 py-1 text-[11px] font-semibold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> Free trial
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                  </span>
                                )}
                                {inTrial && trialDaysLeft !== null && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 text-cyan-200 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold">
                                    {trialDaysLeft}d left
                                  </span>
                                )}
                                {w && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 text-[11px] font-semibold">
                                    <AlertCircle className="h-3 w-3" /> {dl} days
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-5">
                              <Mini l="Price" v={fmtMoney(order.amount, order.currency)} ex={order.discountAmount && parseFloat(order.discountAmount) > 0 ? `(-${fmtMoney(order.discountAmount)})` : undefined} />
                              <Mini l="Purchased" v={fmtDate(order.createdAt)} />
                              {order.trialEndsAt ? (
                                <Mini
                                  l="Trial ends"
                                  v={fmtDate(order.trialEndsAt)}
                                  w={inTrial && trialDaysLeft !== null && trialDaysLeft <= 7}
                                  ex={inTrial && trialDaysLeft !== null ? `${trialDaysLeft} days left` : 'Paid period'}
                                />
                              ) : null}
                              <Mini
                                l={order.trialEndsAt ? 'License until' : 'Expires'}
                                v={vu ? fmtDate(order.validUntil!) : '—'}
                                w={w}
                                ex={!inTrial && dl !== null ? `${dl} days left` : undefined}
                              />
                            </div>
                            {(order.aisheId || (order.selectedOptions ?? []).length > 0) && (
                              <div className="flex flex-wrap gap-1.5 mb-5">
                                {order.aisheId && <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/15 px-2 py-1 text-[11px] text-purple-300"><Hash className="h-3 w-3" /> {order.aisheId}</span>}
                                {(order.selectedOptions ?? []).map(opt => <span key={opt} className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 border border-teal-500/15 px-2 py-1 text-[11px] text-teal-300"><Tag className="h-3 w-3" /> {opt}</span>)}
                              </div>
                            )}
                            {pkg && (
                              <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-xl bg-[#222228]/30 border border-neutral-800/30 p-3">
                                <Mini l="Base Price" v={`$${parseFloat(pkg.price ?? '0').toFixed(2)}`} />
                                <Mini l="Currency" v="USD" />
                                {pkg.commissionRate && parseFloat(pkg.commissionRate) > 0 && <Mini l="Commission" v={`${(parseFloat(pkg.commissionRate) * 100).toFixed(0)}%`} />}
                              </div>
                            )}
                            <div className="mb-5">
                              <AddOrderFeaturesPanel order={order as Order} pkg={pkg} />
                            </div>
                          </div>
                        </Bx>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <Hdr
                      icon={ShoppingBag}
                      title="All Orders"
                      desc={ordersLoading ? 'Loading…' : `${orders?.length ?? 0} total order${(orders?.length ?? 0) !== 1 ? 's' : ''}`}
                    />
                  </div>

                  {ordersLoading ? <Skel /> : (orders ?? []).length === 0 ? (
                    <Empty
                      icon={ShoppingBag}
                      title="No orders yet"
                      desc="Get started by placing your first order."
                      act={{ href: NEW_ORDER_HREF, label: 'Place Order' }}
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {(orders ?? []).map(order => {
                        const pkg = (order as any).package ?? packageOptions.find(p => p.id === order.packageId);
                        const isExp = expandedOrderId === order.id;
                        const isExpired = order.validUntil ? new Date(order.validUntil) < new Date() : false;
                        const sc: Record<string, string> = {
                          paid: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                          pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                          failed: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                          canceled: 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30',
                        };

                        return (
                          <div key={order.id} className={`rounded-xl border transition-all ${isExp ? 'border-teal-500/25 bg-[#222228]/40' : 'border-neutral-800/50 hover:border-neutral-700'}`}>
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(isExp ? null : order.id)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 shrink-0 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                  <Package className="h-4 w-4 text-teal-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {(order as Order).aisheLabel?.trim()
                                      ? `${(order as Order).aisheLabel!.trim()} · ${pkg?.name ?? 'AISHE Plan'}`
                                      : `${getDefaultAisheName(order as Order, pkg?.name ?? 'AISHE Plan')} · ${pkg?.name ?? 'AISHE Plan'}`}
                                  </p>
                                  <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {fmtDate(order.createdAt)}
                                    <span className="font-mono">#{order.id.slice(0, 8)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold text-white">{fmtMoney(order.amount, order.currency)}</span>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${sc[order.status] ?? sc.pending}`}>
                                  {order.status}
                                </span>
                                <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {isExp && (
                              <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  <Mini l="Package" v={pkg?.name ?? '—'} />
                                  <Mini l="Amount" v={fmtMoney(order.amount, order.currency)} ex={order.discountAmount && parseFloat(order.discountAmount) > 0 ? `(-${fmtMoney(order.discountAmount)})` : undefined} />
                                  <Mini l="Date" v={fmtDate(order.createdAt)} />
                                  <Mini l="Expires" v={order.validUntil ? fmtDate(order.validUntil) : '—'} w={isExpired} />
                                  <Mini l="Status"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${sc[order.status] ?? sc.pending}`}>{order.status}</span></Mini>
                                  {order.aisheId && <Mini l="AISHE ID" v={order.aisheId} mono />}
                                  {order.aisheMoneyUsed && parseFloat(order.aisheMoneyUsed) > 0 && <Mini l="AISHE Money" v={`$${parseFloat(order.aisheMoneyUsed).toFixed(2)}`} />}
                                  <Mini l="Order ID" mono><p className="text-[11px] font-mono text-neutral-400 break-all">{order.id}</p></Mini>
                                </div>

                                {(order.selectedOptions ?? []).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {(order.selectedOptions ?? []).map(opt => <span key={opt} className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 border border-teal-500/15 px-2 py-1 text-[11px] text-teal-300"><Tag className="h-3 w-3" /> {opt}</span>)}
                                  </div>
                                )}

                                {order.status?.toLowerCase() === 'paid' && pkg?.isCustom && (
                                  <AddOrderFeaturesPanel order={order as Order} pkg={pkg} />
                                )}

                                {order.status?.toLowerCase() === 'paid' && (
                                  <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.04]">
                                    <GhBtn onClick={() => setActiveTab('extensions')} cls="text-teal-300 border-teal-500/20 hover:bg-teal-500/10"><Clock className="h-3.5 w-3.5" /> Extension Request</GhBtn>
                                    <GhBtn onClick={() => clip(order.id, 'Order ID copied')} cls="text-neutral-400 border-neutral-800/50 hover:bg-white/[0.04]"><Copy className="h-3.5 w-3.5" /> Copy</GhBtn>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ═══ TAB: Extensions ═══ */}
          {activeTab === 'extensions' && (
            <div className="space-y-6">
              <Hdr icon={Clock} title="Extension Requests" desc="Manage your package extension requests" />
              <Bx className="border-teal-500/15 bg-teal-500/[0.03]">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Send className="h-4 w-4 text-teal-400" /> New Extension Request</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-800/50 bg-[#222228]/40 px-3.5 py-2.5 text-sm text-white focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition min-h-[42px]">
                    <option value="" className="bg-neutral-900">Select an order…</option>
                    {(orders ?? []).map(o => {
                      const pkg = packageOptions.find(p => p.id === o.packageId);
                      const ord = o as Order;
                      const line = ord.aisheLabel?.trim()
                        ? `${ord.aisheLabel.trim()} (${pkg?.name ?? 'Package'})`
                        : `${getDefaultAisheName(ord, pkg?.name ?? 'Package')} (${pkg?.name ?? 'Package'})`;
                      return <option key={o.id} value={o.id} className="bg-neutral-900">{line} — {fmtDate(o.createdAt)}</option>;
                    })}
                  </select>
                  <button type="button" onClick={handleCreateExtension} className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 whitespace-nowrap flex items-center gap-2"><Send className="h-4 w-4" /> Submit Request</button>
                </div>
              </Bx>
              {extensionRequestsLoading ? <Skel /> : extensionRequests.length === 0 ? (
                <Empty icon={Clock} title="No extension requests yet" desc="Your requests will appear here." />
              ) : (
                <div className="space-y-3">
                  {extensionRequests.map(req => {
                    const pkg = req.order?.package;
                    const sc: Record<string, { icon: any; label: string; cls: string }> = {
                      pending: { icon: AlertCircle, label: 'Awaiting Payment', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
                      paid:    { icon: CheckCircle2, label: 'Paid', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
                      failed:  { icon: XCircle, label: 'Failed', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/20' },
                      canceled:{ icon: XCircle, label: 'Canceled', cls: 'text-neutral-400 bg-neutral-800/50 border-neutral-700/40' },
                    };
                    const s = sc[req.status.toLowerCase()] ?? sc.canceled;
                    const SI = s.icon;
                    return (
                      <Bx key={req.id}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center"><Package className="h-4 w-4 text-teal-400" /></div>
                            <div>
                              <p className="text-sm font-semibold text-white">{pkg?.name ?? 'Package'}</p>
                              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-neutral-500">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(req.createdAt)}</span>
                                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${parseFloat(req.amount).toFixed(2)}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{req.months} mo</span>
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${s.cls}`}><SI className="h-3 w-3" /> {s.label}</span>
                        </div>
                      </Bx>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: Affiliate ═══ */}
          {activeTab === 'affiliate' && (
            <div className="space-y-6">
              <Hdr
                icon={TrendingUp}
                title="Affiliate program"
                desc={`Share your link and earn USD commission on eligible orders (~${formatPercent(programRates.tier1Percent)} direct, ~${formatPercent(programRates.tier2Percent)} second tier in the network).`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat icon={TrendingUp} label="Clicks" value={affiliateStats?.totalClicks ?? 0} color="cyan" />
                <Stat icon={CheckCircle2} label="Conversions" value={affiliateStats?.totalConversions ?? 0} color="emerald" />
                <Stat
                  icon={DollarSign}
                  label="Total earnings (USD)"
                  value={`$${affiliateStats?.totalEarnings ?? '0.00'}`}
                  color="amber"
                />
              </div>
              <Bx>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-teal-400" /> Your sharing link</h3>
                {!normalizedUsername ? (
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-400">Set a username in Profile to activate your sharing link.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/20"
                    >
                      Go to Profile
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Username (canonical)</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          value={normalizedUsername}
                          className="flex-1 rounded-lg border border-neutral-800/50 bg-[#222228]/40 px-3.5 py-2.5 text-sm font-mono font-semibold text-teal-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => clip(normalizedUsername, 'Username copied')}
                          className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 whitespace-nowrap flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" /> Copy username
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={canonicalAffiliateLink}
                        placeholder="Set username to see link"
                        className="flex-1 rounded-lg border border-neutral-800/50 bg-[#222228]/40 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => clip(canonicalAffiliateLink, 'Link copied')}
                        className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 whitespace-nowrap flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" /> Copy link
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Sharing and{' '}
                      <button type="button" onClick={() => setActiveTab('referral')} className="text-teal-400 hover:text-teal-300 underline underline-offset-2">Referral</button>{' '}
                      always use your username in this format: /username.
                    </p>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-neutral-500">
                  Commissions are calculated on order amounts and shown in USD. See the dashboard &quot;Earnings&quot; panel for a detailed summary and tier breakdown.
                </p>
              </Bx>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-teal-400" /> Commission history</h3>
                {affiliateCommissions.length === 0 ? (
                  <Empty
                    icon={TrendingUp}
                    title="No commissions yet"
                    desc="When you share your profile link, approved orders will appear here."
                  />
                ) : (
                  <div className="space-y-2">
                    {affiliateCommissions.map(c => {
                      const oid = (c as any).conversion?.order?.id ?? (c as any).orderId ?? null;
                      const date = (c as any).conversion?.conversionAt ?? (c as any).createdAt ?? null;
                      const tier = (c as { tierLevel?: number }).tierLevel;
                      const tierTxt =
                        tier === 2
                          ? `Tier 2 (~${formatPercent(programRates.tier2Percent)})`
                          : tier === 1
                            ? `Tier 1 (~${formatPercent(programRates.tier1Percent)})`
                            : '';
                      return (
                        <Bx key={c.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">Order #{oid ? oid.slice(0, 8) : '—'}</p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {date ? fmtDate(date) : '—'}
                              {tierTxt ? ` · ${tierTxt}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">${parseFloat(c.amount).toFixed(2)}</p>
                            <StatusBadge status={c.status} />
                          </div>
                        </Bx>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: Referral ═══ */}
          {activeTab === 'referral' && (
            <div className="space-y-6">
              <Hdr
                icon={Users}
                title="Referral program"
                desc="Invite friends and earn USD rewards on paid orders (rules align with the affiliate program)."
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat icon={Users} label="Invites sent" value={referralStats?.totalInvites ?? 0} color="cyan" />
                <Stat icon={CheckCircle2} label="Signed up" value={referralStats?.successfulInvites ?? 0} color="emerald" />
                <Stat icon={Gift} label="Total reward (USD)" value={`$${referralStats?.totalRewards ?? '0.00'}`} color="amber" />
              </div>
              <Bx>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-teal-400" /> Your referral username</h3>
                {!normalizedUsername ? (
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-400">Set a username in Profile to activate referral sharing.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/20"
                    >
                      Go to Profile
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readOnly
                      value={normalizedUsername}
                      className="flex-1 rounded-lg border border-neutral-800/50 bg-[#222228]/40 px-3.5 py-2.5 text-sm font-mono font-bold text-teal-200"
                    />
                    <button
                      type="button"
                      onClick={() => clip(normalizedUsername, 'Username copied')}
                      className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 whitespace-nowrap flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" /> Copy
                    </button>
                  </div>
                )}
              </Bx>
              <Bx className="border-purple-500/15">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-purple-400" /> Your sharing link</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={canonicalAffiliateLink}
                    placeholder="Set username to see link"
                    className="flex-1 rounded-lg border border-neutral-800/50 bg-[#222228]/40 px-3.5 py-2.5 text-sm font-mono text-purple-200 cursor-default placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => clip(canonicalAffiliateLink, 'Link copied')}
                    disabled={!canonicalAffiliateLink}
                    className="rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">
                  Standard format is /username. You can manage your{' '}
                  <button type="button" onClick={() => setActiveTab('profile')} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">username</button>{' '}
                  from the Profile tab.
                </p>
              </Bx>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-teal-400" /> Reward history</h3>
                {referralRewards.length === 0 ? (
                  <Empty
                    icon={Users}
                    title="No rewards yet"
                    desc="When you share your referral code or link, rewards will appear here."
                  />
                ) : (
                  <div className="space-y-2">
                    {referralRewards.map((r: ReferralReward) => (
                      <Bx key={r.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">Order #{r.orderId?.slice(0, 8) ?? '—'}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{fmtDate(r.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">${r.amount}</p>
                          <StatusBadge status={r.status} />
                        </div>
                      </Bx>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: Highway License ═══ */}
          {activeTab === 'license' && (() => {
            const cert = highwayCertificate ?? null;
            return (
              <div className="space-y-6">
                {highwayCertLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  </div>
                ) : cert !== null ? (
                  <Bx>
                    <HighwayLicenseCard certificate={cert} />
                  </Bx>
                ) : (
                  <Bx>
                    <div className="py-12 text-center">
                      <Award className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
                      <p className="text-neutral-400">No license certificate found.</p>
                    </div>
                  </Bx>
                )}
              </div>
            );
          })()}

          {/* ═══ TAB: Support ═══ */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <Hdr icon={MessageCircle} title="Support Center" desc="Send us your questions, we're here to help" />
              <Bx><SupportTicketForm /></Bx>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════
   Micro Components
═══════════════════════════════════════ */
function Hdr({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white flex items-center gap-2"><Icon className="h-5 w-5 text-slate-300" />{title}</h2>
      <p className="mt-0.5 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function Bx({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/12 bg-[#2a2a2a]/92 p-5 backdrop-blur-xl ${className}`}>{children}</div>;
}

function Inp({ icon: Icon, label, value, onChange, ph, ro }: {
  icon: any; label: string; value: string; onChange?: (v: string) => void; ph?: string; ro?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1.5"><Icon className="h-3 w-3" /> {label}</label>
      <input className={`w-full rounded-lg border border-white/14 bg-[#303030]/92 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/28 focus:outline-none focus:ring-1 focus:ring-white/15 transition ${ro ? 'text-slate-400 cursor-not-allowed' : ''}`}
        value={value} onChange={onChange ? e => onChange(e.target.value) : undefined} placeholder={ph} readOnly={ro} />
    </div>
  );
}

function Mini({ l, v, mono, w, ex, children }: { l: string; v?: string | number; mono?: boolean; w?: boolean; ex?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-lg p-2.5 ${w ? 'bg-amber-500/[0.06] border border-amber-500/15' : 'bg-[#303030]/70 border border-white/10'}`}>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">{l}</p>
      {children ?? <p className={`text-sm font-semibold ${w ? 'text-amber-300' : 'text-white'} ${mono ? 'font-mono' : ''}`}>{v}</p>}
      {ex && <p className={`text-[10px] mt-0.5 ${w ? 'text-amber-400/70' : 'text-emerald-400/70'}`}>{ex}</p>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const c: Record<string, string> = {
    cyan: 'bg-[#303030]/88 border-white/12 text-slate-300',
    emerald: 'bg-[#303030]/88 border-white/12 text-emerald-400',
    amber: 'bg-[#303030]/88 border-white/12 text-amber-400',
  };
  return (
    <div className={`rounded-xl border p-5 ${c[color] ?? c.cyan}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Empty({ icon: Icon, title, desc, act }: { icon: any; title: string; desc: string; act?: { href: string; label: string } }) {
  return (
    <div className="rounded-xl border border-white/12 bg-[#2a2a2a]/92 p-10 text-center">
      <Icon className="h-12 w-12 mx-auto mb-3 text-slate-600" />
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
      {act && <Link href={act.href} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/16 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/16"><Sparkles className="h-4 w-4" /> {act.label}</Link>}
    </div>
  );
}

function Skel() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border border-cyan-300/14 bg-[#071427]/72 p-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-white/[0.03] animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GhBtn({ children, onClick, cls = '' }: { children: React.ReactNode; onClick: () => void; cls?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${cls}`}>
      {children}
    </button>
  );
}

function Spin() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

/* ═══════════════════════════════════════
   Export
═══════════════════════════════════════ */
export default function ProfilePage() {
  return <Suspense><ProfilePageContent /></Suspense>;
}
