"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRegister } from '@/services/authService';
import { useAuth } from '@/components/auth/useAuth';

export default function RegisterPage() {
  const router = useRouter();
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
  const displayUsername = username.trim().toLowerCase() || 'kullaniciadi';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    const normalizedUsername = username.trim().toLowerCase();
    const nextErrors: { username?: string; email?: string; password?: string } = {};
    if (!normalizedUsername) {
      nextErrors.username = 'Kullanıcı adı zorunlu.';
    } else if (!/^[a-z0-9_]+$/i.test(normalizedUsername)) {
      nextErrors.username = 'Sadece harf, rakam ve alt çizgi kullanabilirsin.';
    } else if (normalizedUsername.length < 3 || normalizedUsername.length > 24) {
      nextErrors.username = 'Kullanıcı adı 3-24 karakter olmalı.';
    }

    if (!email.trim()) {
      nextErrors.email = 'E-posta zorunlu.';
    }

    if (password.length < 8) {
      nextErrors.password = 'Şifre en az 8 karakter olmalı.';
    }

    if (!licenseAccepted) {
      setError('Devam etmek için Lisans Sözleşmesi\'ni kabul etmelisiniz.');
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
      setError('Kayıt başarısız. Bilgileri kontrol edin.');
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
              <h1 className="text-2xl font-semibold">Kayıt Ol</h1>
              <p className="mt-2 text-sm text-slate-300">
                AISHE hesabı oluştur ve paneline giriş yap.
              </p>
            </div>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-white">
            Ana sayfa
          </Link>
        </div>
        <button
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.aishe.pro'}/auth/google`;
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
        >
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
            <label className="text-xs text-slate-400">Ad Soyad</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Ad Soyad"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Kullanıcı adı</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="kullaniciadi"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            {fieldErrors.username ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.username}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              Affiliate linkin şu şekilde oluşur:{' '}
              <span className="text-slate-200">{appUrl.replace(/\/$/, '')}/affiliate/{displayUsername}</span>
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400">E-posta</label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="you@aishe.ai"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.email}</p>
            ) : null}
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
            {fieldErrors.password ? (
              <p className="mt-2 text-xs text-rose-400">{fieldErrors.password}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-slate-400">Referral Kodu (Opsiyonel)</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Referral kodu varsa girin"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">
              Referral kodu ile kayıt olursanız, sizi davet eden kişi kazanç elde eder.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
            <p>Kaydınızı tamamladığınızda:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Affiliate linklerini yönetirsiniz.</li>
              <li>Referralları ve gelirleri takip edersiniz.</li>
              <li>Ödemeleri kontrol panelinden yönetirsiniz.</li>
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
              <a
                href="/docs/lisans-sozlesmesi.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                Lisans Sözleşmesi
              </a>
              &apos;ni ve{' '}
              <a
                href="/kvkk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                KVKK Aydınlatma Metni
              </a>
              &apos;ni okudum, kabul ediyorum.
            </label>
          </div>
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span>Zaten hesabın var mı?</span>
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
            Giriş yap
          </Link>
        </div>
      </div>
    </main>
  );
}
