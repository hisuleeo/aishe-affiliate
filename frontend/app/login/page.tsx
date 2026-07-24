"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiLogin } from '@/services/authService';
import { useAuth } from '@/components/auth/useAuth';
import { resolveApiBaseUrlForHostname } from '@/lib/api-base';
import { MarketingSiteHeader } from '@/components/layout/MarketingSiteHeader';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function buildGoogleAuthHref(searchParams: { get: (k: string) => string | null }): string {
  const base =
    typeof window !== 'undefined'
      ? resolveApiBaseUrlForHostname(window.location.hostname)
      : (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.aishe.pro');
  const ref =
    searchParams.get('ref') ||
    (typeof document !== 'undefined' ? getCookie('aishe_ref') : null);
  const params = new URLSearchParams();
  if (ref) {
    params.set('ref', ref);
  }
  if (typeof window !== 'undefined' && window.location.hostname.toLowerCase().endsWith('aishe.uk')) {
    params.set('fe', 'uk');
  }
  const q = params.toString() ? `?${params.toString()}` : '';
  return `${base}/auth/google${q}`;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      router.replace(nextPath || '/profile?tab=profile');
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-4 pb-10 pt-32 text-white sm:px-6 sm:pb-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_52%_92%,rgba(255,255,255,0.04),transparent_36%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/12 bg-[#2a2a2a]/94 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="space-y-3">
            <Image
              src="/brand/image.png"
              alt="AISHE"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Sign In</h1>
              <p className="mt-2 text-sm text-slate-300">Sign in to your AISHE account.</p>
            </div>
          </Link>
          <Link href="/" className="text-xs text-slate-300 hover:text-white">
            Home
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = buildGoogleAuthHref(searchParams);
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/14 bg-white/8 px-4 py-3 text-base font-semibold text-white transition hover:border-white/24 hover:bg-white/12 min-h-[44px]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1H12v2.98h5.37c-.23 1.45-1.67 4.26-5.37 4.26-3.24 0-5.89-2.68-5.89-5.99s2.65-5.99 5.89-5.99c1.84 0 3.08.79 3.78 1.47l2.58-2.48C16.71 3.64 14.63 2.5 12 2.5 6.95 2.5 2.85 6.62 2.85 11.85c0 5.24 4.1 9.35 9.15 9.35 5.29 0 8.8-3.78 8.8-9.11 0-.61-.07-1.07-.15-1.52Z"
            />
          </svg>
          Sign in with Google
        </button>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-white/12 bg-[#232323]/90 px-3 py-2.5 text-base min-h-[44px] outline-none transition focus:border-teal-400/40"
              placeholder="you@app.aishe.pro"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Password</label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-white/12 bg-[#232323]/90 px-3 py-2.5 text-base min-h-[44px] outline-none transition focus:border-teal-400/40"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span>Remember for 30 days</span>
            <button type="button" className="text-slate-300 hover:text-white">
              Forgot password
            </button>
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-teal-500/40 bg-teal-500 py-3 text-base font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60 min-h-[44px]"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-slate-300/85">
          <span>Don't have an account?</span>
          <Link href="/register" className="text-slate-300 hover:text-white">
            Sign up now
          </Link>
        </div>

      </div>
    </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <>
          <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />
          <div className="min-h-screen bg-transparent" />
        </>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
