"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { apiRegister } from '@/services/authService';
import { useAuth } from '@/components/auth/useAuth';
import { resolveApiBaseUrlForHostname } from '@/lib/api-base';
import { MarketingSiteHeader } from '@/components/layout/MarketingSiteHeader';

// Cookie helper functions
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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [eulaAccepted, setEulaAccepted] = useState(false);
  /** One checkbox records Distance sales + KVKK (API stores both as true) */
  const [mesafeliKvkkAccepted, setMesafeliKvkkAccepted] = useState(false);
  /** One tick = Referral + Affiliate + GAIC (all optional together) */
  const [refAffGaicAccepted, setRefAffGaicAccepted] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const displayUsername = username.trim().toLowerCase() || 'username';

  useEffect(() => {
    setCurrentOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  // Auto-fill referral code from URL or cookie
  useEffect(() => {
    // First check URL parameter
    const urlRef = searchParams.get('ref');
    if (urlRef) {
      setReferralCode(urlRef);
      return;
    }
    
    // Then check cookie
    const cookieRef = getCookie('aishe_ref');
    if (cookieRef) {
      setReferralCode(cookieRef);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    const normalizedUsername = username.trim().toLowerCase();
    const nextErrors: { username?: string; email?: string; password?: string } = {};
    if (!normalizedUsername) {
      nextErrors.username = 'Username is required.';
    } else if (!/^[a-z0-9_]+$/i.test(normalizedUsername)) {
      nextErrors.username = 'Only letters, numbers and underscores allowed.';
    } else if (normalizedUsername.length < 3 || normalizedUsername.length > 24) {
      nextErrors.username = 'Username must be 3-24 characters.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!eulaAccepted) {
      setError('You must accept the Terms of Use (EULA) to continue.');
      setIsSubmitting(false);
      return;
    }
    if (!mesafeliKvkkAccepted) {
      setError('You must accept the Distance Sales Agreement and KVKK & Privacy Policy to continue.');
      setIsSubmitting(false);
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiRegister({
        name: name.trim() || undefined,
        username: normalizedUsername,
        email,
        password,
        referralCode: referralCode.trim() || undefined,
        originDomain: typeof window !== 'undefined' ? window.location.origin : undefined,
        eulaAccepted: true,
        distanceSalesAccepted: true,
        kvkkAccepted: true,
        wantsAffiliateProgram: refAffGaicAccepted,
        wantsReferralProgram: refAffGaicAccepted,
        gaicAccepted: refAffGaicAccepted,
        gaicVersion: refAffGaicAccepted ? 'v2.2' : undefined,
      });
      login(response.user, response.token);
      router.replace('/profile?tab=profile');
    } catch {
      setError('Registration failed. Please check your information.');
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
              <h1 className="text-3xl font-semibold tracking-tight">Sign Up</h1>
              <p className="mt-2 text-sm text-slate-300">
                Create an AISHE account and access your dashboard.
              </p>
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
            <label className="text-xs text-slate-300">Full Name</label>
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-white/12 bg-[#232323]/90 px-3 py-2.5 text-base min-h-[44px] outline-none transition focus:border-teal-400/40"
              placeholder="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Username</label>
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-white/12 bg-[#232323]/90 px-3 py-2.5 text-base min-h-[44px] outline-none transition focus:border-teal-400/40"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            {fieldErrors.username ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.username}</p>
            ) : refAffGaicAccepted ? (
              <p className="mt-2 text-xs text-slate-500">
                Affiliate link:{' '}
                <span className="text-slate-200">
                  {currentOrigin || '…'}/ref/{displayUsername}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">3–24 characters, letters, numbers, and underscores only.</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-white/12 bg-[#232323]/90 px-3 py-2.5 text-base min-h-[44px] outline-none transition focus:border-teal-400/40"
              placeholder="you@app.aishe.pro"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.email}</p>
            ) : null}
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
            {fieldErrors.password ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.password}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-slate-300">Referral Code (Optional)</label>
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-white/12 bg-[#232323]/90 px-3 py-2.5 text-base min-h-[44px] outline-none transition focus:border-teal-400/40"
              placeholder="Enter referral code if you have one"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">
              If you register with a referral code, the person who invited you will earn rewards.
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Agreements — first two are required; Referral/Affiliate + GAIC is optional
          </p>

          {/* 1 — EULA */}
          <div className="flex items-start gap-3">
            <input
              id="eula"
              type="checkbox"
              checked={eulaAccepted}
              onChange={(e) => setEulaAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#444444] bg-[#282828] accent-neutral-500"
            />
            <label htmlFor="eula" className="text-xs text-slate-400 leading-relaxed">
              I have read and agree to the{' '}
              <a href="/kullanim-sartlari" target="_blank" rel="noopener noreferrer" className="text-neutral-400 underline hover:text-neutral-300">
                EULA / Terms of Use
              </a>
              .
            </label>
          </div>

          {/* 2 — Distance sales + KVKK (one checkbox, two links) */}
          <div className="flex items-start gap-3">
            <input
              id="mesafeli-kvkk"
              type="checkbox"
              checked={mesafeliKvkkAccepted}
              onChange={(e) => setMesafeliKvkkAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#444444] bg-[#282828] accent-neutral-500"
            />
            <label htmlFor="mesafeli-kvkk" className="text-xs text-slate-400 leading-relaxed">
              I have read and agree to the{' '}
              <a href="/eula" target="_blank" rel="noopener noreferrer" className="text-neutral-400 underline hover:text-neutral-300">
                Distance sales
              </a>
              {' '}and{' '}
              <a href="/kvkk" target="_blank" rel="noopener noreferrer" className="text-neutral-400 underline hover:text-neutral-300">
                KVKK &amp; privacy
              </a>
              .
            </label>
          </div>

          {/* 3 — Referral + Affiliate + GAIC (optional, single checkbox) */}
          <div className="flex items-start gap-3">
            <input
              id="ref-aff-gaic"
              type="checkbox"
              checked={refAffGaicAccepted}
              onChange={(e) => setRefAffGaicAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#444444] bg-[#282828] accent-neutral-500"
            />
            <label htmlFor="ref-aff-gaic" className="text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-300">(Optional)</span> I join the{' '}
              <span className="text-slate-200">Referral</span> and{' '}
              <span className="text-slate-200">Affiliate</span> programs and will comply with the{' '}
              <a href="/gaic" target="_blank" rel="noopener noreferrer" className="text-neutral-400 underline hover:text-neutral-300">
                GAIC (v2.2)
              </a>
              .
            </label>
          </div>

          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-teal-500/40 bg-teal-500 py-3 text-base font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60 min-h-[44px]"
          >
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-slate-300/85">
          <span>Already have an account?</span>
          <Link href="/login" className="text-slate-300 hover:text-white">
            Sign in
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <>
        <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />
        <main className="flex min-h-screen items-center justify-center bg-transparent px-4 pb-8 pt-16 sm:px-6 sm:pb-12 sm:pt-20 text-white">
          <div className="text-slate-300">Loading...</div>
        </main>
      </>
    }>
      <RegisterForm />
    </Suspense>
  );
}
