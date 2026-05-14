import type { I18nInstance, LocaleCode } from '../i18n/types';
import { LOCALE_CONFIGS } from '../i18n/locales';
import type { LanguageSwitcherResult } from './types';
import { RECOMMENDED_VISIBLE_ORDER, getOrderedLocaleList, LOCALE_GROUP_LABELS } from './localeDisplay';

function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

export { LanguageSwitcherResult };

export interface LanguageSwitcherOptions {
  i18n: I18nInstance;
  currentLocale?: LocaleCode;
  /** Locales to show first, in this order. Others follow in RECOMMENDED_VISIBLE_ORDER. */
  preferredLocales?: LocaleCode[];
  /** Render <optgroup> labels by locale group. Default: false (flat list). */
  groupByRegion?: boolean;
  onChange?: (locale: LocaleCode) => void;
  className?: string;
  id?: string;
}

function buildLocaleOrder(preferred: LocaleCode[] = []): LocaleCode[] {
  const dedupedPreferred = Array.from(new Set(preferred));
  const preferredSet = new Set(dedupedPreferred);
  const rest = RECOMMENDED_VISIBLE_ORDER.filter(c => !preferredSet.has(c));
  return [...dedupedPreferred, ...rest];
}

function getLocalizedAriaLabel(i18n: I18nInstance): string {
  const primary = i18n.t('header.languageSelect');
  if (primary !== 'header.languageSelect') return primary;

  const secondary = i18n.t('language.select');
  if (secondary !== 'language.select') return secondary;

  return 'Select language';
}

function buildSelectOptions(
  select: HTMLSelectElement,
  orderedCodes: LocaleCode[],
  activeLocale: LocaleCode,
): void {
  for (const code of orderedCodes) {
    const config = LOCALE_CONFIGS[code];
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${config.nativeName} (${config.name})`;
    if (code === activeLocale) option.selected = true;
    select.appendChild(option);
  }
}

function buildGroupedSelectOptions(
  select: HTMLSelectElement,
  orderedCodes: LocaleCode[],
  activeLocale: LocaleCode,
): void {
  const allowed = new Set(orderedCodes);
  const grouped = getOrderedLocaleList().filter(entry => allowed.has(entry.code));
  const groupMap = new Map<string, HTMLOptGroupElement>();

  for (const entry of grouped) {
    const label = LOCALE_GROUP_LABELS[entry.group];
    let group = groupMap.get(label);
    if (!group) {
      group = document.createElement('optgroup');
      group.label = label;
      groupMap.set(label, group);
      select.appendChild(group);
    }

    const option = document.createElement('option');
    option.value = entry.code;
    option.textContent = `${entry.nativeName} (${entry.name})`;
    if (entry.code === activeLocale) option.selected = true;
    group.appendChild(option);
  }
}

/**
 * Build a plain DOM <select> language switcher wired to an i18n instance.
 * Options appear in recommended visible-first order with optional preferred-locale pin.
 * Returns { select, cleanup } — call cleanup() to remove listeners on unmount.
 */
export function createLanguageSwitcher(opts: LanguageSwitcherOptions): LanguageSwitcherResult {
  if (!isBrowser()) {
    throw new Error('createLanguageSwitcher must be called in a browser context');
  }

  const { i18n, currentLocale, preferredLocales, groupByRegion = false, onChange, className, id } = opts;
  const activeLocale = currentLocale ?? i18n.getLocale();
  const ordered = buildLocaleOrder([activeLocale, ...(preferredLocales ?? [])]);

  const select = document.createElement('select');
  if (id) select.id = id;
  if (className) select.className = className;
  select.setAttribute('aria-label', getLocalizedAriaLabel(i18n));

  if (groupByRegion) {
    buildGroupedSelectOptions(select, ordered, activeLocale);
  } else {
    buildSelectOptions(select, ordered, activeLocale);
  }

  // Sync select value when locale changes from another source (e.g., URL route)
  const unsubscribe = i18n.subscribe((locale) => {
    select.value = locale;
  });

  select.addEventListener('change', () => {
    const selected = select.value as LocaleCode;
    i18n.setLocale(selected);
    onChange?.(selected);
  });

  function cleanup(): void {
    unsubscribe();
  }

  return { select, cleanup };
}

/**
 * Sync all [data-i18n-switcher] <select> elements in the DOM with current locale.
 * Use when multiple independent switchers exist and you want a single sync source.
 * Returns cleanup fn — call on unmount.
 */
export function syncAllSwitchers(i18n: I18nInstance): () => void {
  if (!isBrowser()) return () => {};

  const update = () => {
    const selects = document.querySelectorAll<HTMLSelectElement>('select[data-i18n-switcher]');
    selects.forEach(sel => { sel.value = i18n.getLocale(); });
  };

  return i18n.subscribe(update);
}
