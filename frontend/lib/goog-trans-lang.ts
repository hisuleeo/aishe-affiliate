export const AISHE_GOOGLANG_EVENT = 'aishe:googtrans:lang';

const SOURCE_LANGUAGE = 'en';

export function getGoogTransLang(): string {
  if (typeof document === 'undefined') return SOURCE_LANGUAGE;
  const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return match?.[1] || SOURCE_LANGUAGE;
}
