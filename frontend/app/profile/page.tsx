"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExtensionRequest as ExtensionRequestType } from '@shared/types';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';
import { getOrders } from '@/services/orderService';
import { getPackages } from '@/services/packageService';
import { getProfile, updateProfile } from '@/services/profileService';
import { getExtensionRequests, createExtensionRequest } from '@/services/extensionService';
import { getReferralStats } from '@/services/referralService';
import { 
  User, 
  Package, 
  Clock, 
  ShoppingBag, 
  MessageCircle,
  LogOut,
  Home,
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Mail,
  Tag,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Gem,
  Link as LinkIcon,
  Phone,
  Lightbulb,
  Hash,
  TrendingUp,
  Users,
  Gift
} from 'lucide-react';

const tabs = [
  { 
    key: 'profile', 
    label: 'Profil Bilgilerim',
    icon: User,
    description: 'Kişisel bilgilerinizi yönetin'
  },
  { 
    key: 'packages', 
    label: 'AISHE Paketlerim',
    icon: Package,
    description: 'Aktif paketlerinizi görüntüleyin'
  },
  { 
    key: 'extensions', 
    label: 'Uzatma Taleplerim',
    icon: Clock,
    description: 'Paket süre uzatma taleplerini yönetin'
  },
  { 
    key: 'orders', 
    label: 'Siparişlerim',
    icon: ShoppingBag,
    description: 'Sipariş geçmişinizi inceleyin'
  },
  { 
    key: 'affiliate', 
    label: 'Affiliate Program',
    icon: TrendingUp,
    description: 'Komisyon kazançlarınızı görün'
  },
  { 
    key: 'referral', 
    label: 'Referans Program',
    icon: Users,
    description: 'Arkadaşlarınızı davet edin'
  },
  { 
    key: 'support', 
    label: 'Destek',
    icon: MessageCircle,
    description: 'Yardım ve destek alın'
  },
];

