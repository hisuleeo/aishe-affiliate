'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/useAuth';

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

type CustomFeature = {
  id: string;
  label: string;
  price: number;
};

const customFeatureOptions: CustomFeature[] = [
  { id: 'nps', label: 'NPS', price: 2.5 },
  { id: 'npse', label: 'NPSE', price: 2.5 },
  { id: 'recording', label: 'Recording', price: 4 },
  { id: 'recAnalyse', label: 'Rec.Analyse', price: 4 },
  { id: 'stateAnalyse', label: 'State Analyse', price: 5 },
  { id: 'aisp', label: 'AISP', price: 3 },
  { id: 'badList', label: 'Bad List', price: 2 },
  { id: 'weeklyEvents', label: 'Weekly Events', price: 4 },
  { id: 'waveInt', label: 'Wave int.', price: 3 },
];

const defaultSelected = ['recAnalyse', 'stateAnalyse', 'aisp', 'weeklyEvents'];

export default function PricingSection() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  const selectedFeatures = useMemo(() => {
    const set = new Set(selected);
    return customFeatureOptions.map((feature) => ({
      ...feature,
      enabled: set.has(feature.id),
    }));
  }, [selected]);

  const totalPrice = useMemo(() => {
    const base = 25;
    return selectedFeatures.reduce((sum, feature) => sum + (feature.enabled ? feature.price : 0), base);
  }, [selectedFeatures]);

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
                {formatCurrency(totalPrice, 'USD')}
              </p>
              <p className="text-xs text-slate-400">/ Aylık</p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-white">Paket İçerikleri</p>
              <ul className="space-y-2 text-sm text-slate-200">
                {selectedFeatures.map((feature) => (
                  <li key={feature.id} className="flex items-center gap-3">
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
                      <span>{feature.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 border-t border-slate-800/60 pt-4 text-center text-sm text-slate-300">
              Limit size: <span className="font-semibold text-white">0.10</span>
            </p>

            <button
              type="button"
              onClick={() => handleBuy({ custom: true, packageName: 'Custom' })}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 py-3 text-sm font-semibold text-white"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
