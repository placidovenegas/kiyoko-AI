'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { type Locale, locales, defaultLocale } from '@/i18n/config';

export function useChangeLocale() {
  const router = useRouter();

  const changeLocale = useCallback((locale: Locale) => {
    if (!locales.includes(locale)) return;
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }, [router]);

  return changeLocale;
}

export function getCurrentLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
  const value = match?.[1] as Locale | undefined;
  return value && locales.includes(value) ? value : defaultLocale;
}
