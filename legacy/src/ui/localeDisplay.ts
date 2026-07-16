/**
 * Locale display helpers — ordering, grouping, and labels for UI.
 * Zero deps. Works in browser and server contexts.
 */

import type { LocaleCode } from '../i18n/types';
import { LOCALE_CONFIGS, SUPPORTED_LOCALES } from '../i18n/locales';

export { LocaleCode };

/** Locale group label */
export type LocaleGroup =
  | 'popular'    // en, es, de, fr, ja, zh-*, pt-BR, ko — shown at top
  | 'europe'     // ar, ru, it, id + emerging EU
  | 'asia'       // hi, ur, tr, vi, th, bn, fa, fil, ms
  | 'eastern-eu' // pl, nl, ro, cs, sv, hu, uk
  | 'other';     // el and anything ungrouped

/** Fields returned per locale for UI rendering */
export interface LocaleDisplayEntry {
  code: LocaleCode;
  name: string;
  nativeName: string;
  group: LocaleGroup;
  isRTL: boolean;
  isPopular: boolean;
}

/** Visible-first ordering — popular locales first, then alphabetically within group */
export const RECOMMENDED_VISIBLE_ORDER: LocaleCode[] = [
  // Popular (wave 1)
  'en', 'es', 'de', 'fr', 'ja', 'zh-CN', 'zh-TW', 'pt-BR', 'ko',
  // Europe + Middle East
  'ar', 'ru', 'it', 'id',
  // South / Central Asia
  'hi', 'ur', 'tr', 'vi',
  // Eastern Europe
  'pl', 'nl', 'ro', 'cs', 'sv', 'hu', 'uk',
  // Southeast / South Asia
  'th', 'bn', 'fa', 'fil', 'ms',
  // Other
  'el',
];

/** Group assignment for each locale */
const LOCALE_GROUPS: Record<LocaleCode, LocaleGroup> = {
  en: 'popular', es: 'popular', de: 'popular', fr: 'popular',
  ja: 'popular', 'zh-CN': 'popular', 'zh-TW': 'popular',
  'pt-BR': 'popular', ko: 'popular',
  ar: 'europe', ru: 'europe', it: 'europe', id: 'europe',
  hi: 'asia', ur: 'asia', tr: 'asia', vi: 'asia',
  th: 'asia', bn: 'asia', fa: 'asia', fil: 'asia', ms: 'asia',
  pl: 'eastern-eu', nl: 'eastern-eu', ro: 'eastern-eu',
  cs: 'eastern-eu', sv: 'eastern-eu', hu: 'eastern-eu', uk: 'eastern-eu',
  el: 'other',
};

/** Group display labels */
export const LOCALE_GROUP_LABELS: Record<LocaleGroup, string> = {
  popular:      'Popular',
  europe:       'Europe & Middle East',
  'eastern-eu': 'Eastern Europe',
  asia:         'Asia & Pacific',
  other:        'Other',
};

/**
 * Return a display entry for each supported locale in recommended visible-first order.
 * Use for building <select> options, search results, or grouped UIs.
 */
export function getOrderedLocaleList(): LocaleDisplayEntry[] {
  return RECOMMENDED_VISIBLE_ORDER.map(code => {
    const config = LOCALE_CONFIGS[code];
    const group = LOCALE_GROUPS[code] ?? 'other';
    return {
      code,
      name: config.name,
      nativeName: config.nativeName,
      group,
      isRTL: config.dir === 'rtl',
      isPopular: group === 'popular',
    };
  });
}

/**
 * Reorder a list of locales by recommended visible-first order.
 * Locales not in RECOMMENDED_VISIBLE_ORDER sort alphabetically at the end.
 */
export function sortLocalesByRecommended(localeCodes: LocaleCode[]): LocaleCode[] {
  const orderMap = new Map(LOCALE_CODE_INDICES);
  return [...localeCodes].sort((a, b) => {
    const ai = orderMap.get(a) ?? Infinity;
    const bi = orderMap.get(b) ?? Infinity;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
}

/** Fast index map for RECOMMENDED_VISIBLE_ORDER — built once, reused */
const LOCALE_CODE_INDICES = new Map<LocaleCode, number>(
  RECOMMENDED_VISIBLE_ORDER.map((code, i) => [code, i] as [LocaleCode, number]),
);