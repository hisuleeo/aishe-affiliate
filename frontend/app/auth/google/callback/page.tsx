'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/useAuth';
import Image from 'next/image';
import { Suspense } from 'react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError('Google girişi başarısız oldu. Lütfen tekrar deneyin.');
      return;
    }

    try {
      // Token'ı decode et (JWT payload)
      const base64 = token.split('.')[1] ?? '';
      const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
      const json = window.atob(normalized);
      const payload = JSON.parse(json) as { sub: string; email: string; roles: string[] };

      const role = payload.roles?.includes('ADMIN')
        ? 'admin' as const
        : payload.roles?.includes('AFFILIATE')
          ? 'affiliate' as const
          : 'user' as const;

      // Önce localStorage'a kaydet
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.email,
        status: 'active' as const,
        role,
      };

      login(user, token);

      // Kısa gecikme ile yönlendir (state güncellemesinin tamamlanması için)
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    } catch {
      setError('Giriş işlemi sırasında bir hata oluştu.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl">
          <Image
            src="/brand/aishelogo.png"
            alt="AISHE"
            width={140}
            height={48}
            className="mx-auto h-10 w-auto object-contain"
          />
          <div className="mt-6 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40">
            <svg className="h-8 w-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-rose-300">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="mt-6 w-full rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/brand/aishelogo.png"
          alt="AISHE"
          width={140}
          height={48}
          className="h-10 w-auto object-contain"
        />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-indigo-500" />
        <p className="text-sm text-slate-400">Google ile giriş yapılıyor...</p>
      </div>
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
