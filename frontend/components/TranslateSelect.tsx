"use client";

import { useEffect, useMemo, useState } from 'react';

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

const DEFAULT_LANGUAGE = 'tr';
const SOURCE_LANGUAGE = 'tr';

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const setTranslateCookie = (targetLanguage: string) => {
  if (typeof document === 'undefined') return;
  const value = `/${SOURCE_LANGUAGE}/${targetLanguage}`;
  document.cookie = `googtrans=${value}; path=/`;
  document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
};

export default function TranslateSelect() {
  const [selected, setSelected] = useState(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);

  const options = useMemo(() => LANGUAGE_OPTIONS, []);

  useEffect(() => {
    const cookieValue = getCookie('googtrans');
    if (!cookieValue) return;

    const parts = cookieValue.split('/');
    const targetLanguage = parts[2];
    if (!targetLanguage) return;

    window.setTimeout(() => {
      setSelected((current) => (current === targetLanguage ? current : targetLanguage));
    }, 0);
  }, []);

  useEffect(() => {
    const waitForCombo = () => {
      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (combo) {
        setIsReady(true);
        combo.value = selected;
        combo.dispatchEvent(new Event('change'));
        return true;
      }
      return false;
    };

    if (waitForCombo()) return;

    const intervalId = window.setInterval(() => {
      if (waitForCombo()) {
        window.clearInterval(intervalId);
      }
    }, 500);

    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 15000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [selected]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelected(value);
    setTranslateCookie(value);

    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = value;
      combo.dispatchEvent(new Event('change'));
      return;
    }

    window.setTimeout(() => {
      const retryCombo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (retryCombo) {
        retryCombo.value = value;
        retryCombo.dispatchEvent(new Event('change'));
        return;
      }
      window.location.reload();
    }, 600);
  };

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
          aria-busy={!isReady}
        >
          {options.map((option) => (
            <option key={option.code} value={option.code}>
              {option.flag} {option.short}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
