"use client";

import Image from 'next/image';
import Link from 'next/link';
import PricingSection from '@/components/PricingSection';
import { useEffect, useState } from 'react';
import TranslateSelect from '@/components/TranslateSelect';
import { useAuth } from '@/components/auth/useAuth';

const FEATURES = [
  {
    title: 'AI Analysis',
    desc: 'Karmaşık bilgileri gelişmiş makine öğrenmesi algoritmalarıyla analiz edin.',
    image: '/feature/1.png',
  },
  {
    title: 'Automated Operations',
    desc: '7/24 çalışan otomasyon ile rutin iş akışlarını hızlandırın.',
    image: '/feature/2.png',
  },
  {
    title: 'Secure Infrastructure',
    desc: 'Güçlü güvenlik ve gizlilik kontrolleriyle verinizi koruyun.',
    image: '/feature/3.png',
  },
  {
    title: 'Controls & Governance',
    desc: 'Limitler, onaylar ve guardrail’lerle AISHE davranışını siz yönetin.',
    image: '/feature/4.png',
  },
  {
    title: 'Multi-Domain Support',
    desc: 'Farklı iş akışlarını tek platformdan yönetin ve ölçekleyin.',
    image: '/feature/5.png',
  },
  {
    title: 'Usage Insights',
    desc: 'Aktivite, log ve raporlarla kullanım görünürlüğü kazanın.',
    image: '/feature/6.png',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Sign Up & Choose Your Plan',
    desc: 'İhtiyacına göre paket seç, AISHE platformuna erişim kazan.',
  },
  {
    step: '02',
    title: 'AI Analyzes Inputs',
    desc: 'Belirlediğin ayarlarla AI veriyi işler ve analiz üretir.',
  },
  {
    step: '03',
    title: 'Receive Smart Outputs',
    desc: 'Bildirimler, özetler ve aksiyon önerilerini cihazına al.',
  },
  {
    step: '04',
    title: 'Apply & Adjust',
    desc: 'Çıktıları değerlendir, onayla ve kontrolü elinde tut.',
  },
];

const HIGHLIGHTS = [
  {
    title: 'AI Power',
    desc: '7/24 çalışan model ile süreçlerin için akıllı analiz üret.',
  },
  {
    title: 'High Performance',
    desc: 'Şeffaf sistem davranışı ve güvenilir çıktılarla ilerle.',
  },
  {
    title: 'Quick Actions',
    desc: 'Net aksiyon özetleriyle hızlı karar al ve uygula.',
  },
];

