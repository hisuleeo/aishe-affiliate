"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="bg-slate-950 text-white min-h-screen">
      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />
        
        {/* Header */}
        <header
          className={`fixed left-0 right-0 top-0 z-50 transition duration-300 ${
            isScrolled ? 'bg-slate-950/90 backdrop-blur border-b border-slate-800/70' : 'bg-transparent'
          }`}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
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
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <Link href="/" className="transition hover:text-white">Home</Link>
              <Link href="/about" className="text-white transition hover:text-indigo-400">About Us</Link>
              <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="rounded-full border border-indigo-500/60 bg-indigo-500/10 px-6 py-2 text-sm font-semibold text-indigo-200 transition hover:border-indigo-400"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative px-6 pt-32 pb-20">
          <div className="mx-auto max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                About Us
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
                Redefining how individuals interact with digital environments
              </p>
            </div>

            {/* Main Content */}
            <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-900/20 p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-slate-300 leading-relaxed mb-6">
                  At <span className="text-indigo-400 font-semibold">AISHE</span>, our vision is to redefine how individuals interact with digital environments by providing a powerful, autonomous AI system that can run locally on your own computer. We believe that advanced technology should empower you to automate tasks, support your workflows, and simplify processes without ever compromising your privacy or control.
                </p>

                <p className="text-slate-300 leading-relaxed mb-6">
                  That is why we built a <span className="text-white font-semibold">software AI client-system</span> where all settings for usage and for the data processed by AISHE are defined by you directly on your own device. Whether it is used to help structure and organize daily tasks or support the analysis of information, our ultimate goal is to make workflows more efficient and help you save time in both personal and professional contexts.
                </p>

                <p className="text-slate-300 leading-relaxed mb-6">
                  We are deeply committed to <span className="text-emerald-400 font-semibold">transparency and user sovereignty</span>; therefore, our platform offers adjustable usage, meaning you can restrict, pause, or completely stop the autonomous features at any time. We invite everyone to experience this technology risk-free, as you can try it for free, with no registration and no commitment.
                </p>

                <p className="text-slate-300 leading-relaxed">
                  By focusing entirely on functionality and task assistance rather than acting as a financial product or an investment offer, we ensure a secure environment where any commercial use is solely at the responsibility of the user.
                </p>
              </div>

              {/* Core Values */}
              <div className="mt-12 grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6 backdrop-blur-sm">
                  <div className="text-3xl mb-3">🔒</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
                  <p className="text-sm text-slate-400">All data stays on your device. You have complete control.</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-sm">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Autonomous Power</h3>
                  <p className="text-sm text-slate-400">AI that works for you, automating tasks and workflows.</p>
                </div>
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 backdrop-blur-sm">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="text-lg font-semibold text-white mb-2">User Control</h3>
                  <p className="text-sm text-slate-400">Adjust, pause, or stop features anytime you want.</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/50 transition hover:shadow-xl hover:shadow-indigo-500/60"
                >
                  Try AISHE for Free
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <p className="mt-4 text-sm text-slate-400">No registration required • No commitment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative border-t border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <Image
                  src="/brand/aishelogo.png"
                  alt="AISHE"
                  width={96}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
                <p className="text-sm text-slate-400">Autonomous AI Assistant</p>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="text-base font-semibold text-white">Company</p>
                <Link href="/about" className="block transition hover:text-white">About Us</Link>
                <Link href="/kvkk" className="block transition hover:text-white">Privacy Policy</Link>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="text-base font-semibold text-white">Product</p>
                <Link href="/dashboard" className="block transition hover:text-white">Dashboard</Link>
                <Link href="/order" className="block transition hover:text-white">Packages</Link>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="text-base font-semibold text-white">Contact</p>
                <a href="mailto:demo@aishe.local" className="block transition hover:text-white">demo@aishe.local</a>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-800/70 pt-8 text-center text-xs text-slate-500">
              <p>© 2026 AISHE. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
