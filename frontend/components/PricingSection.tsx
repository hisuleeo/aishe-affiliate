'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/useAuth';

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

type CustomFeature = {
  id: string;
  label: string;
};

const customFeatureOptions: CustomFeature[] = [
  { id: 'lot', label: 'Lot' },
  { id: 'nps', label: 'NPS' },
  { id: 'npse', label: 'NPSE' },
  { id: 'recording', label: 'Recording' },
  { id: 'reca', label: 'RecA' },
  { id: 'statea', label: 'StateA' },
  { id: 'aisp', label: 'AISP' },
  { id: 'badl', label: 'BadL' },
  { id: 'wevents', label: 'W-Events' },
  { id: 'wave', label: 'Wave' },
];

const FEATURE_PRICE = 10; // Her checkbox +10€
const BASE_PRICE = 25;    // Base fiyat 25€
const LIMIT_PER_UNIT = 50; // Her 1.0 GB = 50€

const defaultSelected = ['reca', 'statea', 'aisp', 'wevents'];

export default function PricingSection() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [limitSize, setLimitSize] = useState(0.5);

  const selectedFeatures = useMemo(() => {
    const set = new Set(selected);
    return customFeatureOptions.map((feature) => ({
      ...feature,
      enabled: set.has(feature.id),
    }));
  }, [selected]);

  const totalPrice = useMemo(() => {
    const checkboxPrice = selected.length * FEATURE_PRICE;
    const limitPrice = limitSize * LIMIT_PER_UNIT;
    return BASE_PRICE + checkboxPrice + limitPrice;
  }, [selected, limitSize]);

  const buildOrderUrl = (options?: { packageName?: string; custom?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.packageName) params.set('packageName', options.packageName);
    if (options?.custom) {
      params.set('custom', 'true');
      // Seçili özellikleri URL parametresi olarak ekle
      if (selected.length > 0) {
        params.set('selectedOptions', selected.join(','));
      }
    }
    const query = params.toString();
    return query ? `/order?${query}` : '/order';
  };

  const handleBuy = (options?: { packageName?: string; custom?: boolean }) => {
    const orderUrl = buildOrderUrl(options);
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(orderUrl)}`);
      return;
    }
    router.push(orderUrl);
  };

  return (
    <section id="pricing" className="bg-slate-900/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold reveal text-center">Custom Plan</h2>
        <p className="mt-2 text-slate-300 reveal reveal-delay-1 text-center">Kendi paketini oluştur, ihtiyacına göre özelleştir.</p>

        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-md rounded-[32px] border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-500/10 p-6 text-slate-100 shadow-[0_20px_60px_-40px_rgba(99,102,241,0.6)]">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">Custom</h3>
              <p className="mt-2 text-3xl font-bold text-sky-200">
                {formatCurrency(totalPrice, 'EUR')}
              </p>
              <p className="text-xs text-slate-400">/ Aylık</p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-white">Paket İçerikleri</p>
              <ul className="space-y-2 text-sm text-slate-200">
                {selectedFeatures.map((feature) => (
                  <li key={feature.id}>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={() => {
                          setSelected((prev) =>
                            prev.includes(feature.id)
                              ? prev.filter((item) => item !== feature.id)
                              : [...prev, feature.id],
                          );
                        }}
                        className="h-4 w-4 accent-indigo-500"
                      />
                      <span className="flex-1">{feature.label}</span>
                      <span className="text-xs text-slate-400">+€10,00</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-slate-800/60 pt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 text-center mb-3">Limit Size</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setLimitSize((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))))}
                  className="h-9 w-9 rounded-xl border border-slate-700 bg-slate-950/70 text-lg text-slate-200 hover:bg-slate-800 transition"
                >
                  -
                </button>
                <div className="flex h-9 min-w-[80px] items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 text-sm font-semibold text-white">
                  {limitSize.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <button
                  type="button"
                  onClick={() => setLimitSize((prev) => Number((prev + 0.1).toFixed(2)))}
                  className="h-9 w-9 rounded-xl border border-slate-700 bg-slate-950/70 text-lg text-slate-200 hover:bg-slate-800 transition"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBuy({ custom: true, packageName: 'Custom' })}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 py-3 text-sm font-semibold text-white"
            >
              Satın Al
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
