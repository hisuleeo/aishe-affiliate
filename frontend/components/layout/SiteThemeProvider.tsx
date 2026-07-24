'use client';

import { ReactNode, useEffect } from 'react';

type SiteThemeProviderProps = {
  children: ReactNode;
  initialIsUkSite?: boolean;
  initialIsMyAisheSite?: boolean;
};

export function SiteThemeProvider({
  children,
  initialIsUkSite = false,
  initialIsMyAisheSite = false,
}: SiteThemeProviderProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (initialIsMyAisheSite) {
      document.body.setAttribute('data-site-theme', 'my-aishe');
      return;
    }

    if (initialIsUkSite) {
      document.body.setAttribute('data-site-theme', 'uk-graphite');
      return;
    }

    document.body.setAttribute('data-site-theme', 'pro-dark');
  }, [initialIsUkSite, initialIsMyAisheSite]);

  return <>{children}</>;
}
