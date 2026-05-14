import type { LocaleCode, LocaleConfig } from './types';

export const SUPPORTED_LOCALES: LocaleCode[] = [
  'en', 'es', 'de', 'fr', 'ja',
  'zh-CN', 'zh-TW', 'pt-BR', 'ko', 'ar', 'ru',
  'it', 'id',
  'hi', 'ur', 'tr', 'vi', 'pl', 'nl',
  'ro', 'cs', 'sv', 'hu', 'uk',
  'th', 'bn', 'fa', 'fil', 'ms', 'el',
];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const LOCALE_CONFIGS: Record<LocaleCode, LocaleConfig> = {
  en:    { code: 'en',    name: 'English',               nativeName: 'English',               dir: 'ltr' },
  es:    { code: 'es',    name: 'Spanish',               nativeName: 'Español',              dir: 'ltr' },
  de:    { code: 'de',    name: 'German',                nativeName: 'Deutsch',              dir: 'ltr' },
  fr:    { code: 'fr',    name: 'French',                nativeName: 'Français',             dir: 'ltr' },
  ja:    { code: 'ja',    name: 'Japanese',              nativeName: '日本語',               dir: 'ltr' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文',            dir: 'ltr' },
  'zh-TW': { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文',            dir: 'ltr' },
  'pt-BR': { code: 'pt-BR', name: 'Portuguese (Brazil)',  nativeName: 'Português (Brasil)',   dir: 'ltr' },
  ko:    { code: 'ko',    name: 'Korean',                nativeName: '한국어',               dir: 'ltr' },
  ar:    { code: 'ar',    name: 'Arabic',               nativeName: 'العربية',              dir: 'rtl' },
  ru:    { code: 'ru',    name: 'Russian',               nativeName: 'Русский',             dir: 'ltr' },
  it:    { code: 'it',    name: 'Italian',               nativeName: 'Italiano',             dir: 'ltr' },
  id:    { code: 'id',    name: 'Indonesian',            nativeName: 'Bahasa Indonesia',     dir: 'ltr' },
  hi:    { code: 'hi',    name: 'Hindi',                 nativeName: 'हिन्दी',               dir: 'ltr' },
  ur:    { code: 'ur',    name: 'Urdu',                  nativeName: 'اردو',                 dir: 'rtl' },
  tr:    { code: 'tr',    name: 'Turkish',               nativeName: 'Türkçe',               dir: 'ltr' },
  vi:    { code: 'vi',    name: 'Vietnamese',             nativeName: 'Tiếng Việt',           dir: 'ltr' },
  pl:    { code: 'pl',    name: 'Polish',                nativeName: 'Polski',               dir: 'ltr' },
  nl:    { code: 'nl',    name: 'Dutch',                  nativeName: 'Nederlands',           dir: 'ltr' },
  ro:    { code: 'ro',    name: 'Romanian',              nativeName: 'Română',               dir: 'ltr' },
  cs:    { code: 'cs',    name: 'Czech',                  nativeName: 'Čeština',              dir: 'ltr' },
  sv:    { code: 'sv',    name: 'Swedish',                nativeName: 'Svenska',              dir: 'ltr' },
  hu:    { code: 'hu',    name: 'Hungarian',             nativeName: 'Magyar',               dir: 'ltr' },
  uk:    { code: 'uk',    name: 'Ukrainian',             nativeName: 'Українська',          dir: 'ltr' },
  th:    { code: 'th',    name: 'Thai',                  nativeName: 'ไทย',                  dir: 'ltr' },
  bn:    { code: 'bn',    name: 'Bengali',               nativeName: 'বাংলা',                dir: 'ltr' },
  fa:    { code: 'fa',    name: 'Persian',               nativeName: 'فارسی',                 dir: 'rtl' },
  fil:   { code: 'fil',   name: 'Filipino',              nativeName: 'Filipino',             dir: 'ltr' },
  ms:    { code: 'ms',    name: 'Malay',                 nativeName: 'Bahasa Melayu',         dir: 'ltr' },
  el:    { code: 'el',    name: 'Greek',                  nativeName: 'Ελληνικά',             dir: 'ltr' },
};

export const COUNTRY_TO_LOCALE: Record<string, LocaleCode> = {
  // English-base
  US: 'en', GB: 'en', AU: 'en', CA: 'en',
  ZA: 'en', NZ: 'en', IE: 'en', SG: 'en',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es',
  PE: 'es', VE: 'es', CL: 'es', EC: 'es', UY: 'es', DO: 'es', GT: 'es', CR: 'es',
  // German
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  // French
  FR: 'fr', BE: 'fr', MC: 'fr', CD: 'fr', SN: 'fr', CI: 'fr', ML: 'fr', BF: 'fr',
  // Japanese
  JP: 'ja',
  // Chinese
  CN: 'zh-CN', HK: 'zh-TW', MO: 'zh-TW', TW: 'zh-TW',
  // Portuguese
  BR: 'pt-BR', PT: 'pt-BR',
  // Korean
  KR: 'ko',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', IQ: 'ar',
  QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar', JO: 'ar', LB: 'ar', SY: 'ar', LY: 'ar', TN: 'ar',
  // Russian / Ukrainian
  RU: 'ru', UA: 'uk', BY: 'ru', KZ: 'ru',
  // Italian
  IT: 'it', SM: 'it',
  // Indonesian / Malay — Malaysia gets Malay, Indonesia gets Indonesian
  ID: 'id', MY: 'ms',
  // Turkish
  TR: 'tr',
  // Vietnamese
  VN: 'vi',
  // Polish
  PL: 'pl',
  // Dutch
  NL: 'nl',
  // Romanian
  RO: 'ro', MD: 'ro',
  // Czech
  CZ: 'cs',
  // Swedish — Sweden only; Finland is Finnish
  SE: 'sv',
  // Hungarian
  HU: 'hu',
  // Thai
  TH: 'th',
  // Bengali
  BD: 'bn', PK: 'ur',  // Pakistan is Urdu, Bangladesh is Bengali
  // Persian
  IR: 'fa', AF: 'fa',
  // Filipino / Malay
  PH: 'fil',
  // Greek
  GR: 'el', CY: 'el',
};

/** Normalize browser language tag to supported locale */
export const BROWSER_LANG_NORMALIZE: Record<string, LocaleCode> = {
  // English
  'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en', 'en-CA': 'en', 'en-IN': 'en', 'en-SG': 'en',
  // Spanish
  'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es', 'es-CO': 'es', 'es-PE': 'es',
  'es-CL': 'es', 'es-EC': 'es', 'es-UY': 'es', 'es-GT': 'es', 'es-CR': 'es',
  // German
  'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de',
  // French
  'fr-FR': 'fr', 'fr-CA': 'fr', 'fr-BE': 'fr',
  // Japanese
  'ja-JP': 'ja',
  // Chinese
  'zh-CN': 'zh-CN', 'zh-Hans': 'zh-CN', 'zh-Hans-CN': 'zh-CN',
  'zh-TW': 'zh-TW', 'zh-Hant': 'zh-TW', 'zh-Hant-TW': 'zh-TW',
  // Portuguese
  'pt-BR': 'pt-BR', 'pt-PT': 'pt-BR',
  // Korean
  'ko-KR': 'ko',
  // Arabic
  'ar-SA': 'ar', 'ar-AE': 'ar', 'ar-EG': 'ar', 'ar-IQ': 'ar', 'ar-JO': 'ar', 'ar-LB': 'ar',
  // Russian / Ukrainian
  'ru-RU': 'ru', 'ru-UA': 'uk',
  // Italian
  'it-IT': 'it',
  // Indonesian
  'id-ID': 'id',
  // Hindi / Urdu
  'hi-IN': 'hi', 'hi': 'hi',
  'ur-PK': 'ur', 'ur': 'ur',
  // Turkish
  'tr-TR': 'tr', 'tr': 'tr',
  // Vietnamese
  'vi-VN': 'vi', 'vi': 'vi',
  // Polish
  'pl-PL': 'pl', 'pl': 'pl',
  // Dutch
  'nl-NL': 'nl', 'nl-BE': 'nl',
  // Romanian
  'ro-RO': 'ro', 'ro': 'ro',
  // Czech
  'cs-CZ': 'cs', 'cs': 'cs',
  // Swedish
  'sv-SE': 'sv', 'sv-FI': 'sv',
  // Hungarian
  'hu-HU': 'hu', 'hu': 'hu',
  // Ukrainian
  'uk-UA': 'uk', 'uk': 'uk',
  // Thai
  'th-TH': 'th', 'th': 'th',
  // Bengali
  'bn-BD': 'bn', 'bn': 'bn',
  // Persian
  'fa-IR': 'fa', 'fa-AF': 'fa',
  // Filipino
  'fil-PH': 'fil', 'fil': 'fil',
  // Malay
  'ms-MY': 'ms', 'ms-BN': 'ms', 'ms': 'ms',
  // Greek
  'el-GR': 'el', 'el-CY': 'el',
};

export function isSupportedLocale(code: string): code is LocaleCode {
  return SUPPORTED_LOCALES.includes(code as LocaleCode);
}

export function isRTL(locale: LocaleCode): boolean {
  return LOCALE_CONFIGS[locale]?.dir === 'rtl';
}
