"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isUkSiteHostname } from "@/lib/is-uk-site";

type HeaderProps = {
  sectionHrefPrefix?: string;
  solidBackground?: boolean;
};

const SOURCE_LANGUAGE = "en";
const HEADER_LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "ar", label: "AR" },
  { code: "ru", label: "RU" },
] as const;

function readGoogTransLang(): string {
  if (typeof document === "undefined") return SOURCE_LANGUAGE;
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const googtrans = cookies.find((cookie) => cookie.startsWith("googtrans="));
  if (!googtrans) return SOURCE_LANGUAGE;
  const value = decodeURIComponent(googtrans.split("=")[1] ?? "");
  const parts = value.split("/");
  return parts[2] || SOURCE_LANGUAGE;
}

function setGoogTransCookies(lang: string) {
  if (typeof document === "undefined") return;
  const value = `/${SOURCE_LANGUAGE}/${lang}`;
  document.cookie = `googtrans=${value}; path=/; SameSite=Lax`;
  const host = window.location.hostname;
  const rootDomain = host.split(".").slice(-2).join(".");
  document.cookie = `googtrans=${value}; path=/; domain=.${rootDomain}; SameSite=Lax`;
}

function clearGoogTransCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const host = window.location.hostname;
  const rootDomain = host.split(".").slice(-2).join(".");
  document.cookie = `googtrans=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function triggerGoogleTranslate(lang: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  combo.value = lang;
  combo.dispatchEvent(new Event("change"));
  return true;
}

export function MarketingSiteHeader({ sectionHrefPrefix = "/", solidBackground = false }: HeaderProps) {
  const [isUk, setIsUk] = useState(false);
  const [selectedLang, setSelectedLang] = useState(SOURCE_LANGUAGE);

  useEffect(() => {
    setIsUk(isUkSiteHostname(window.location.hostname));
    setSelectedLang(readGoogTransLang());
  }, []);

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);

    if (lang === SOURCE_LANGUAGE) {
      clearGoogTransCookies();
      window.location.reload();
      return;
    }

    setGoogTransCookies(lang);
    if (triggerGoogleTranslate(lang)) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (triggerGoogleTranslate(lang)) {
        window.clearInterval(timer);
        return;
      }
      if (attempts >= 5) {
        window.clearInterval(timer);
        window.location.reload();
      }
    }, 300);
  };

  const navItems = useMemo(
    () => [
      { label: "Blog", href: "/blog" },
      { label: "Ecosystem", href: `${sectionHrefPrefix}#ecosystem` },
      { label: "Technology", href: `${sectionHrefPrefix}#technology` },
      { label: "Governance", href: `${sectionHrefPrefix}#governance` },
      { label: "Community", href: `${sectionHrefPrefix}#community` },
      { label: "News", href: `${sectionHrefPrefix}#news` },
    ],
    [sectionHrefPrefix],
  );

  const logoSrc = isUk ? "/brand/aisheuk.png" : "/brand/aishelogo.png";
  const barClass = "bg-[#202226]/95 border-b border-white/10";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 backdrop-blur-md ${barClass}`}>
      <div className="mx-auto flex h-[74px] max-w-[1500px] items-center gap-8 px-5 lg:px-10">
        <Link href="/" className="shrink-0">
          <Image
            src={logoSrc}
            alt="AISHE"
            width={300}
            height={70}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-8 font-sans lg:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-base font-medium text-slate-200 transition hover:text-white">
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-slate-200">
          <div className="relative h-9 w-[72px] overflow-hidden rounded-full border border-slate-600/80 bg-[#2a2c31]">
            <span aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-300">🌐</span>
            <select
              aria-label="Dil sec"
              value={selectedLang}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="h-full w-full appearance-none bg-transparent pl-7 pr-6 text-xs font-semibold text-slate-200 outline-none"
            >
              {HEADER_LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            aria-label="theme"
            className="relative h-9 w-16 rounded-full bg-[#7b7d83] p-1"
          >
            <span className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#b8bbc2] text-xs text-[#3b3e45]">🌙</span>
          </button>
          <Link
            href="/login"
            aria-label="Giris yap"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-500/70 text-slate-200 transition hover:border-slate-300 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.7-3.2 4.5-4.8 8-4.8s6.3 1.6 8 4.8" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
