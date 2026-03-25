"use client";

import Image from 'next/image';
import Link from 'next/link';
import PricingSection from '@/components/PricingSection';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TranslateSelect from '@/components/TranslateSelect';
import { useAuth } from '@/components/auth/useAuth';

// Cookie helper
function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

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
    desc: 'Choose a plan based on your needs and gain access to the AISHE platform.',
  },
  {
    step: '02',
    title: 'AI Analyzes Inputs',
    desc: 'AI processes data and generates analysis with your specified settings.',
  },
  {
    step: '03',
    title: 'Receive Smart Outputs',
    desc: 'Receive notifications, summaries, and action recommendations to your device.',
  },
  {
    step: '04',
    title: 'Apply & Adjust',
    desc: 'Evaluate outputs, approve, and maintain control.',
  },
];

const CAPABILITIES = [
  {
    id: 'privacy',
    badge: 'Local & Private',
    title: 'Local Autonomy and\nPrivacy-First Infrastructure',
    color: 'cyan',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <rect x="14" y="38" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 18v-4M24 34v-4M18 24h-4M34 24h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
      </svg>
    ),
    items: [
      {
        title: 'Edge Computing Performance',
        desc: 'AISHE is an autonomous AI system designed to run locally on your own computer.',
      },
      {
        title: 'Zero Cloud Dependency',
        desc: 'It can be installed on your machine and used without a constant cloud connection, ensuring your data remains in your hands.',
      },
      {
        title: 'User-Defined Data Environment',
        desc: 'All settings for usage and the data processed by AISHE are defined exclusively by you on your own device.',
      },
    ],
  },
  {
    id: 'automation',
    badge: 'Full Control',
    title: 'Fully Configurable\nTask Automation',
    color: 'indigo',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 4v4M24 40v4M4 24h4M40 24h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M9.37 9.37l2.83 2.83M35.8 35.8l2.83 2.83M9.37 38.63l2.83-2.83M35.8 12.2l2.83-2.83" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
      </svg>
    ),
    items: [
      {
        title: 'Granular Permission Controls',
        desc: 'You define exactly which tasks the system is allowed to perform and which specific data sets it may process.',
      },
      {
        title: 'Dynamic Workflow Support',
        desc: 'AISHE offers various functions for automation and assistance with complex tasks to simplify your daily processes.',
      },
      {
        title: 'Real-Time Adjustments',
        desc: 'You can restrict, pause, or completely stop any autonomous features at any time to maintain full oversight.',
      },
    ],
  },
  {
    id: 'efficiency',
    badge: 'Smart & Fast',
    title: 'Workflow Efficiency and\nInformation Structure',
    color: 'violet',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 36L18 22l8 8 6-10 8 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 8v32h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="18" cy="22" r="2.5" fill="currentColor" />
        <circle cx="26" cy="30" r="2.5" fill="currentColor" />
        <circle cx="32" cy="20" r="2.5" fill="currentColor" />
        <circle cx="40" cy="36" r="2.5" fill="currentColor" />
      </svg>
    ),
    items: [
      {
        title: 'Smart Information Analysis',
        desc: 'The system can support the analysis of large volumes of information to help structure and organize your digital workspace.',
      },
      {
        title: 'Time-Saving Automations',
        desc: 'AISHE is built to make workflows more efficient, allowing you to automate repetitive tasks and focus on higher-level activities.',
      },
      {
        title: 'Business Process Integration',
        desc: 'For professional environments, AISHE can be used in business processes to support organizational tasks and information management.',
      },
    ],
  },
  {
    id: 'access',
    badge: 'No Risk',
    title: 'Transparent and\nRisk-Free Access',
    color: 'emerald',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6L10 12v12c0 9.94 6.18 18.48 14 20 7.82-1.52 14-10.06 14-20V12L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    items: [
      {
        title: 'Non-Binding Evaluation',
        desc: 'You can test the software in a free, non-binding version to explore its functional benefits firsthand.',
      },
      {
        title: 'No Barrier to Entry',
        desc: 'Experience the system with no registration and no long-term commitment required.',
      },
      {
        title: 'Functional Focus',
        desc: 'The software focuses entirely on providing high-quality assistance and task simplification rather than promising specific success or gains.',
      },
    ],
  },
];

