export { applyLocaleToDocument, getDocumentLocale } from './applyLocaleToDocument';
export { createLanguageSwitcher, syncAllSwitchers } from './createLanguageSwitcher';
export type { LanguageSwitcherResult } from './createLanguageSwitcher';
export { createSearchableLanguageSwitcher } from './createSearchableLanguageSwitcher';
export type { SearchableSwitcherResult, SearchableSwitcherOptions } from './types';
export { bindTranslations, bindElement } from './bindTranslations';
export {
  getOrderedLocaleList,
  sortLocalesByRecommended,
  RECOMMENDED_VISIBLE_ORDER,
  LOCALE_GROUP_LABELS,
} from './localeDisplay';