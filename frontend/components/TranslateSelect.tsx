"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { AISHE_GOOGLANG_EVENT, getGoogTransLang } from '@/lib/goog-trans-lang';

type LanguageOption = {
  code: string;
  label: string;
  short: string;
  flag: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
  { code: 'de', label: 'Deutsch', short: 'DE', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'es', label: 'Español', short: 'ES', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', short: 'IT', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', short: 'PT', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', short: 'AR', flag: '🇸🇦' },
  { code: 'zh-CN', label: '中文 (简体)', short: 'ZH', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', short: 'JA', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', short: 'KO', flag: '🇰🇷' },
  { code: 'hi', label: 'हिन्दी', short: 'HI', flag: '🇮🇳' },
];

const SOURCE_LANGUAGE = 'en';

function setGoogTransCookies(lang: string) {
  if (typeof document === 'undefined') return;
  const val = `/${SOURCE_LANGUAGE}/${lang}`;
      // Set translation cookie for apex domain and all paths
  document.cookie = `googtrans=${val}; path=/; SameSite=Lax`;
  // Mirror cookie on parent domain for subdomains
  const host = window.location.hostname;
  const rootDomain = host.split('.').slice(-2).join('.');
  document.cookie = `googtrans=${val}; path=/; domain=.${rootDomain}; SameSite=Lax`;
}

function clearGoogTransCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const host = window.location.hostname;
  const rootDomain = host.split('.').slice(-2).join('.');
  document.cookie = `googtrans=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function triggerGoogleTranslate(lang: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (!combo) return false;
  combo.value = lang;
  combo.dispatchEvent(new Event('change'));
  return true;
}

export default function TranslateSelect() {
  return <TranslateSelectInner compact={false} />;
}

export function CompactTranslateSelect() {
  return <TranslateSelectInner compact={true} />;
}

function TranslateSelectInner({ compact }: { compact: boolean }) {
  const [selected, setSelected] = useState(SOURCE_LANGUAGE);
  const isInitialized = useRef(false);

  // Read language from cookie on mount
  useEffect(() => {
    const lang = getGoogTransLang();
    setSelected(lang);
    isInitialized.current = true;
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = event.target.value;
    setSelected(lang);
    window.dispatchEvent(new CustomEvent(AISHE_GOOGLANG_EVENT, { detail: lang }));

    // Switching back to English: clear cookies and reload clean
    if (lang === SOURCE_LANGUAGE) {
      clearGoogTransCookies();
      // Hide Google Translate banner frame
      const frame = document.querySelector('.goog-te-banner-frame');
      if (frame) (frame as HTMLElement).style.display = 'none';
      // Full reload for a clean English document
      window.location.reload();
      return;
    }

    // Persist language choice
    setGoogTransCookies(lang);

    // Try to drive the injected Google Translate <select>
    if (triggerGoogleTranslate(lang)) return;

    // Widget may load late — retry, then reload once cookie is set
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      if (triggerGoogleTranslate(lang)) {
        window.clearInterval(interval);
        return;
      }
      if (attempts >= 5) {
        window.clearInterval(interval);
        // Cookie is set; hard reload lets GT pick it up
        window.location.reload();
      }
    }, 300);
  }, []);

  return (
    <div className={compact ? 'translate-custom translate-custom--compact' : 'translate-custom'}>
      <label className="translate-custom__label sr-only" htmlFor="translate-select">
        Language
      </label>
      <div className="translate-custom__field">
        {compact ? (
          <span className="translate-custom__icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a15 15 0 0 1 0 18" />
              <path d="M12 3a15 15 0 0 0 0 18" />
            </svg>
          </span>
        ) : null}
        <select
          id="translate-select"
          value={selected}
          onChange={handleChange}
          className={compact ? 'translate-custom__select translate-custom__select--compact' : 'translate-custom__select'}
          aria-label="Language"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.flag} {option.short}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