const HIGHLIGHTS = [
  {
    title: 'AI Power',
    desc: 'Generate smart analysis for your processes with 24/7 working models.',
  },
  {
    title: 'High Performance',
    desc: 'Progress with transparent system behavior and reliable outputs.',
  },
  {
    title: 'Quick Actions',
    desc: 'Make quick decisions and apply with clear action summaries.',
  },
];

const FAQ = [
  // General Information & Basics
  {
    question: 'What is AISHE?',
    answer: 'AISHE is an autonomous AI client-system designed to support your workflows by automating repetitive tasks and assisting with information organization. It functions as a digital assistant that helps simplify complex processes on your behalf.',
  },
  {
    question: 'How does AISHE work?',
    answer: 'AISHE operates as a local software system on your own computer. It processes the data you define and executes tasks based on the specific settings you configure directly on your device.',
  },
  {
    question: 'Is AISHE a financial tool?',
    answer: 'No. AISHE is strictly a software tool for task automation and productivity. It is not a financial product, does not offer investment advice, and is not designed to generate financial returns.',
  },
  
  // Privacy & Technical Setup
  {
    question: 'Does AISHE require an internet connection?',
    answer: 'AISHE can be installed locally on your machine and is capable of performing tasks without a constant cloud connection, ensuring your data remains under your control.',
  },
  {
    question: 'Who controls my data?',
    answer: 'You do. All settings for data processing and usage are defined by you on your own hardware. AISHE follows the boundaries and permissions you set within the application.',
  },
  {
    question: 'Can I stop the autonomous features?',
    answer: 'Yes. You have full control over the system\'s autonomy. You can adjust, pause, or completely disable any automated function at any time through your local settings.',
  },
  
  // Usage & Trial
  {
    question: 'Can I try AISHE for free?',
    answer: 'Yes, you can test the software through a free, non-binding version. There is no registration or long-term commitment required to start your trial.',
  },
  {
    question: 'How can AISHE help my daily routine?',
    answer: 'The system is designed to make workflows more efficient by supporting the analysis of information and helping to structure daily tasks. It focuses on saving you time through smart automation.',
  },
  {
    question: 'What are my responsibilities as a user?',
    answer: 'While AISHE provides the tools for automation, any commercial or personal use of the software is solely the responsibility of the user.',
  },
  
  // Customization & Autonomy
  {
    question: 'How much autonomy does AISHE have?',
    answer: 'The level of autonomy is entirely determined by you; you define which specific tasks the system is allowed to perform and which data it is permitted to process on your hardware.',
  },
  {
    question: 'Can I modify the automation settings later?',
    answer: 'Absolutely. AISHE offers adjustable usage, meaning you can restrict, pause, or completely stop any autonomous features at any moment.',
  },
  {
    question: 'Does AISHE make decisions on its own?',
    answer: 'The system operates within the boundaries you set. It is designed to assist and automate based on your predefined configurations, ensuring you remain the ultimate decision-maker.',
  },
  
  // Installation & Compatibility
  {
    question: 'Do I need a powerful server to run AISHE?',
    answer: 'AISHE is designed to run locally on your own computer, allowing you to utilize AI capabilities without relying on external cloud infrastructure.',
  },
  {
    question: 'Is there a long-term commitment for the trial?',
    answer: 'No. You can try AISHE for free with no registration and no commitment required, allowing for a completely non-binding evaluation of the software.',
  },
  {
    question: 'What happens if I want to uninstall the system?',
    answer: 'Since AISHE is a client-side software installed on your own machine, you have full control over the installation and can remove it at any time.',
  },
  
  // Professional Use & Responsibility
  {
    question: 'Can I use AISHE for my business tasks?',
    answer: 'Yes, AISHE can be used in business processes to support the analysis of information and help structure or organize complex tasks.',
  },
  {
    question: 'Does AISHE guarantee specific business results?',
    answer: 'AISHE is a tool for task automation and assistance; it does not guarantee success or specific outcomes, as any commercial use is solely the responsibility of the user.',
  },
  {
    question: 'Is AISHE a financial investment platform?',
    answer: 'No. AISHE is not a financial product or an investment offer. It focuses strictly on functional support, such as simplifying processes and saving time.',
  },
  
  // Affiliate & Referral Program FAQ
  {
    question: 'Does AISHE have a referral or affiliate program?',
    answer: 'Yes, AISHE offers a program for users who wish to support the growth of the ecosystem by introducing the software to others.',
  },
  {
    question: 'Is the affiliate program a financial investment?',
    answer: 'No, the program is not a financial product, an investment offer, or a recommendation to invest. It is strictly related to the promotion of AISHE as a task automation software.',
  },
  {
    question: 'How does the AISHE affiliate system work?',
    answer: 'The program is designed to support our workflows and simplify the process of sharing the software with new users. It focuses on the functional expansion of the AI client-system.',
  },
  {
    question: 'What are my responsibilities as an AISHE affiliate?',
    answer: 'Any commercial or promotional use of the AISHE brand is solely at the responsibility of the user. Affiliates must focus on the software\'s ability to automate tasks and make workflows more efficient.',
  },
  {
    question: 'What should I focus on when introducing AISHE to others?',
    answer: 'You should focus on the software\'s core features, such as local installation, configurable autonomy, and the ability to simplify complex processes.',
  },
];

