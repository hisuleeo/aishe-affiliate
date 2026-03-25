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
      router.replace(nextPath || '/dashboard');
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="space-y-3">
            <Image
              src="/brand/aishelogo.png"
              alt="AISHE"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
            <div>
              <h1 className="text-2xl font-semibold">Sign In</h1>
              <p className="mt-2 text-sm text-slate-300">Sign in to your AISHE account.</p>
            </div>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-white">
            Home
          </Link>
        </div>
        <button
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.aishe.pro'}/auth/google`;
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base font-semibold text-white transition hover:border-slate-500 min-h-[44px]"
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
            <label className="text-xs text-slate-400">Email</label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base min-h-[44px]"
              placeholder="you@aishe.ai"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base min-h-[44px]"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Remember for 30 days</span>
            <button type="button" className="text-indigo-300 hover:text-indigo-200">
              Forgot password
            </button>
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-500 py-3 text-base font-semibold text-white disabled:opacity-60 min-h-[44px]"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span>Don't have an account?</span>
          <Link href="/register" className="text-indigo-300 hover:text-indigo-200">
            Sign up now
          </Link>
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
