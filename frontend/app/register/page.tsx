"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { apiRegister } from '@/services/authService';
import { useAuth } from '@/components/auth/useAuth';

// Cookie helper functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aishe.ai';
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const displayUsername = username.trim().toLowerCase() || 'username';

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

    if (!licenseAccepted) {
      setError('You must accept the License Agreement to continue.');
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
      });
      login(response.user, response.token);
      router.replace('/dashboard');
    } catch {
      setError('Registration failed. Please check your information.');
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
              <h1 className="text-2xl font-semibold">Sign Up</h1>
              <p className="mt-2 text-sm text-slate-300">
                Create an AISHE account and access your dashboard.
              </p>
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
            <label className="text-xs text-slate-400">Full Name</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base min-h-[44px]"
              placeholder="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Username</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base min-h-[44px]"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            {fieldErrors.username ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.username}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              Your affiliate link will be:{' '}
              <span className="text-slate-200">{appUrl.replace(/\/$/, '')}/affiliate/{displayUsername}</span>
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base min-h-[44px]"
              placeholder="you@aishe.ai"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.email}</p>
            ) : null}
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
            {fieldErrors.password ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.password}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-slate-400">Referral Code (Optional)</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base min-h-[44px]"
              placeholder="Enter referral code if you have one"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">
              If you register with a referral code, the person who invited you will earn rewards.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
            <p>When you complete your registration:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Manage your affiliate links.</li>
              <li>Track referrals and earnings.</li>
              <li>Manage payments from the control panel.</li>
            </ul>
          </div>
          <div className="flex items-start gap-3">
            <input
              id="license"
              type="checkbox"
              checked={licenseAccepted}
              onChange={(e) => setLicenseAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 accent-indigo-500"
            />
            <label htmlFor="license" className="text-xs text-slate-400 leading-relaxed">
              I have read and accept the{' '}
              <a
                href="/docs/lisans-sozlesmesi.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                License Agreement
              </a>
              {' '}and{' '}
              <a
                href="/kvkk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                Privacy Policy
              </a>
              .
            </label>
          </div>
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-500 py-3 text-base font-semibold text-white disabled:opacity-60 min-h-[44px]"
          >
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span>Already have an account?</span>
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 sm:px-6 sm:py-12 text-white">
        <div className="text-slate-300">Loading...</div>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
