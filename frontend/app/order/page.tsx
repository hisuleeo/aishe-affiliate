'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MarketingSiteHeader } from '@/components/layout/MarketingSiteHeader';
import { useQuery } from '@tanstack/react-query';
import type { Order, Package, PackageOption } from '@shared/types';
import {
  ORDER_BASE_PRICE,
  ORDER_FEATURES,
  computeCustomOrderAmount,
  getLotPrice,
} from '@/lib/pricing';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserPortalSidebar } from '@/components/layout/UserPortalSidebar';
import { getPackages } from '@/services/packageService';
import { createOrder } from '@/services/orderService';
import { apiClient } from '@/lib/api-client';
import { isMyAisheHostname, isUkSiteHostname } from '@/lib/is-uk-site';

type DiscountPreview = {
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  campaignName: string;
};

const FALLBACK_CUSTOM_PACKAGE: Package = {
  id: 'fallback-custom-package',
  name: 'NEW AISHE',
  description: 'Dynamic plan with configurable features',
  price: String(ORDER_BASE_PRICE),
  currency: 'USD',
  commissionRate: '0',
  isActive: true,
  isCustom: true,
  customOptions: [],
};

const PAYMENT_INFO = {
  iban: 'TR00 0000 0000 0000 0000 0000 00',
  accountName: 'AISHE Technologies Ltd.',
  bankName: 'Isbank',
};

