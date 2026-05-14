import type { LocaleCode, I18nInstance, I18nOptions, TranslationDict } from './types';
import { detectLocale } from './detectLocale';
import { setStoredLocale } from './storage';
import { isRTL, LOCALE_CONFIGS, DEFAULT_LOCALE } from './locales';

import { en } from './dictionaries/en';
import { es } from './dictionaries/es';
import { de } from './dictionaries/de';
import { fr } from './dictionaries/fr';
import { ja } from './dictionaries/ja';
import { zhCN } from './dictionaries/zh-CN';
import { zhTW } from './dictionaries/zh-TW';
import { ptBR } from './dictionaries/pt-BR';
import { ko } from './dictionaries/ko';
import { ar } from './dictionaries/ar';
import { ru } from './dictionaries/ru';
import { it } from './dictionaries/it';
import { id } from './dictionaries/id';
import { hi } from './dictionaries/hi';
import { ur } from './dictionaries/ur';
import { tr } from './dictionaries/tr';
import { vi } from './dictionaries/vi';
import { pl } from './dictionaries/pl';
import { nl } from './dictionaries/nl';
import { ro } from './dictionaries/ro';
import { cs } from './dictionaries/cs';
import { sv } from './dictionaries/sv';
import { hu } from './dictionaries/hu';
import { uk } from './dictionaries/uk';
import { th } from './dictionaries/th';
import { bn } from './dictionaries/bn';
import { fa } from './dictionaries/fa';
import { fil } from './dictionaries/fil';
import { ms } from './dictionaries/ms';
import { el } from './dictionaries/el';

const DICTIONARIES: Record<LocaleCode, TranslationDict> = {
  en,
  es,
  de,
  fr,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'pt-BR': ptBR,
  ko,
  ar,
  ru,
  it,
  id,
  hi,
  ur,
  tr,
  vi,
  pl,
  nl,
  ro,
  cs,
  sv,
  hu,
  uk,
  th,
  bn,
  fa,
  fil,
  ms,
  el,
};

type SubscribeFn = (locale: LocaleCode) => void;

export function createI18n(opts: I18nOptions = {}): I18nInstance {
  const { initialLocale, skipDetect = false } = opts;

  let activeLocale: LocaleCode = initialLocale ?? DEFAULT_LOCALE;
  let currentDict: TranslationDict = DICTIONARIES[activeLocale] ?? DICTIONARIES['en'];
  const subscribers = new Set<SubscribeFn>();
  const loggedMissing = new Set<string>();

  function resolveValue(source: TranslationDict, key: string): unknown {
    const parts = key.split('.');
    let val: unknown = source;
    for (const part of parts) {
      if (val && typeof val === 'object' && part in val) {
        val = (val as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }
    return val;
  }

  function logMissing(key: string, type: 'fallback-en' | 'missing-all'): void {
    const marker = `${activeLocale}:${key}:${type}`;
    if (loggedMissing.has(marker)) return;
    loggedMissing.add(marker);
    console.error(`[i18n missing] locale=${activeLocale} key=${key} status=${type}`);
  }

  async function init(): Promise<void> {
    if (initialLocale) {
      activeLocale = initialLocale;
      currentDict = DICTIONARIES[initialLocale] ?? DICTIONARIES['en'];
      return;
    }
    const detected = await detectLocale(skipDetect);
    activeLocale = detected;
    currentDict = DICTIONARIES[detected] ?? DICTIONARIES['en'];
  }

  function getLocale(): LocaleCode {
    return activeLocale;
  }

  function setLocale(locale: LocaleCode): void {
    activeLocale = locale;
    currentDict = DICTIONARIES[locale] ?? DICTIONARIES['en'];
    setStoredLocale(locale);
    subscribers.forEach(fn => fn(locale));
  }

  function t(key: string, params?: Record<string, string | number>): string {
    let val: unknown = resolveValue(currentDict, key);
    if (val == null) {
      val = resolveValue(DICTIONARIES['en'], key);
      if (val == null) {
        logMissing(key, 'missing-all');
        return key;
      }
      if (activeLocale !== 'en') {
        logMissing(key, 'fallback-en');
      }
    }
    if (typeof val !== 'string') return key;
    if (!params) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  function hasKey(key: string): boolean {
    return resolveValue(currentDict, key) != null;
  }

  function debugReportMissing(keys: string[]): void {
    for (const key of keys) {
      if (!hasKey(key) && resolveValue(DICTIONARIES['en'], key) != null && activeLocale !== 'en') {
        logMissing(key, 'fallback-en');
      } else if (!hasKey(key) && resolveValue(DICTIONARIES['en'], key) == null) {
        logMissing(key, 'missing-all');
      }
    }
  }

  function subscribe(fn: SubscribeFn): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function unsubscribe(fn: SubscribeFn): void {
    subscribers.delete(fn);
  }

  return { init, getLocale, setLocale, t, hasKey, debugReportMissing, subscribe, unsubscribe };
}

export { isRTL, LOCALE_CONFIGS };