const formatDate = (value: string) => new Date(value).toLocaleDateString('tr-TR');

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: getPackages,
    enabled: isAuthenticated,
  });

  const { data: extensionRequests = [], isLoading: extensionRequestsLoading } = useQuery({
    queryKey: ['extension-requests'],
    queryFn: getExtensionRequests,
    enabled: isAuthenticated,
  });

  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: getReferralStats,
    enabled: isAuthenticated && isMounted,
  });

  const packageOptions = useMemo(() => packages ?? [], [packages]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const nameSource = profile?.name ?? user?.name ?? '';
    if (!nameSource) {
      setFirstName('');
      setLastName('');
    } else {
      const [first, ...rest] = nameSource.split(' ');
      setFirstName(first ?? '');
      setLastName(rest.join(' '));
    }
    setUsername(profile?.username ?? '');
  }, [profile, user?.name, profile?.username]);

  const saveProfile = async () => {
    setIsSaving(true);
    const normalizedUsername = username.trim();
    if (normalizedUsername && !/^[a-z0-9_]+$/i.test(normalizedUsername)) {
      showToast({
        title: 'Geçersiz kullanıcı adı',
        description: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.',
        variant: 'error',
      });
      setIsSaving(false);
      return;
    }

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const updated = await updateProfile({
        name: fullName || undefined,
        username: normalizedUsername || undefined,
      });
      updateUser({ name: updated.name ?? fullName, email: updated.email, id: updated.id });
      showToast({ title: 'Profil güncellendi', variant: 'success' });
    } catch {
      showToast({
        title: 'Profil güncellenemedi',
        description: 'Lütfen bilgileri kontrol edip tekrar deneyin.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateExtension = async () => {
    if (!selectedOrderId) {
      showToast({ title: 'Lütfen bir sipariş seçin', variant: 'error' });
      return;
    }

    try {
      await createExtensionRequest({ orderId: selectedOrderId });
      queryClient.invalidateQueries({ queryKey: ['extension-requests'] });
      setSelectedOrderId('');
      showToast({ title: 'Uzatma talebi oluşturuldu', variant: 'success' });
    } catch (error) {
      showToast({
        title: 'Uzatma talebi oluşturulamadı',
        description: 'Lütfen daha sonra tekrar deneyin.',
        variant: 'error',
      });
    }
  };

  if (!isMounted || isLoading || profileLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          Yükleniyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/aishelogo.png"
              alt="AISHE"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
            <div className="hidden md:block">
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{profile?.name || user?.name || 'Kullanıcı'}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400">Aktif</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Only on Desktop */}
        <aside className="hidden lg:flex sticky top-16 h-[calc(100vh-4rem)] w-72 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-xl">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Welcome Section */}
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 border border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                Hoş Geldiniz
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Hesabınızı yönetin
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/10 shadow-lg shadow-indigo-500/10 border border-indigo-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${
                      activeTab === tab.key ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold transition-colors ${
                        activeTab === tab.key ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}>
                        {tab.label}
                      </p>
                      <p className={`text-xs transition-colors ${
                        activeTab === tab.key ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-white/5 p-6 space-y-2">
            <Link 
              href="/" 
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Ana Sayfa
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link 
              href="/order" 
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Sipariş Ver
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 mx-auto w-full max-w-7xl px-6 py-10">
          {/* Mobile Tab Navigation */}
          <div className="lg:hidden mb-8 overflow-x-auto -mx-2 px-2">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`group relative flex items-center gap-3 rounded-2xl px-6 py-4 text-left transition-all duration-300 ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/10 shadow-xl shadow-indigo-500/10 border border-indigo-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <Icon className={`h-6 w-6 transition-colors ${
                      activeTab === tab.key ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold transition-colors ${
                        activeTab === tab.key ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}>
                        {tab.label}
                      </p>
                      <p className={`text-xs transition-colors ${
                        activeTab === tab.key ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-sm p-8 shadow-2xl">
            {activeTab === 'profile' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    Profil Bilgileriniz
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">Kişisel bilgilerinizi güncelleyin</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Ad
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Soyad
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Soyadınız"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      E-posta
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                      value={profile?.email ?? user?.email ?? ''}
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      Kullanıcı Adı
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="kullanici_adi"
                    />
                    <p className="mt-2 text-xs text-slate-500">Sadece harf, rakam ve alt çizgi kullanabilirsiniz</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={isSaving}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isSaving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Kaydediliyor...
                          </>
                        ) : (
                          <>
                            💾 Değişiklikleri Kaydet
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'packages' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Package className="h-5 w-5 text-indigo-400" />
                      AISHE Paketlerim
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {packagesLoading ? 'Yükleniyor...' : `${packageOptions.length} aktif paket`}
                    </p>
                  </div>
                  <Link
                    href="/order"
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/40 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Yeni Paket Satın Al
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {packagesLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                      <p className="mt-4 text-sm text-slate-400">Paketler yükleniyor...</p>
                    </div>
                  ) : packageOptions.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg font-semibold text-white">Henüz paket yok</p>
                      <p className="mt-2 text-sm text-slate-400">İlk paketinizi satın alarak başlayın</p>
                    </div>
                  ) : (
                    packageOptions.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Package className="h-5 w-5 text-indigo-400" />
                              </div>
                              <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                            </div>
                            <p className="text-sm text-slate-400">{pkg.description ?? 'Özel AISHE paketi'}</p>
                            <div className="mt-3 flex items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                                <DollarSign className="h-3 w-3" />
                                €{parseFloat(pkg.price).toFixed(2)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Aktif
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('extensions');
                              }}
                              className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:scale-105 flex items-center gap-1.5"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Süre Uzat
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast({ title: 'Detay yakında', variant: 'success' })}
                              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:border-white/20"
                            >
                              📋 Detay
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast({ title: 'Paket durduruldu', variant: 'success' })}
                              className="rounded-full border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-200"
                            >
                              Durdur
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'extensions' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-400" />
                    Uzatma Taleplerim
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">Paket süre uzatma isteklerinizi yönetin ve takip edin</p>
                </div>
                
                <div className="mb-8 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-indigo-400" />
                    Yeni Uzatma Talebi Oluştur
                  </h3>
                  <div className="grid gap-4 md:grid-cols-[2fr_auto]">
                    <div>
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-2">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Sipariş Seçin
                      </label>
                      <select
                        value={selectedOrderId}
                        onChange={(event) => setSelectedOrderId(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      >
                        <option value="" className="bg-slate-900">Sipariş seçin</option>
                        {(orders ?? []).map((order) => {
                          const pkg = packageOptions.find(p => p.id === order.packageId);
                          return (
                            <option key={order.id} value={order.id} className="bg-slate-900">
                              {pkg?.name ?? 'Paket'} - {formatDate(order.createdAt)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleCreateExtension}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 whitespace-nowrap"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Talep Oluştur
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {extensionRequestsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                      <p className="mt-4 text-sm text-slate-400">Talepler yükleniyor...</p>
                    </div>
                  ) : extensionRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg font-semibold text-white">Henüz uzatma talebi yok</p>
                      <p className="mt-2 text-sm text-slate-400">Yeni bir talep oluşturduğunda burada görünecek</p>
                    </div>
                  ) : (
                    extensionRequests.map((request) => {
                      const pkg = request.order?.package;
                      const statusConfig: Record<string, {icon: any; label: string; color: string; glow: string}> = {
                        pending: { 
                          icon: AlertCircle, 
                          label: 'Ödeme Bekliyor', 
                          color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
                          glow: 'shadow-yellow-500/10'
                        },
                        paid: { 
                          icon: CheckCircle2, 
                          label: 'Ödendi', 
                          color: 'border-green-500/30 bg-green-500/10 text-green-300',
                          glow: 'shadow-green-500/10'
                        },
                        failed: { 
                          icon: XCircle, 
                          label: 'Başarısız', 
                          color: 'border-red-500/30 bg-red-500/10 text-red-300',
                          glow: 'shadow-red-500/10'
                        },
                        canceled: { 
                          icon: XCircle, 
                          label: 'İptal Edildi', 
                          color: 'border-slate-700 bg-slate-800/30 text-slate-400',
                          glow: 'shadow-slate-500/10'
                        }
                      };
                      const status = statusConfig[request.status.toLowerCase()] || statusConfig.canceled;
                      const StatusIcon = status.icon;
                      
                      return (
                        <div
                          key={request.id}
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/10">
                                  <Package className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-white">
                                    {pkg?.name ?? 'Paket'}
                                  </h3>
                                  <p className="text-xs text-slate-500">
                                    Sipariş #{request.orderId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{formatDate(request.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span className="font-semibold text-indigo-300">
                                    €{parseFloat(request.amount).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{request.months} ay</span>
                                </div>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold shadow-lg ${status.color} ${status.glow}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{status.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'orders' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-indigo-400" />
                      Siparişlerim
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {ordersLoading ? 'Yükleniyor...' : `Toplam ${orders?.length ?? 0} sipariş`}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                      <p className="mt-4 text-sm text-slate-400">Siparişler yükleniyor...</p>
                    </div>
                  ) : (orders ?? []).length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg font-semibold text-white">Henüz sipariş yok</p>
                      <p className="mt-2 text-sm text-slate-400">İlk siparişinizi oluşturarak başlayın</p>
                    </div>
                  ) : (
                    (orders ?? []).map((order) => (
                      <div
                        key={order.id}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                              <Package className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Sipariş #{order.id.slice(0, 8)}...</p>
                              <div className="mt-1 flex items-center gap-3">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(order.createdAt)}
                                </span>
                                {order.aisheId && (
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {order.aisheId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5" />
                              €{parseFloat(order.amount).toFixed(2)}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'support' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-indigo-400" />
                    Destek Merkezi
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">Sorularınızı bize iletin, size yardımcı olalım</p>
                </div>
                
                <SupportTicketForm />
              </div>
            ) : null}

            {activeTab === 'affiliate' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    Affiliate Program
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">Bağlantılarınız üzerinden satış yapın, komisyon kazanın</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-400">Toplam Tıklama</p>
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-500 mt-1">Bağlantı tıklama sayısı</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-400">Dönüşüm</p>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-500 mt-1">Başarılı satış sayısı</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-400">Toplam Kazanç</p>
                      <DollarSign className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">€0.00</p>
                    <p className="text-xs text-slate-500 mt-1">Tüm komisyon geliri</p>
                  </div>
                </div>

                {/* Affiliate Link Section */}
                <div className="mb-8 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-indigo-400" />
                    Affiliate Bağlantınız
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value="https://aishe.com/ref/YOUR_CODE"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('https://aishe.com/ref/YOUR_CODE');
                        showToast({ title: 'Bağlantı kopyalandı!', variant: 'success' });
                      }}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105"
                    >
                      Kopyala
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Bu bağlantı ile yapılan satışlardan %10 komisyon kazanırsınız</p>
                </div>

                {/* Commissions List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Gift className="h-4 w-4 text-indigo-400" />
                    Komisyon Geçmişi
                  </h3>
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg font-semibold text-white">Henüz komisyon yok</p>
                    <p className="mt-2 text-sm text-slate-400">Affiliate bağlantınızı paylaşmaya başlayın</p>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'referral' ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    Referans Program
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">Arkadaşlarınızı davet edin, ödüller kazanın</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-400">Toplam Davet</p>
                      <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{referralStats?.totalInvites ?? 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Davet ettiğiniz kişi sayısı</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-400">Başarılı Davet</p>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{referralStats?.successfulInvites ?? 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Satın alan kişi sayısı</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-400">Toplam Ödül</p>
                      <Gift className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">€{referralStats?.totalRewards ?? '0.00'}</p>
                    <p className="text-xs text-slate-500 mt-1">Kazandığınız toplam ödül</p>
                  </div>
                </div>

                {/* Referral Code Section */}
                <div className="mb-8 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-400" />
                    Referans Kodunuz
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={profile?.username || 'YOUR_CODE'}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(profile?.username || 'YOUR_CODE');
                        showToast({ title: 'Kod kopyalandı!', variant: 'success' });
                      }}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105"
                    >
                      Kopyala
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Arkadaşlarınız bu kodu kullanarak kayıt olabilir, her satın almada ödül kazanırsınız</p>
                </div>

                {/* Rewards List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Gift className="h-4 w-4 text-indigo-400" />
                    Ödül Geçmişi
                  </h3>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg font-semibold text-white">Henüz ödül yok</p>
                    <p className="mt-2 text-sm text-slate-400">Referans kodunuzu paylaşmaya başlayın</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          
          {/* Modern Footer */}
          <div className="mt-12 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-8 backdrop-blur-sm">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Gem className="h-4 w-4 text-indigo-400" />
                  AISHE
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Profesyonel ve güvenilir paket yönetim sistemi. 
                  Müşteri memnuniyeti odaklı hizmet anlayışımızla yanınızdayız.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-indigo-400" />
                  Hızlı Bağlantılar
                </h3>
                <div className="space-y-2">
                  <Link href="/" className="block text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <Home className="h-3 w-3" />
                    Ana Sayfa
                  </Link>
                  <Link href="/dashboard" className="block text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <LayoutDashboard className="h-3 w-3" />
                    Dashboard
                  </Link>
                  <Link href="/order" className="block text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3" />
                    Yeni Sipariş
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-400" />
                  İletişim
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sorularınız için destek bölümünden bize ulaşabilirsiniz. 
                  Size en kısa sürede dönüş yapacağız.
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                © 2026 AISHE. Tüm hakları saklıdır.
                <Sparkles className="h-3 w-3 text-indigo-400" />
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
