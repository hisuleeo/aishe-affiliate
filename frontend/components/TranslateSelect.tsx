"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type LanguageOption = {
  code: string;
  label: string;
  short: string;
  flag: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
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

const SOURCE_LANGUAGE = 'tr';

function getGoogTransLang(): string {
  if (typeof document === 'undefined') return SOURCE_LANGUAGE;
  const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return match?.[1] || SOURCE_LANGUAGE;
}

function setGoogTransCookies(lang: string) {
  if (typeof document === 'undefined') return;
  const val = `/${SOURCE_LANGUAGE}/${lang}`;
  // Ana domain ve tüm path'ler için cookie set et
  document.cookie = `googtrans=${val}; path=/; SameSite=Lax`;
  // Alt domain cookie'sini de set et
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
  const [selected, setSelected] = useState(SOURCE_LANGUAGE);
  const isInitialized = useRef(false);

  // Mount'ta cookie'den oku
  useEffect(() => {
    const lang = getGoogTransLang();
    setSelected(lang);
    isInitialized.current = true;
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = event.target.value;
    setSelected(lang);

    // Türkçe'ye dönüyorsa cookie'yi temizle
    if (lang === SOURCE_LANGUAGE) {
      clearGoogTransCookies();
      // Google Translate frame'ini kaldır
      const frame = document.querySelector('.goog-te-banner-frame');
      if (frame) (frame as HTMLElement).style.display = 'none';
      // Sayfayı reload et (temiz Türkçe)
      window.location.reload();
      return;
    }

    // Cookie'yi set et
    setGoogTransCookies(lang);

    // Google Translate combo'sunu tetiklemeyi dene
    if (triggerGoogleTranslate(lang)) return;

    // Combo henüz yüklenmemişse biraz bekle, yine olmazsa reload
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      if (triggerGoogleTranslate(lang)) {
        window.clearInterval(interval);
        return;
      }
      if (attempts >= 5) {
        window.clearInterval(interval);
        // Cookie set edildi, reload ile Google Translate otomatik çalışır
        window.location.reload();
      }
    }, 300);
  }, []);

  return (
    <div className="translate-custom">
      <label className="translate-custom__label sr-only" htmlFor="translate-select">
        Dil
      </label>
      <div className="translate-custom__field">
        <select
          id="translate-select"
          value={selected}
          onChange={handleChange}
          className="translate-custom__select"
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
