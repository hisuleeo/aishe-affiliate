"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiLogin } from '@/services/authService';
import { useAuth } from '@/components/auth/useAuth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState('demo@aishe.local');
  const [password, setPassword] = useState('Demo123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiLogin({ email, password });
      setAuth(response.user, response.token);
      const nextPath = searchParams.get('next');
      router.replace(nextPath || '/dashboard');
    } catch {
      setError('Giriş başarısız. Bilgileri kontrol edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Image
              src="/brand/aishelogo.png"
              alt="AISHE"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
            <div>
              <h1 className="text-2xl font-semibold">Giriş Yap</h1>
              <p className="mt-2 text-sm text-slate-300">AISHE hesabınla giriş yap.</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-white">
            Ana sayfa
          </Link>
        </div>
        <button className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1H12v2.98h5.37c-.23 1.45-1.67 4.26-5.37 4.26-3.24 0-5.89-2.68-5.89-5.99s2.65-5.99 5.89-5.99c1.84 0 3.08.79 3.78 1.47l2.58-2.48C16.71 3.64 14.63 2.5 12 2.5 6.95 2.5 2.85 6.62 2.85 11.85c0 5.24 4.1 9.35 9.15 9.35 5.29 0 8.8-3.78 8.8-9.11 0-.61-.07-1.07-.15-1.52Z"
            />
          </svg>
          Google ile giriş yap
        </button>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-slate-400">E-posta</label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="you@aishe.ai"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Şifre</label>
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>30 gün boyunca hatırla</span>
            <button type="button" className="text-indigo-300 hover:text-indigo-200">
              Şifremi unuttum
            </button>
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span>Hesabın yok mu?</span>
          <Link href="/register" className="text-indigo-300 hover:text-indigo-200">
            Hemen kayıt ol
          </Link>
        </div>
        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
          Demo giriş (seed): <br />
          demo@aishe.local / Demo123!
          <span className="mt-2 block text-slate-500">
            Admin: admin@aishe.local / ChangeMe123!
          </span>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  );
}