// Component to handle referral code
function ReferralHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams?.get('ref');
    if (refCode) {
      setCookie('aishe_ref', refCode, 30); // 30 gün geçerli
    }
  }, [searchParams]);

  return null;
}
// FAQ Accordion Component
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-12 sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300 reveal">
              FAQ
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold reveal">Frequently Asked Questions</h2>
            <p className="mt-3 max-w-xl text-sm text-slate-300 reveal reveal-delay-1">
              We've compiled the most frequently asked questions here to clarify all the details of automation with AISHE.
            </p>
          </div>
          <button className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-200 min-h-[40px]">
            Live Support
          </button>
        </div>
        <div className="mt-10 space-y-4">
          {FAQ.map((item, index) => (
            <div
              key={item.question}
              className={`group relative overflow-hidden rounded-3xl border ${
                openIndex === index 
                  ? 'border-indigo-500/60 shadow-[0_0_40px_rgba(99,102,241,0.18)]' 
                  : 'border-slate-800/70'
              } bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-500/10 transition-all duration-300 reveal reveal-delay-${(index % 4) + 1}`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="relative flex w-full cursor-pointer items-start gap-3 sm:gap-4 p-4 sm:p-6 text-left"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.5v.01M9.75 9.75a2.25 2.25 0 0 1 4.5 0c0 1.5-2.25 1.875-2.25 3.375V15" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12a6.75 6.75 0 1 1 13.5 0 6.75 6.75 0 0 1-13.5 0Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white">{item.question}</h3>
                  <p className="mt-1 text-xs text-indigo-200/70">Click to see details</p>
                </div>
                <span className={`mt-1 text-indigo-200 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="border-t border-slate-800/70 px-6 pb-6 pt-4 text-sm text-slate-300">
                  {item.answer}
                  <div className="mt-4 flex items-center gap-2 text-xs text-indigo-200/70">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    AISHE Knowledge Base
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
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
      <Suspense fallback={null}>
        <ReferralHandler />
      </Suspense>
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
              aria-label="Open menu"
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
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#capabilities" className="transition hover:text-white">Capabilities</a>
            <a href="#workflow" className="transition hover:text-white">Workflow</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
            <Link href="/about" className="transition hover:text-white">About Us</Link>
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
                  My Account
                </Link>
              ) : null
            ) : (
              <span className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400">
                My Account
              </span>
            )}
            {isMounted && !isAuthenticated ? (
              <Link
                href="/register"
                className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Sign Up
              </Link>
            ) : null}
          </div>
          {isMenuOpen ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 md:hidden">
              <div className="flex flex-col gap-3 text-sm text-slate-200">
                <a href="#features" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  Features
                </a>
                <a href="#capabilities" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  Capabilities
                </a>
                <a href="#workflow" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  Workflow
                </a>
                <a href="#pricing" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  Pricing
                </a>
                <a href="#faq" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  FAQ
                </a>
                <Link href="/about" className="transition hover:text-white" onClick={() => setIsMenuOpen(false)}>
                  About Us
                </Link>
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
                      My Account
                    </Link>
                  ) : null
                ) : (
                  <span className="rounded-full border border-slate-700 px-4 py-2 text-center text-xs font-semibold text-slate-400">
                    My Account
                  </span>
                )}
                {isMounted && !isAuthenticated ? (
                  <Link
                    href="/register"
                    className="rounded-full bg-indigo-500 px-4 py-2 text-center text-xs font-semibold text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
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
              <source src="/media/new.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 z-20 flex items-end bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent">
              <div className="w-full space-y-4 px-4 pb-8 sm:px-6 sm:pb-10 md:px-10 hero-fade">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300">
                  AISHE
                </p>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl md:text-5xl">
                  The new standard of AI automation
                </h2>
                <p className="max-w-2xl text-sm text-slate-200 md:text-base">
                  Empower your team with smart analysis, local operation, and secure control layers.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 min-h-[40px] inline-flex items-center"
                  >
                    Request Demo
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-white/40 px-5 py-2.5 text-xs font-semibold text-white min-h-[40px] inline-flex items-center"
                  >
                    View Live
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid min-h-[65vh] max-w-6xl gap-8 sm:gap-10 px-4 sm:px-6 pb-16 sm:pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col items-start gap-6 sm:gap-8 hero-fade">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400">
              AISHE
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-6xl">
              Autonomous AI Assistant
            </h1>
            <p className="text-sm text-slate-300 md:text-base">
              AISHE offers a secure and scalable layer to accelerate your operations with artificial intelligence.
            </p>
            <div className="grid gap-2 text-sm text-slate-300">
              {['Scalable AI infrastructure', 'Secure data control', 'Real-time reporting and summaries'].map(
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
                className="rounded-full bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white min-h-[40px] inline-flex items-center"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-200 min-h-[40px] inline-flex items-center"
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

        <section id="features" className="py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-semibold reveal">Key Features</h2>
            <p className="mt-2 text-slate-300 reveal reveal-delay-1">Control and speed come together with AISHE.</p>
            <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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

        {/* ── Detailed Features & Capabilities ── */}
        <section id="capabilities" className="relative py-16 sm:py-28 overflow-hidden">
          {/* Background glows */}
          <div className="pointer-events-none absolute left-0 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 bottom-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            {/* Section header */}
            <div className="mx-auto max-w-2xl text-center reveal">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300">Capabilities</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
                Detailed Features &amp;<br />
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  Capabilities of AISHE
                </span>
              </h2>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                A comprehensive overview of everything AISHE brings to your workflow — from privacy-first infrastructure to transparent, risk-free access.
              </p>
            </div>

            {/* Capability Cards */}
            <div className="mt-16 space-y-8">
              {CAPABILITIES.map((cap, capIndex) => {
                const colorMap: Record<string, { border: string; bg: string; icon: string; badge: string; dot: string; glow: string }> = {
                  cyan:    { border: 'border-cyan-500/25',    bg: 'from-cyan-500/8 to-transparent',    icon: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',    dot: 'bg-cyan-400',    glow: 'shadow-cyan-500/20' },
                  indigo:  { border: 'border-indigo-500/25',  bg: 'from-indigo-500/8 to-transparent',  icon: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',  badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',  dot: 'bg-indigo-400',  glow: 'shadow-indigo-500/20' },
                  violet:  { border: 'border-violet-500/25',  bg: 'from-violet-500/8 to-transparent',  icon: 'text-violet-400 bg-violet-500/10 border-violet-500/30',  badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',  dot: 'bg-violet-400',  glow: 'shadow-violet-500/20' },
                  emerald: { border: 'border-emerald-500/25', bg: 'from-emerald-500/8 to-transparent', icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
                };
                const c = colorMap[cap.color];
                const isEven = capIndex % 2 === 0;

                return (
                  <div
                    key={cap.id}
                    className={`group relative overflow-hidden rounded-3xl border ${c.border} bg-gradient-to-br ${c.bg} bg-slate-950/60 p-6 sm:p-10 transition-all duration-500 hover:shadow-2xl ${c.glow} reveal reveal-delay-${(capIndex % 3) + 1}`}
                  >
                    {/* Subtle background grid */}
                    <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    <div className={`flex flex-col gap-8 lg:gap-12 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>

                      {/* Left / Right: Icon + Title */}
                      <div className="flex flex-col justify-center gap-5 lg:w-72 xl:w-80 flex-shrink-0">
                        {/* Icon */}
                        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border ${c.icon} p-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                          {cap.icon}
                        </div>
                        {/* Badge */}
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border ${c.badge} px-3 py-1 text-xs font-semibold`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                          {cap.badge}
                        </span>
                        {/* Title */}
                        <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-white whitespace-pre-line">
                          {cap.title}
                        </h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">
                          {cap.items.length} core capabilities
                        </p>
                      </div>

                      {/* Items grid */}
                      <div className="grid gap-4 sm:grid-cols-3 flex-1 content-center">
                        {cap.items.map((item, itemIndex) => (
                          <div
                            key={item.title}
                            className="relative rounded-2xl border border-slate-800/60 bg-slate-950/50 p-5 transition-all duration-300 hover:border-slate-700 hover:-translate-y-0.5"
                          >
                            {/* Number */}
                            <div className={`mb-3 flex h-7 w-7 items-center justify-center rounded-lg border ${c.badge} text-xs font-bold`}>
                              {String(itemIndex + 1).padStart(2, '0')}
                            </div>
                            <h4 className="mb-2 text-sm font-semibold text-white leading-snug">{item.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Important Disclaimer */}
            <div className="mt-12 reveal reveal-delay-3">
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-300 uppercase tracking-wider">Important Disclaimer</p>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      AISHE is a <span className="text-slate-200 font-medium">software AI client-system</span> for task automation and assistance. It is <span className="text-slate-200 font-medium">not a financial product</span>, not an investment offer, and not a recommendation to invest. Any commercial or personal use is solely at the responsibility of the user. We strictly avoid any wording suggesting &ldquo;passive income,&rdquo; &ldquo;automatic profits,&rdquo; or &ldquo;guaranteed success.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-semibold reveal">How it works</h2>
            <p className="mt-2 text-slate-300 reveal reveal-delay-1">The entire flow from setup to output is under your control.</p>
            <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
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

      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-semibold reveal">Performance Highlights</h2>
          <p className="mt-2 text-slate-300 reveal reveal-delay-1">Control and speed come together with AISHE.</p>
          <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
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

      <FAQSection />

      <footer className="border-t border-slate-800 bg-slate-950 py-10 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:gap-12 px-4 sm:px-6">
          <div className="grid gap-8 sm:gap-10 grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div className="space-y-4 reveal">
              <Image
                src="/brand/aishelogo.png"
                alt="AISHE"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
              />
              <p className="max-w-xs text-sm text-slate-400">
                Discover the AI-powered autonomous finance experience today.
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>AISHE Technology Inc.</p>
                <p>Tuna Mah. 1690 Sk. Saader Cebeci Business Center No:48</p>
                <p>Suite No:102 Karşıyaka/Izmir</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-300 reveal reveal-delay-1">
              <p className="text-base font-semibold text-white">Quick Links</p>
              <a href="#" className="block transition hover:text-white">Home</a>
              <a href="#faq" className="block transition hover:text-white">FAQ</a>
              <a href="#" className="block transition hover:text-white">Contact</a>
              <Link href="/kvkk" className="block transition hover:text-white">KVKK</Link>
            </div>
            <div className="space-y-3 text-sm text-slate-300 reveal reveal-delay-2">
              <p className="text-base font-semibold text-white">Support</p>
              <a href="#faq" className="block transition hover:text-white">FAQ</a>
              <a href="mailto:info@ainengroup.com" className="block transition hover:text-white">info@ainengroup.com</a>
              <a href="tel:+905323508035" className="block transition hover:text-white">+90 532 350 80 35</a>
            </div>
            <div className="space-y-3 text-sm text-slate-300 reveal reveal-delay-3">
              <p className="text-base font-semibold text-white">Social Media</p>
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
            © 2026 AISHE. All rights reserved.
            <span className="mx-3">•</span>
            <Link href="/kvkk" className="hover:text-indigo-400 transition">Privacy Policy</Link>
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
