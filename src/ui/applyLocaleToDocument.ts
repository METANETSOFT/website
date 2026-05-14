import type { LocaleCode } from '../i18n/types';
import { isRTL } from '../i18n/locales';

function isBrowser(): boolean {
  return typeof document !== 'undefined';
}

/**
 * Apply locale metadata to document.documentElement.
 * Sets lang attribute and dir (ltr | rtl) for correct rendering.
 */
export function applyLocaleToDocument(locale: LocaleCode): void {
  if (!isBrowser()) return;
  const html = document.documentElement;
  html.lang = locale;
  html.dir = isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get current document lang attribute.
 */
export function getDocumentLocale(): LocaleCode | null {
  if (!isBrowser()) return null;
  return document.documentElement.lang as LocaleCode;
}
