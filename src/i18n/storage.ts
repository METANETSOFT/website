import type { LocaleCode } from './types';
import { isSupportedLocale } from './locales';

const STORAGE_KEY = 'metanet.locale';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getStoredLocale(): LocaleCode | null {
  if (!isBrowser()) return null;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val && isSupportedLocale(val)) return val as LocaleCode;
  } catch {
    // localStorage blocked or corrupted — ignore
  }
  return null;
}

export function setStoredLocale(locale: LocaleCode): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage blocked or quota exceeded — ignore silently
  }
}