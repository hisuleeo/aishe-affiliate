'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { Package, PackageOption } from '@shared/types';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPackages } from '@/services/packageService';
import { createOrder } from '@/services/orderService';

const formatCurrency = (amount: string | number, currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value);
};

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const { data, isLoading: packagesLoading, isError } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
    enabled: isAuthenticated,
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({});
  const [customLimits, setCustomLimits] = useState<Record<string, number>>({});
  const [aisheId, setAisheId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isError) {
      showToast({
        title: 'Paketler yüklenemedi',
        description: 'Lütfen daha sonra tekrar deneyin.',
        variant: 'error',
      });
    }
  }, [isError, showToast]);

  const packages = useMemo(() => data ?? [], [data]);
  const customPackages = packages.filter((pkg) => pkg.isCustom);
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

  const visiblePackages = requestedPackage
    ? [requestedPackage]
    : hasRequestedPackage
      ? []
      : customPackages.length > 0
        ? customPackages
        : packages;
  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;

  useEffect(() => {
    if (packagesLoading || packages.length === 0) return;

    if (requestedPackage) {
      setSelectedPackageId(requestedPackage.id);
      
      // URL'den seçili özellikleri oku
      const selectedOptionsParam = searchParams.get('selectedOptions');
      if (selectedOptionsParam && requestedPackage.isCustom) {
        const optionsArray = selectedOptionsParam.split(',').filter(Boolean);
        setCustomSelections((prev) => ({
          ...prev,
          [requestedPackage.id]: optionsArray,
        }));
      }
    }
  }, [packages.length, packagesLoading, requestedPackage, searchParams]);

  const getCustomPrice = (pkg: Package, selected: string[], limit: number) => {
    // Base price: 25€
    const basePrice = 25;
    
    // Her checkbox: +10€
    const checkboxPrice = selected.length * 10;
    
    // Limit size fiyatı: Her 0.1 GB için 5€ (0.5 GB = 25€, 1.0 GB = 50€)
    const limitPrice = limit * 50;
    
    return basePrice + checkboxPrice + limitPrice;
  };

  const selectedOptions = useMemo(() => {
    if (!selectedPackage) return [];
    const selectedIds = customSelections[selectedPackage.id] ?? [];
    return (selectedPackage.customOptions ?? []).filter((opt) => selectedIds.includes(opt.id));
  }, [customSelections, selectedPackage]);

  const totalPrice = selectedPackage
    ? selectedPackage.isCustom
      ? getCustomPrice(
          selectedPackage, 
          customSelections[selectedPackage.id] ?? [], 
          customLimits[selectedPackage.id] ?? 0.5
        )
      : Number(selectedPackage.price)
    : 0;

  const handleOrder = async () => {
    if (!selectedPackage) {
      showToast({ title: 'Lütfen bir paket seçin', variant: 'error' });
      return;
    }

    if (!aisheId.trim()) {
      showToast({
        title: 'AISHE ID gerekli',
        description: 'Siparişe devam etmek için bilgisayar kimliğinizi girin.',
        variant: 'error',
      });
      return;
    }

    if (needsInvoice) {
      if (!invoiceInfo.companyName.trim() || !invoiceInfo.taxNumber.trim() || 
          !invoiceInfo.taxOffice.trim() || !invoiceInfo.address.trim()) {
        showToast({
          title: 'Fatura bilgileri eksik',
          description: 'Lütfen tüm fatura bilgilerini doldurun.',
          variant: 'error',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createOrder({ 
        packageId: selectedPackage.id,
        aisheId: aisheId.trim(),
        selectedOptions: customSelections[selectedPackage.id] || [],
        limitSize: selectedPackage.isCustom ? (customLimits[selectedPackage.id] ?? 0.5) : undefined,
        needsInvoice,
        invoiceInfo: needsInvoice ? invoiceInfo : undefined,
      });
      showToast({
        title: 'Sipariş oluşturuldu',
        description: 'Siparişiniz başarıyla alındı.',
        variant: 'success',
      });
      setSelectedPackageId('');
      setCustomSelections((prev) => ({ ...prev, [selectedPackage.id]: [] }));
      setAisheId('');
      setNeedsInvoice(false);
      setInvoiceInfo({
        companyName: '',
        taxNumber: '',
        taxOffice: '',
        address: '',
      });
    } catch {
      showToast({
        title: 'Sipariş oluşturulamadı',
        description: 'Lütfen tekrar deneyin.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || packagesLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-slate-300">Yükleniyor...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/aishelogo.png"
              alt="AISHE"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="hidden text-xs uppercase tracking-[0.3em] text-slate-500 md:inline">
              Sipariş Oluştur
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">
              Ana sayfa
            </Link>
            <Link href="/dashboard" className="transition hover:text-white">
              Panel
            </Link>
            <Link href="/profile" className="transition hover:text-white">
              Profilim
            </Link>
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white transition"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/70 bg-slate-900/95 backdrop-blur">
            <nav className="flex flex-col px-6 py-4 space-y-3">
              <Link 
                href="/" 
                className="text-sm text-slate-300 hover:text-white transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ana sayfa
              </Link>
              <Link 
                href="/dashboard" 
                className="text-sm text-slate-300 hover:text-white transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Panel
              </Link>
              <Link 
                href="/profile" 
                className="text-sm text-slate-300 hover:text-white transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profilim
              </Link>
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sipariş oluştur</p>
              <h1 className="mt-2 text-2xl font-semibold">Siparişini Tamamla</h1>
              <p className="mt-2 text-sm text-slate-300">
                Seçtiğiniz paketi onaylayın ve bilgilerinizi tamamlayın.
              </p>
            </div>
            <div className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-200">
              {hasRequestedPackage
                ? 'Seçili paket gösteriliyor'
                : customPackages.length > 0
                  ? 'Custom paketler listelendi'
                  : 'Tüm paketler listeleniyor'}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {visiblePackages.length === 0 ? (
              <EmptyState
                title={hasRequestedPackage ? 'Seçilen paket bulunamadı' : 'Paket bulunamadı'}
                description={
                  hasRequestedPackage
                    ? 'Ana sayfaya dönüp paketi yeniden seçebilirsiniz.'
                    : 'Aktif paket oluştuğunda burada görüntülenecek.'
                }
              />
            ) : (
              visiblePackages.map((pkg) => {
                const selected = selectedPackageId === pkg.id;
                const selections = customSelections[pkg.id] ?? [];
                const currentLimit = customLimits[pkg.id] ?? 0.5;
                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[32px] border p-6 text-slate-100 shadow-[0_20px_60px_-40px_rgba(99,102,241,0.85)] transition ${
                      selected
                        ? 'border-indigo-400/80 bg-gradient-to-br from-indigo-500/30 via-slate-950/70 to-slate-950'
                        : 'border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-500/10'
                    }`}
                  >
                    {hasRequestedPackage ? (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-[11px] text-indigo-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                        Seçili Paket
                      </div>
                    ) : null}
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{pkg.name}</p>
                      <p className="mt-2 text-3xl font-bold text-sky-200">
                        {formatCurrency(
                          pkg.isCustom ? getCustomPrice(pkg, selections, currentLimit) : pkg.price,
                          pkg.currency,
                        )}
                      </p>
                      <p className="text-xs text-slate-400">/ Aylık</p>
                    </div>

                    {pkg.isCustom && (pkg.customOptions?.length ?? 0) > 0 ? (
                      <div className="mt-6 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Paket İçerikleri
                        </p>
                        <div className="space-y-2">
                          {(pkg.customOptions ?? []).map((option) => {
                            const checked = selections.includes(option.id);
                            return (
                              <label key={option.id} className="flex items-center gap-3 text-sm text-slate-200">
                                <span
                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition ${
                                    checked
                                      ? 'border-indigo-400 bg-indigo-500/60 text-white'
                                      : 'border-slate-600 bg-slate-900/60 text-transparent'
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
                                  checked={checked}
                                  onChange={() => {
                                    setCustomSelections((prev) => {
                                      const current = prev[pkg.id] ?? [];
                                      const next = checked
                                        ? current.filter((id) => id !== option.id)
                                        : [...current, option.id];
                                      return { ...prev, [pkg.id]: next };
                                    });
                                  }}
                                  className="sr-only"
                                />
                                <span className="flex-1">{option.label}</span>
                                <span className="text-xs text-slate-400">
                                  +€10,00
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        <div className="mt-6 space-y-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Limit Size</p>
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setCustomLimits((prev) => ({
                                  ...prev,
                                  [pkg.id]: Math.max(0.5, Number((currentLimit - 0.1).toFixed(2))),
                                }))
                              }
                              className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-950/70 text-lg text-slate-200"
                            >
                              -
                            </button>
                            <div className="flex h-10 min-w-[90px] items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 text-sm">
                              {currentLimit.toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCustomLimits((prev) => ({
                                  ...prev,
                                  [pkg.id]: Number((currentLimit + 0.1).toFixed(2)),
                                }))
                              }
                              className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-950/70 text-lg text-slate-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-6 text-center text-sm font-semibold text-white">
                        {formatCurrency(pkg.price, pkg.currency)}
                      </p>
                    )}

                    {hasRequestedPackage ? (
                      <div className="mt-8 rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-center text-sm font-semibold text-indigo-100">
                        {selected ? 'Seçili Paket' : 'Paket seçiliyor...'}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`mt-8 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          selected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white'
                        }`}
                      >
                        {selected ? 'Seçildi' : 'Satın Al'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-[28px] border border-slate-800/70 bg-slate-950/40 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">AISHE ID</p>
                <h3 className="mt-2 text-lg font-semibold">Bilgisayar Kimliği</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Siparişin aktivasyonu için cihaz kimliğinizi paylaşmanız gerekir.
                </p>
              </div>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] text-indigo-200">
                Zorunlu Alan
              </span>
            </div>

            <input
              value={aisheId}
              onChange={(event) => setAisheId(event.target.value)}
              placeholder="ComputerIdPlaceholder"
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />

            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              <p className="font-semibold">Açıklama alanına bilgisayar ID&apos;nizi yazmanız zorunludur.</p>
              <p className="mt-2 text-amber-100/80">
                1) Kurulum sırasında oluşturulan ID&apos;yi Dosya Gezgini&apos;nden kopyalayın.
                2) Drive altındaki dosyayı açıp ID&apos;yi kopyalayın.
                3) Buraya manuel olarak yapıştırın.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold">Sipariş Özeti</h2>
            <p className="mt-2 text-xs text-slate-400">Paket ve ödeme adımlarını kontrol edin.</p>

            {!selectedPackage ? (
              <div className="mt-6">
                <EmptyState
                  title="Paket seçilmedi"
                  description="Soldan bir paket seçtiğinizde burada özetlenecek."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{selectedPackage.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{selectedPackage.description ?? '—'}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Süre</span>
                    <span>30 gün</span>
                  </div>
                </div>

                {selectedPackage.isCustom && selectedOptions.length > 0 ? (
                  <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Seçilen içerikler
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-200">
                      {selectedOptions.map((opt) => (
                        <li key={opt.id} className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          <span className="text-slate-400">
                            +€10,00
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        needsInvoice
                          ? 'border-indigo-400 bg-indigo-500/60 text-white'
                          : 'border-slate-600 bg-slate-900/60 text-transparent'
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
                    <span className="text-sm text-slate-200">Fatura İstiyorum</span>
                  </label>

                  {needsInvoice && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-slate-700/50">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Fatura Bilgileri
                      </p>
                      <input
                        type="text"
                        value={invoiceInfo.companyName}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, companyName: e.target.value })}
                        placeholder="Şirket/Firma Adı"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      <input
                        type="text"
                        value={invoiceInfo.taxNumber}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxNumber: e.target.value })}
                        placeholder="Vergi Numarası"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      <input
                        type="text"
                        value={invoiceInfo.taxOffice}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxOffice: e.target.value })}
                        placeholder="Vergi Dairesi"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      <textarea
                        value={invoiceInfo.address}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, address: e.target.value })}
                        placeholder="Fatura Adresi"
                        rows={3}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-white">
                    <span>Toplam</span>
                    <span>{formatCurrency(totalPrice, selectedPackage.currency)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Sipariş sonrası paketlerim bölümünden takip edebilirsiniz.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleOrder}
                  className="w-full rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? 'Sipariş oluşturuluyor...' : 'Siparişi Tamamla'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-slate-300">Yükleniyor...</div>
        </div>
      </main>
    }>
      <OrderContent />
    </Suspense>
  );
}