function OrderConfetti() {
  const pieces = Array.from({ length: 24 }, (_, index) => ({
    id: index,
    left: `${(index * 97) % 100}%`,
    delay: `${(index % 8) * 0.2}s`,
    duration: `${3.6 + (index % 4) * 0.5}s`,
    color: ['#22d3ee', '#06b6d4', '#67e8f9', '#a5f3fc'][index % 4],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-[-10%] h-2.5 w-2.5 rounded-sm"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationName: 'orderConfettiFall',
            animationDuration: piece.duration,
            animationDelay: piece.delay,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
}

// Cookie helper function
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

const formatCurrency = (amount: string | number, _currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isNaN(value) ? 0 : value);
};

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { showToast } = useToast();
  const { data, isLoading: packagesLoading, isError } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
    enabled: isAuthenticated,
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({});
  const [lotSizes, setLotSizes] = useState<Record<string, number>>({});
  const [aisheId, setAisheId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState({
    type: 'individual' as 'corporate' | 'individual',
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
    fullName: '',
    nationalId: '',
  });
  const [useAisheeMoney, setUseAisheeMoney] = useState(false);
  const [currentHost, setCurrentHost] = useState('');
  const hasFreeTrial = currentHost ? !isUkSiteHostname(currentHost) : false;
  const isMyAisheHost = currentHost ? isMyAisheHostname(currentHost) : false;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHost(window.location.hostname);
    }
  }, []);

  // Fetch user AISHE Money balance
  const { data: profileData } = useQuery({
    queryKey: ['profile-balance'],
    queryFn: async () => {
      const res = await apiClient.get<{ aisheMoneyBalance?: string | null }>('/users/me/profile');
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const aisheMoneyBalance = Number(profileData?.aisheMoneyBalance ?? 0);

  // Read affiliate cookie for discount preview
  const affiliateCookie = typeof document !== 'undefined' ? getCookie('aishe_ref') : null;
  const { data: discountPreview } = useQuery<DiscountPreview | null>({
    queryKey: ['discount-preview', affiliateCookie],
    queryFn: async () => {
      const params = affiliateCookie ? { affiliateCode: affiliateCookie } : {};
      const res = await apiClient.get<DiscountPreview | null>('/orders/discount-preview', { params });
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isError) {
      showToast({
        title: 'Failed to load packages',
        description: 'Please try again later.',
        variant: 'error',
      });
    }
  }, [isError, showToast]);

  const packages = useMemo(() => data ?? [], [data]);
  const packageIdParam = searchParams.get('packageId');
  const packageNameParam = searchParams.get('packageName');
  const customParam = searchParams.get('custom');
  const hasRequestedPackage = Boolean(packageIdParam || packageNameParam || customParam);
  const requestedPackage = useMemo(() => {
    if (packageIdParam) {
      return packages.find((pkg) => pkg.id === packageIdParam) ?? null;
    }
    if (customParam === 'true') {
      return packages.find((pkg) => pkg.isCustom) ?? null;
    }
    if (packageNameParam) {
      const normalized = packageNameParam.toLowerCase();
      return packages.find((pkg) => pkg.name.toLowerCase() === normalized) ?? null;
    }
    return null;
  }, [customParam, packageIdParam, packageNameParam, packages]);

  // Default (no query): same as homepage PricingSection — only the first custom AISHE, not every custom row
  const visiblePackages = useMemo(() => {
    const primaryCustom = packages.find((p) => p.isCustom) ?? null;
    const raw = requestedPackage
      ? [requestedPackage]
      : hasRequestedPackage
        ? []
        : primaryCustom
          ? [primaryCustom]
          : packages.length > 0
            ? [packages[0]]
            : [FALLBACK_CUSTOM_PACKAGE];
    const byId = new Map<string, Package>();
    for (const p of raw) {
      if (p?.id && !byId.has(p.id)) {
        byId.set(p.id, p);
      }
    }
    return Array.from(byId.values());
  }, [requestedPackage, hasRequestedPackage, packages]);
  const selectedPackage =
    visiblePackages.find((pkg) => pkg.id === selectedPackageId) ??
    (visiblePackages.length === 1 ? visiblePackages[0] : null);
  const isFallbackSelection = selectedPackage?.id === FALLBACK_CUSTOM_PACKAGE.id;
  const defaultOptionalFeatureIds = useMemo(
    () => ORDER_FEATURES.filter((feature) => !feature.necessary && feature.id !== 'hwdlx').map((feature) => feature.id),
    []
  );

  useEffect(() => {
    if (packagesLoading || packages.length === 0) return;

    if (requestedPackage) {
      setSelectedPackageId(requestedPackage.id);
      
      // Read selected features from URL
      const selectedOptionsParam = searchParams.get('selectedOptions');
      if (selectedOptionsParam && requestedPackage.isCustom) {
        const optionsArray = selectedOptionsParam.split(',').filter(Boolean);
        setCustomSelections((prev) => ({
          ...prev,
          [requestedPackage.id]: optionsArray,
        }));
      }
      // Read lot size from URL
      const lotSizeParam = searchParams.get('lotSize');
      if (lotSizeParam && requestedPackage.isCustom) {
        const ls = parseFloat(lotSizeParam);
        if (!isNaN(ls) && ls > 0) {
          setLotSizes((prev) => ({ ...prev, [requestedPackage.id]: ls }));
        }
      }
    }
  }, [packages.length, packagesLoading, requestedPackage, searchParams]);

  useEffect(() => {
    if (packagesLoading || hasRequestedPackage || requestedPackage) return;
    if (visiblePackages.length !== 1) return;
    const only = visiblePackages[0];
    if (!only?.id) return;
    setSelectedPackageId((current) => (current ? current : only.id));
  }, [hasRequestedPackage, requestedPackage, packagesLoading, visiblePackages]);

  useEffect(() => {
    if (visiblePackages.length === 0) return;

    setCustomSelections((prev) => {
      const next = { ...prev };
      for (const pkg of visiblePackages) {
        if (!pkg.isCustom) continue;
        if (!next[pkg.id]) {
          next[pkg.id] = defaultOptionalFeatureIds;
        }
      }
      return next;
    });

    setLotSizes((prev) => {
      const next = { ...prev };
      for (const pkg of visiblePackages) {
        if (!pkg.isCustom) continue;
        if (typeof next[pkg.id] !== 'number' || next[pkg.id] <= 0) {
          next[pkg.id] = 1;
        }
      }
      return next;
    });
  }, [visiblePackages, defaultOptionalFeatureIds]);

  const getCustomPrice = (selected: string[], lotSize: number) =>
    computeCustomOrderAmount(selected, lotSize);

  const totalPrice = selectedPackage
    ? selectedPackage.isCustom
      ? getCustomPrice(
          customSelections[selectedPackage.id] ?? [],
          lotSizes[selectedPackage.id] ?? 1
        )
      : Number(selectedPackage.price)
    : 0;

  const discountAmount = useMemo(() => {
    if (!discountPreview || totalPrice === 0) return 0;
    if (discountPreview.discountType === 'PERCENTAGE') {
      return totalPrice * (Number(discountPreview.discountValue) / 100);
    }
    return Math.min(Number(discountPreview.discountValue), totalPrice);
  }, [discountPreview, totalPrice]);

  const aisheMoneyApplied = useAisheeMoney
    ? Math.min(aisheMoneyBalance, Math.max(0, totalPrice - discountAmount))
    : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount - aisheMoneyApplied);

  const handleOrder = async () => {
    if (!selectedPackage) {
      showToast({ title: 'Please select a package', variant: 'error' });
      return;
    }

    if (isFallbackSelection) {
      showToast({
        title: 'Packages could not be loaded',
        description: 'Order creation is blocked because package data is unavailable.',
        variant: 'error',
      });
      return;
    }

    if (!aisheId.trim()) {
      showToast({
        title: 'AISHE ID required',
        description: 'Please enter your computer ID to proceed with the order.',
        variant: 'error',
      });
      return;
    }

    if (needsInvoice) {
      if (!invoiceInfo.type || !['corporate', 'individual'].includes(invoiceInfo.type)) {
        showToast({
          title: 'Invoice type required',
          description: 'Please choose corporate or individual invoicing.',
          variant: 'error',
        });
        return;
      }
    }

    // Validate limitSize
    if (selectedPackage.isCustom) {
      const ls = lotSizes[selectedPackage.id] ?? 0;
      if (ls > 0 && (ls < 1 || ls > 10000)) {
        showToast({
          title: 'Invalid Lot Size',
          description: 'Lot size must be between 1.0 and 10,000.',
          variant: 'error',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Get affiliate code from cookie
      const affiliateCode = getCookie('aishe_ref');
      
      const trimmedAddr = invoiceInfo.address.trim();
      const invoicePayload = needsInvoice
        ? {
            type: invoiceInfo.type,
            ...(invoiceInfo.type === 'corporate'
              ? {
                  ...(invoiceInfo.companyName.trim() ? { companyName: invoiceInfo.companyName.trim() } : {}),
                  ...(invoiceInfo.taxNumber.trim() ? { taxNumber: invoiceInfo.taxNumber.trim() } : {}),
                  ...(invoiceInfo.taxOffice.trim() ? { taxOffice: invoiceInfo.taxOffice.trim() } : {}),
                  ...(trimmedAddr ? { address: trimmedAddr } : {}),
                }
              : {
                  ...(invoiceInfo.fullName.trim() ? { fullName: invoiceInfo.fullName.trim() } : {}),
                  ...(!isMyAisheHost && invoiceInfo.nationalId.trim() ? { nationalId: invoiceInfo.nationalId.trim() } : {}),
                  ...(trimmedAddr ? { address: trimmedAddr } : {}),
                }),
          }
        : undefined;

      const created = await createOrder({
        packageId: selectedPackage.id,
        aisheId: aisheId.trim(),
        selectedOptions: customSelections[selectedPackage.id] || [],
        limitSize:
          selectedPackage.isCustom && (lotSizes[selectedPackage.id] ?? 0) > 0
            ? lotSizes[selectedPackage.id] ?? 0
            : undefined,
        needsInvoice,
        invoiceInfo: invoicePayload,
        affiliateCode: affiliateCode || undefined,
        useAisheeMoney: useAisheeMoney && aisheMoneyBalance > 0,
      });
      setCreatedOrder(created);
      showToast({
        title: 'Order created',
        description: 'Your order has been successfully placed.',
        variant: 'success',
      });
      setOrderSuccess(true);
    } catch {
      showToast({
        title: 'Order could not be created',
        description: 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadInvoicePdf = async () => {
    if (!createdOrder) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const selectedOptionIds = Array.isArray(createdOrder.selectedOptions)
      ? createdOrder.selectedOptions
      : customSelections[selectedPackage?.id ?? ''] ?? [];
    const selectedOptionLabels = ORDER_FEATURES
      .filter((feature) => selectedOptionIds.includes(feature.id))
      .map((feature) => feature.label);
    const lotSize = selectedPackage?.isCustom ? (lotSizes[selectedPackage.id] ?? 0) : 0;

    const orderAmount = Number(createdOrder.amount ?? totalPrice);
    const finalAmount = Number.isFinite(finalPrice) ? finalPrice : orderAmount;
    const appliedDiscount = Math.max(0, orderAmount - finalAmount);

    const logo = new Image();
    const logoLoaded = new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });
    logo.src = '/brand/aishelogo.png';
    await logoLoaded;

    if (logo.complete && logo.naturalWidth > 0) {
      doc.addImage(logo, 'PNG', 14, 10, 34, 14);
    }

    doc.setFontSize(16);
    doc.text('AISHE Invoice', 14, 34);
    doc.setFontSize(10);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 42);
    doc.text(`Order ID: ${createdOrder.id}`, 14, 48);
    doc.text(`Order Status: ${(createdOrder.status || 'pending').toUpperCase()}`, 14, 54);
    doc.text(`AISHE ID: ${createdOrder.aisheId || aisheId || '-'}`, 14, 60);
    doc.text(`Package: ${selectedPackage?.name ?? 'NEW AISHE'}`, 14, 66);
    doc.text(`Billing Type: ${invoiceInfo.type === 'corporate' ? 'Corporate' : 'Individual'}`, 14, 72);

    if (invoiceInfo.type === 'corporate') {
      doc.text(`Company: ${invoiceInfo.companyName || '-'}`, 14, 80);
      doc.text(`Tax Number: ${invoiceInfo.taxNumber || '-'}`, 14, 86);
      doc.text(`Tax Office: ${invoiceInfo.taxOffice || '-'}`, 14, 92);
    } else {
      doc.text(`Full Name: ${invoiceInfo.fullName || '-'}`, 14, 80);
      if (!isMyAisheHost) {
        doc.text(`National ID: ${invoiceInfo.nationalId || '-'}`, 14, 86);
      }
    }
    doc.text(`Address: ${invoiceInfo.address || '-'}`, 14, 98);

    let y = 112;
    doc.setFontSize(12);
    doc.text('Order Details', 14, y);
    y += 7;
    doc.setDrawColor(80, 80, 80);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFontSize(10);
    doc.text('Plan', 14, y);
    doc.text(formatCurrency(orderAmount, 'USD'), 196, y, { align: 'right' });
    y += 6;

    if (selectedOptionLabels.length > 0) {
      const optionLines = doc.splitTextToSize(
        `Selected options: ${selectedOptionLabels.join(', ')}`,
        165,
      ) as string[];
      doc.text(optionLines, 14, y);
      y += optionLines.length * 5;
    }

    if (lotSize > 0) {
      doc.text(`Lot size: ${lotSize.toFixed(1)}`, 14, y);
      y += 6;
    }

    doc.text('Subtotal', 14, y);
    doc.text(formatCurrency(orderAmount, 'USD'), 196, y, { align: 'right' });
    y += 6;

    if (appliedDiscount > 0) {
      doc.text('Discount / Credit', 14, y);
      doc.text(`-${formatCurrency(appliedDiscount, 'USD')}`, 196, y, { align: 'right' });
      y += 6;
    }

    doc.setFontSize(11);
    doc.text('Total', 14, y);
    doc.text(formatCurrency(finalAmount, 'USD'), 196, y, { align: 'right' });
    y += 10;

    doc.setFontSize(12);
    doc.text('Payment Details', 14, y);
    y += 7;
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFontSize(9);
    doc.text(`Bank: ${PAYMENT_INFO.bankName}`, 14, y);
    y += 6;
    doc.text(`Account Name: ${PAYMENT_INFO.accountName}`, 14, y);
    y += 6;
    doc.text(`IBAN: ${PAYMENT_INFO.iban}`, 14, y);

    doc.save(`aishe-invoice-${createdOrder.id}.pdf`);
  };

  if (isLoading || packagesLoading) {
    return (
      <main className="min-h-screen bg-transparent text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(0,229,255,0.12),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(45,126,255,0.16),transparent_32%),radial-gradient(circle_at_52%_92%,rgba(98,177,255,0.1),transparent_36%)]" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-slate-300">Loading...</div>
        </div>
      </main>
    );
  }

  if (orderSuccess) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-transparent pt-24 text-white">
        <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(0,229,255,0.12),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(45,126,255,0.16),transparent_32%),radial-gradient(circle_at_52%_92%,rgba(98,177,255,0.1),transparent_36%)]" />
        <OrderConfetti />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 flex gap-8">
          <UserPortalSidebar
            user={user}
            activeSection="order"
            onLogout={() => {
              logout();
              router.replace('/login');
            }}
          />
          <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center py-10 sm:py-14">
          <div className="rounded-3xl border border-cyan-500/30 bg-[#1b2338]/70 p-8 w-full shadow-[0_30px_90px_-50px_rgba(34,211,238,0.55)]">
            <h1 className="text-3xl font-bold text-white">Payment Step</h1>
            <p className="mt-2 text-sm text-cyan-100/80">Your order has been received. Please complete the bank transfer.</p>
            <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/8 p-4 text-left text-sm">
              <p className="text-slate-300">Bank</p>
              <p className="mt-1 font-semibold text-white">{PAYMENT_INFO.bankName}</p>
              <p className="mt-3 text-slate-300">Account Name</p>
              <p className="mt-1 font-semibold text-white">{PAYMENT_INFO.accountName}</p>
              <p className="mt-3 text-slate-300">IBAN</p>
              <p className="mt-1 font-semibold text-cyan-200 notranslate" translate="no">{PAYMENT_INFO.iban}</p>
            </div>

            {needsInvoice ? (
              <button
                type="button"
                onClick={downloadInvoicePdf}
                className="mt-4 w-full rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
              >
                Download AISHE Invoice PDF
              </button>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setOrderSuccess(false);
                setCreatedOrder(null);
                setSelectedPackageId('');
                setAisheId('');
                setCustomSelections({});
                setNeedsInvoice(false);
                setInvoiceInfo({
                  type: 'individual',
                  companyName: '',
                  taxNumber: '',
                  taxOffice: '',
                  address: '',
                  fullName: '',
                  nationalId: '',
                });
              }}
              className="rounded-xl border border-[#3a3a3a] px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Create New Order
            </button>
          </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes orderConfettiFall {
            0% {
              transform: translateY(-10vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(115vh) rotate(360deg);
              opacity: 0.4;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent pt-24 text-white">
      <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(0,229,255,0.12),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(45,126,255,0.16),transparent_32%),radial-gradient(circle_at_52%_92%,rgba(98,177,255,0.1),transparent_36%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10 flex gap-8">
        <UserPortalSidebar
          user={user}
          activeSection="order"
          onLogout={() => {
            logout();
            router.replace('/login');
          }}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start">
            <div className="flex min-w-0 flex-col gap-6">
            <div
              className={
                visiblePackages.length > 1
                  ? 'grid grid-cols-1 gap-6 sm:grid-cols-2'
                  : 'grid grid-cols-1 gap-6'
              }
            >
            {visiblePackages.length === 0 ? (
              <EmptyState
                title={hasRequestedPackage ? 'Selected package not found' : 'No packages found'}
                description={
                  hasRequestedPackage
                    ? 'You can go back to the homepage and select the package again.'
                    : 'Packages will be displayed here when available.'
                }
              />
            ) : (
              visiblePackages.map((pkg) => {
                const selected = selectedPackageId === pkg.id;
                const selections = customSelections[pkg.id] ?? (pkg.isCustom ? defaultOptionalFeatureIds : []);
                const currentLotSize = lotSizes[pkg.id] ?? (pkg.isCustom ? 1 : 0);
                const isAishePackage = pkg.name.toLowerCase().includes('aishe');
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`min-w-0 rounded-[32px] border p-4 text-slate-100 shadow-[0_20px_60px_-40px_rgba(6,182,212,0.22)] transition sm:p-5 ${
                      selected
                        ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-[#252525]/80 to-[#1e1e1e]'
                        : 'border-[#333333]/70 bg-gradient-to-br from-[#1e1e1e] via-[#1e1e1e]/80 to-cyan-500/8'
                    } cursor-pointer`}
                  >
                    <div className="rounded-2xl border border-[#333333]/70 bg-[#1e1e1e]/50 p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">AISHE ID</p>
                          <h3 className="mt-2 text-lg font-semibold">AISHE ID</h3>
                          <p className="mt-2 text-xs text-slate-400">Enter your device ID for activation.</p>
                        </div>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-200">
                          Required
                        </span>
                      </div>

                      <input
                        value={aisheId}
                        onChange={(event) => setAisheId(event.target.value)}
                        placeholder="Computer ID"
                        className="mt-4 w-full rounded-2xl border border-[#3a3a3a] bg-[#1e1e1e]/70 px-4 py-3 text-base text-white placeholder:text-slate-500 min-h-[44px]"
                      />

                      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                        <p className="font-semibold">Please make sure your computer ID is correct.</p>
                        <p className="mt-2 text-amber-100/80">
                          1) Copy the ID generated after installation.
                          2) Paste it into this field.
                          3) Continue with your order.
                        </p>
                      </div>
                    </div>

                    {hasRequestedPackage ? (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        Selected Package
                      </div>
                    ) : null}
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">NEW AISHE</p>
                      {(pkg.isCustom || isAishePackage) ? (
                        <>
                          <div className="mt-2 flex items-end justify-center gap-2 notranslate" translate="no">
                            <span className="text-2xl text-slate-400">$</span>
                            <span className="text-5xl font-bold text-slate-100">
                              {pkg.isCustom ? getCustomPrice(selections, currentLotSize) : Number(pkg.price)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-3xl font-bold text-cyan-200 notranslate" translate="no">
                          {formatCurrency(
                            pkg.isCustom ? getCustomPrice(selections, currentLotSize) : pkg.price,
                            pkg.currency,
                          )}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">{hasFreeTrial ? '14-day trial · 30-day license' : '30-day license'}</p>
                    </div>

                    {pkg.isCustom ? (
                      <div className="mt-6 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
                          Plan Contents
                        </p>

                        {ORDER_FEATURES.map((feature) => {
                          const isChecked = feature.necessary || selections.includes(feature.id);
                          const isDisabled = feature.necessary;
                          return (
                            <label
                              key={feature.id}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                                isDisabled
                                  ? 'cursor-default opacity-70'
                                  : 'cursor-pointer hover:bg-slate-800/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => {
                                  if (isDisabled) return;
                                  setCustomSelections((prev) => {
                                    const current = prev[pkg.id] ?? defaultOptionalFeatureIds;
                                    const next = isChecked
                                      ? current.filter((id) => id !== feature.id)
                                      : [...current, feature.id];
                                    return { ...prev, [pkg.id]: next };
                                  });
                                }}
                                className="h-4 w-4 flex-shrink-0 accent-cyan-500 disabled:opacity-50"
                              />
                              <span className="flex-1 text-sm notranslate" translate="no">{feature.label}</span>
                              <span className="text-xs font-medium">
                                {feature.necessary ? (
                                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400">
                                    Included
                                  </span>
                                ) : (
                                  <span className={`notranslate ${
                                    selections.includes(feature.id) ? 'text-cyan-300' : 'text-slate-500'
                                  }`} translate="no">
                                    +{formatCurrency(feature.price, 'USD')}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}

                        {/* Limit Lot Size stepper */}
                        <div className="mt-3 rounded-xl border border-[#3a3a3a]/50 bg-[#2a2a2a]/40 p-3">
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1 hover:bg-slate-800/30">
                            <input
                              type="checkbox"
                              checked={currentLotSize > 0}
                              onChange={() =>
                                setLotSizes((prev) => ({
                                  ...prev,
                                  [pkg.id]: currentLotSize > 0 ? 0 : 1,
                                }))
                              }
                              className="h-4 w-4 flex-shrink-0 accent-cyan-500"
                            />
                            <span className="flex-1 text-sm">Limit lot size</span>
                            <span className={`text-xs font-medium rounded-full px-2 py-0.5 notranslate ${
                              currentLotSize > 0 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                            }`} translate="no">
                              {currentLotSize > 0
                                ? currentLotSize <= 1
                                  ? 'Included'
                                  : `+${formatCurrency(getLotPrice(currentLotSize), 'USD')}`
                                : 'Included'}
                            </span>
                          </label>
                          {currentLotSize > 0 && (
                            <div className="mt-2 flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setLotSizes((prev) => ({
                                    ...prev,
                                    [pkg.id]: Math.max(1, Math.round((currentLotSize - 0.1) * 10) / 10),
                                  }))
                                }
                                disabled={currentLotSize <= 1}
                                className="h-8 w-8 rounded-xl border border-[#3a3a3a] bg-[#1e1e1e]/70 text-lg text-slate-200 hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={10000}
                                step={0.1}
                                value={currentLotSize}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) {
                                    const clamped = Math.min(10000, Math.max(1, Math.round(val * 10) / 10));
                                    setLotSizes((prev) => ({ ...prev, [pkg.id]: clamped }));
                                  }
                                }}
                                className="h-8 w-[90px] rounded-xl border border-cyan-700/60 bg-[#1e1e1e]/60 text-center text-sm font-semibold text-cyan-200 outline-none focus:ring-1 focus:ring-cyan-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setLotSizes((prev) => ({
                                    ...prev,
                                    [pkg.id]: Math.min(10000, Math.round((currentLotSize + 0.1) * 10) / 10),
                                  }))
                                }
                                disabled={currentLotSize >= 10000}
                                className="h-8 w-8 rounded-xl border border-[#3a3a3a] bg-[#1e1e1e]/70 text-lg text-slate-200 hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-6 text-center text-sm font-semibold text-white">
                        {formatCurrency(pkg.price, pkg.currency)}
                      </p>
                    )}
                  </div>
                );
              })
            )}
            </div>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1e1e1e]/40 p-6 xl:sticky xl:top-24">
            {!selectedPackage ? (
              <div className="mt-6">
                <EmptyState
                  title="No package selected"
                  description="Your selected package will appear here."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[#333333]/70 bg-[#1e1e1e]/60 p-4">
                  <p className="text-sm font-semibold text-white">NEW AISHE</p>
                  <p className="mt-1 text-xs text-slate-400">{selectedPackage.description ?? '—'}</p>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    {hasFreeTrial ? (
                      <div className="flex items-center justify-between">
                        <span>Free trial</span>
                        <span className="font-medium text-emerald-300">14 days</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span>Paid license</span>
                      <span className="font-medium text-slate-200">30 days</span>
                    </div>
                  </div>
                </div>

                {selectedPackage.isCustom && (
                  <div className="rounded-xl border border-[#333333]/70 bg-[#1e1e1e]/60 p-4 space-y-1 text-xs">
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Price Breakdown
                    </p>
                    <div className="flex justify-between text-slate-400">
                      <span>Base plan (includes required features)</span>
                      <span className="notranslate" translate="no">{formatCurrency(ORDER_BASE_PRICE, 'USD')}</span>
                    </div>
                    {(lotSizes[selectedPackage.id] ?? 0) > 0 && (
                      <div className="flex justify-between text-cyan-300">
                        <span>Lot size limit (<span className="notranslate" translate="no">{(lotSizes[selectedPackage.id] ?? 0).toFixed(1)}</span> lot)</span>
                        <span className="notranslate" translate="no">
                          +{formatCurrency(getLotPrice(lotSizes[selectedPackage.id] ?? 0), 'USD')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-[#333333]/70 bg-[#1e1e1e]/60 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        needsInvoice
                          ? 'border-cyan-400 bg-cyan-500/60 text-white'
                          : 'border-[#444444] bg-[#2a2a2a]/60 text-transparent'
                      }`}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="h-3 w-3"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 5.6-5.6 1.4 1.4-7 7z" />
                      </svg>
                    </span>
                    <input
                      type="checkbox"
                      checked={needsInvoice}
                      onChange={(e) => setNeedsInvoice(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-sm text-slate-200">I need an invoice</span>
                  </label>

                  {needsInvoice && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-[#3a3a3a]/50">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Invoice Details
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Fields are optional. You can choose corporate or individual.
                      </p>

                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#3a3a3a]/80 bg-[#1e1e1e]/50 px-3 py-2.5 text-sm has-[:checked]:border-cyan-500/60 has-[:checked]:bg-cyan-500/10">
                          <input
                            type="radio"
                            name="invoiceType"
                            checked={invoiceInfo.type === 'corporate'}
                            onChange={() => setInvoiceInfo((prev) => ({ ...prev, type: 'corporate' }))}
                            className="accent-cyan-500"
                          />
                          <span>Corporate</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#3a3a3a]/80 bg-[#1e1e1e]/50 px-3 py-2.5 text-sm has-[:checked]:border-cyan-500/60 has-[:checked]:bg-cyan-500/10">
                          <input
                            type="radio"
                            name="invoiceType"
                            checked={invoiceInfo.type === 'individual'}
                            onChange={() => setInvoiceInfo((prev) => ({ ...prev, type: 'individual' }))}
                            className="accent-cyan-500"
                          />
                          <span>Individual</span>
                        </label>
                      </div>

                      {invoiceInfo.type === 'corporate' ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={invoiceInfo.companyName}
                            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, companyName: e.target.value })}
                            placeholder="Company name"
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 min-h-[44px]"
                          />
                          <input
                            type="text"
                            value={invoiceInfo.taxNumber}
                            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxNumber: e.target.value })}
                            placeholder="Tax number"
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 min-h-[44px]"
                          />
                          <input
                            type="text"
                            value={invoiceInfo.taxOffice}
                            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxOffice: e.target.value })}
                            placeholder="Tax office"
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 min-h-[44px]"
                          />
                          <textarea
                            value={invoiceInfo.address}
                            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, address: e.target.value })}
                            placeholder="Billing address"
                            rows={3}
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 resize-none"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={invoiceInfo.fullName}
                            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, fullName: e.target.value })}
                            placeholder="Full name"
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 min-h-[44px]"
                          />
                          {!isMyAisheHost ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={invoiceInfo.nationalId}
                              onChange={(e) => setInvoiceInfo({ ...invoiceInfo, nationalId: e.target.value })}
                              placeholder="National ID"
                              className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 min-h-[44px]"
                            />
                          ) : null}
                          <textarea
                            value={invoiceInfo.address}
                            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, address: e.target.value })}
                            placeholder="Billing address"
                            rows={3}
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2.5 text-base text-white placeholder:text-slate-500 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {aisheMoneyBalance > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition ${
                          useAisheeMoney
                            ? 'border-amber-400 bg-amber-500/60 text-white'
                            : 'border-[#444444] bg-[#2a2a2a]/60 text-transparent'
                        }`}
                      >
                        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                          <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 5.6-5.6 1.4 1.4-7 7z" />
                        </svg>
                      </span>
                      <input
                        type="checkbox"
                        checked={useAisheeMoney}
                        onChange={(e) => setUseAisheeMoney(e.target.checked)}
                        className="sr-only"
                      />
                      <div>
                        <p className="text-sm font-semibold text-amber-200">Use AISHE Money</p>
                        <p className="text-xs text-amber-400/70">Balance: {aisheMoneyBalance} AISHE Money</p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="rounded-xl border border-[#333333]/70 bg-[#1e1e1e]/60 p-4 space-y-2">
                  {(discountAmount > 0 || aisheMoneyApplied > 0) ? (
                    <>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Package amount</span>
                      <span className="notranslate" translate="no">{formatCurrency(totalPrice, selectedPackage.currency)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-400">
                          <span>Discount ({discountPreview?.campaignName})</span>
                          <span className="notranslate" translate="no">-{formatCurrency(discountAmount, selectedPackage.currency)}</span>
                        </div>
                      )}
                      {aisheMoneyApplied > 0 && (
                        <div className="flex items-center justify-between text-sm text-amber-400">
                          <span>AISHE Money</span>
                          <span className="notranslate" translate="no">-{formatCurrency(aisheMoneyApplied, selectedPackage.currency)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-[#3a3a3a]/60 pt-2 text-sm font-semibold text-white">
                        <span>Total</span>
                        <span className="text-green-300 notranslate" translate="no">{formatCurrency(finalPrice, selectedPackage.currency)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-sm font-semibold text-white">
                      <span>Total amount</span>
                      <span className="notranslate" translate="no">{formatCurrency(totalPrice, selectedPackage.currency)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || isFallbackSelection}
                  onClick={handleOrder}
                  className="w-full rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 min-h-[44px]"
                >
                  {isSubmitting ? 'Creating...' : 'Super'}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-transparent text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(0,229,255,0.12),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(45,126,255,0.16),transparent_32%),radial-gradient(circle_at_52%_92%,rgba(98,177,255,0.1),transparent_36%)]" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-slate-300">Loading...</div>
        </div>
      </main>
    }>
      <OrderContent />
    </Suspense>
  );
}
