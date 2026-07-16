export type LocaleCode =
  | 'en' | 'es' | 'de' | 'fr' | 'ja'
  | 'zh-CN' | 'zh-TW' | 'pt-BR' | 'ko' | 'ar' | 'ru'
  | 'it' | 'id'
  | 'hi' | 'ur' | 'tr' | 'vi' | 'pl' | 'nl'
  | 'ro' | 'cs' | 'sv' | 'hu' | 'uk'
  | 'th' | 'bn' | 'fa' | 'fil' | 'ms' | 'el';

export interface LocaleConfig {
  code: LocaleCode;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

/** API response shape — countryCode is null when detection failed or header absent */
export interface GeoCountryResponse {
  countryCode: string | null;
}

export interface I18nInstance {
  init: () => Promise<void>;
  getLocale: () => LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  hasKey: (key: string) => boolean;
  debugReportMissing: (keys: string[]) => void;
  subscribe: (fn: (locale: LocaleCode) => void) => () => void;
  unsubscribe: (fn: (locale: LocaleCode) => void) => void;
}

export interface TranslationDict {
  [key: string]: string | TranslationDict;
}

/** Options for creating an i18n instance */
export interface I18nOptions {
  /** Seed locale — skips auto-detection when provided (e.g., SSR bootstrap) */
  initialLocale?: LocaleCode;
  /** Skip IP-based detection even if no stored locale — for SSR pre-set only */
  skipDetect?: boolean;
}