const FAQ = [
  {
    question: 'AISHE neleri otomatikleştirebilir?',
    answer: 'Rutin operasyonlar, analiz hazırlama, raporlama ve öneri üretimi gibi tekrar eden işleri hızlandırır.',
  },
  {
    question: 'Kontroller nasıl yönetiliyor?',
    answer: 'Limitler, onay akışları ve guardrail kuralları panelden yönetilir.',
  },
  {
    question: 'Veri güvenliği nasıl sağlanıyor?',
    answer: 'Yerel çalışma, şifreleme ve rol bazlı izinlerle veri kontrolü sizde kalır.',
  },
];

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="bg-slate-950 text-white">
  <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />
        <header
          className={`fixed left-0 right-0 top-0 z-50 transition duration-300 ${
            isScrolled ? 'bg-slate-950/90 backdrop-blur border-b border-slate-800/70' : 'bg-transparent'
          }`}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="relative h-12 w-auto">
                <Image
                  src="/brand/aishelogo.png"
                  alt="AISHE"
                  width={108}
                  height={48}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 text-slate-200 transition hover:border-slate-600 md:hidden"
              aria-label="Menüyü aç"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Özellikler</a>
            <a href="#workflow" className="transition hover:text-white">İş Akışı</a>
            <a href="#pricing" className="transition hover:text-white">Planlar</a>
            <a href="#faq" className="transition hover:text-white">SSS</a>
          </nav>
          <div className="hidden flex-wrap items-center gap-3 md:flex">
            <TranslateSelect />
            <div id="google_translate_element" className="sr-only" />
            {isMounted ? (
              isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Hesabım
                </Link>
              ) : null
            ) : (
              <span className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400">
                Hesabım
              </span>
            )}
            {isMounted && !isAuthenticated ? (
              <Link
                href="/register"
                className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Kayıt Ol
              </Link>
            ) : null}
          </div>
          {isMenuOpen ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 md:hidden">
              <div className="flex flex-col gap-3 text-sm text-slate-200">
                <a href="#features" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  Özellikler
                </a>
                <a href="#workflow" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  İş Akışı
                </a>
                <a href="#pricing" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  Planlar
                </a>
                <a href="#faq" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  SSS
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <TranslateSelect />
                <div id="google_translate_element" className="sr-only" />
                {isMounted ? (
                  isAuthenticated ? (
                    <Link
                      href="/dashboard"
                      className="rounded-full border border-slate-700 px-4 py-2 text-center text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Hesabım
                    </Link>
                  ) : null
                ) : (
                  <span className="rounded-full border border-slate-700 px-4 py-2 text-center text-xs font-semibold text-slate-400">
                    Hesabım
                  </span>
                )}
                {isMounted && !isAuthenticated ? (
                  <Link
                    href="/register"
                    className="rounded-full bg-indigo-500 px-4 py-2 text-center text-xs font-semibold text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kayıt Ol
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
          </div>
        </header>

        <section className="w-full">
          <div className="relative h-screen w-full overflow-hidden bg-slate-900/60">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
            <video
              className="relative z-10 h-screen w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src="/media/aishe.mp4" type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
            <div className="absolute inset-0 z-20 flex items-end bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent">
              <div className="w-full space-y-4 px-6 pb-10 md:px-10 hero-fade">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300">
                  AISHE
                </p>
                <h2 className="text-3xl font-semibold text-white md:text-5xl">
                  AI ile otomasyonun yeni standardı
                </h2>
                <p className="max-w-2xl text-sm text-slate-200 md:text-base">
                  Akıllı analiz, yerel çalışma ve güvenli kontrol katmanlarıyla ekibini güçlendir.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-slate-900"
                  >
                    Demo İste
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold text-white"
                  >
                    Canlı Gör
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid min-h-[65vh] max-w-6xl gap-10 px-6 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col items-start gap-8 hero-fade">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400">
              AISHE
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Autonomous AI Assistant
            </h1>
            <p className="text-sm text-slate-300 md:text-base">
              AISHE, operasyonlarını yapay zekâ ile hızlandırmak için güvenli ve ölçeklenebilir bir katman sunar.
            </p>
            <div className="grid gap-2 text-sm text-slate-300">
              {['Ölçeklenebilir AI altyapısı', 'Güvenli veri kontrolü', 'Anlık raporlama ve özetler'].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </div>
                ),
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-indigo-500 px-5 py-2 text-xs font-semibold text-white"
              >
                Hemen Başla
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold text-slate-200"
              >
                Demo Panel
              </Link>
            </div>
          </div>
          <div className="relative h-full">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
              <Image
                src="/feature/1.png"
                alt="AISHE Preview"
                width={520}
                height={520}
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-semibold reveal">Key Features</h2>
            <p className="mt-2 text-slate-300 reveal reveal-delay-1">AISHE ile kontrol ve hız aynı anda gelir.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`group relative flex min-h-[280px] overflow-hidden rounded-2xl border border-slate-800 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-[0_20px_60px_-40px_rgba(99,102,241,0.9)] reveal reveal-delay-${(index % 3) + 1}`}
                >
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={420}
                    height={320}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent transition duration-300 group-hover:from-slate-950/95" />
                  <div className="relative z-10 flex h-full w-full flex-col justify-end p-6">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-100 drop-shadow-md">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-semibold reveal">How it works</h2>
            <p className="mt-2 text-slate-300 reveal reveal-delay-1">Kurulumdan çıktıya kadar tüm akış kontrolünüzde.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.step}
                  className={`rounded-2xl border border-slate-800 bg-slate-950 p-6 reveal reveal-delay-${(index % 4) + 1}`}
                >
                  <p className="text-xs font-semibold text-indigo-400">{step.step}</p>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection />

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold reveal">Performance Highlights</h2>
          <p className="mt-2 text-slate-300 reveal reveal-delay-1">AISHE ile kontrol ve hız aynı anda gelir.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HIGHLIGHTS.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-2xl border border-slate-800 bg-slate-950 p-6 reveal reveal-delay-${(index % 3) + 1}`}
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative py-20">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300 reveal">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-semibold reveal">Sık Sorulan Sorular</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300 reveal reveal-delay-1">
                AISHE ile otomasyonun tüm detaylarını netleştirmek için en sık gelen soruları burada topladık.
              </p>
            </div>
            <button className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200">
              Canlı Destek
            </button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {FAQ.map((item, index) => (
              <details
                key={item.question}
                className={`group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-500/10 p-6 shadow-[0_0_0_1px_rgba(99,102,241,0.2)] transition hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.18)] reveal reveal-delay-${(index % 4) + 1}`}
              >
                <summary className="relative flex cursor-pointer list-none items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-200">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.5v.01M9.75 9.75a2.25 2.25 0 0 1 4.5 0c0 1.5-2.25 1.875-2.25 3.375V15" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12a6.75 6.75 0 1 1 13.5 0 6.75 6.75 0 0 1-13.5 0Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                    <p className="mt-1 text-xs text-indigo-200/70">Ayrıntıları görmek için tıkla</p>
                  </div>
                  <span className="mt-1 text-indigo-200 transition group-open:rotate-180">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-4 border-t border-slate-800/70 pt-4 text-sm text-slate-300">
                  {item.answer}
                  <div className="mt-4 flex items-center gap-2 text-xs text-indigo-200/70">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    AISHE Knowledge Base
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div className="space-y-4 reveal">
              <Image
                src="/brand/aishelogo.png"
                alt="AISHE"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
              />
              <p className="max-w-xs text-sm text-slate-400">
                Yapay zeka destekli otonom finans deneyimini bugünden keşfedin.
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>AISHE Teknoloji A.Ş.</p>
                <p>Tuna Mah. 1690 Sk. Saader Cebeci İş Hanı No:48</p>
                <p>İç Kapı No:102 Karşıyaka/İzmir</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-300 reveal reveal-delay-1">
              <p className="text-base font-semibold text-white">Hızlı Bağlantılar</p>
              <a href="#" className="block transition hover:text-white">Ana Sayfa</a>
              <a href="#faq" className="block transition hover:text-white">SSS</a>
              <a href="#" className="block transition hover:text-white">İletişim</a>
              <Link href="/kvkk" className="block transition hover:text-white">KVKK</Link>
            </div>
            <div className="space-y-3 text-sm text-slate-300 reveal reveal-delay-2">
              <p className="text-base font-semibold text-white">Destek</p>
              <a href="#faq" className="block transition hover:text-white">SSS</a>
              <a href="mailto:info@ainengroup.com" className="block transition hover:text-white">info@ainengroup.com</a>
              <a href="tel:+905323508035" className="block transition hover:text-white">+90 532 350 80 35</a>
            </div>
            <div className="space-y-3 text-sm text-slate-300 reveal reveal-delay-3">
              <p className="text-base font-semibold text-white">Sosyal Medya</p>
              <div className="flex items-center gap-4 text-slate-400">
                <a href="https://discord.com" aria-label="Discord" className="transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.51.07.07 0 0 0-.073.035c-.211.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.487 0-.164-.399-.406-.874-.617-1.249a.07.07 0 0 0-.073-.035 19.736 19.736 0 0 0-4.885 1.51.066.066 0 0 0-.03.027C.533 9.046-.32 13.58.099 18.057a.078.078 0 0 0 .03.054 19.9 19.9 0 0 0 5.993 3.03.07.07 0 0 0 .079-.027c.462-.63.873-1.295 1.226-1.995a.07.07 0 0 0-.04-.097 13.107 13.107 0 0 1-1.87-.9.07.07 0 0 1-.007-.117c.126-.095.252-.194.371-.294a.07.07 0 0 1 .073-.01c3.927 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .074.01c.12.1.245.2.372.294a.07.07 0 0 1-.006.117 12.3 12.3 0 0 1-1.87.9.07.07 0 0 0-.04.097c.36.698.77 1.363 1.225 1.995a.07.07 0 0 0 .079.027 19.9 19.9 0 0 0 6.003-3.03.078.078 0 0 0 .03-.054c.5-5.177-.838-9.673-3.549-13.66a.061.061 0 0 0-.03-.027ZM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.095 2.156 2.418 0 1.334-.955 2.419-2.156 2.419Zm7.975 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419Z" />
                  </svg>
                </a>
                <a href="https://x.com" aria-label="X" className="transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M17.53 2H21l-7.56 8.64L22 22h-6.9l-5.4-7.02L3.9 22H.5l8.1-9.26L2 2h7.1l4.86 6.32L17.53 2Zm-1.22 18h1.92L7.8 4H5.76l10.55 16Z" />
                  </svg>
                </a>
                <a href="https://instagram.com" aria-label="Instagram" className="transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm6-3.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/70 pt-6 text-center text-xs text-slate-500">
            © 2026 AISHE. Tüm hakları saklıdır.
            <span className="mx-3">•</span>
            <Link href="/kvkk" className="hover:text-indigo-400 transition">KVKK Aydınlatma Metni</Link>
            <span className="mt-2 block text-slate-400">
              Developed &amp; Powered by <a href="https://www.ainengroup.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:text-indigo-300 transition">AINEN Group Bilişim A.Ş.</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
    </main>
  );
}
