/** Language switcher result — select element + lifecycle cleanup handle */
export interface LanguageSwitcherResult {
  select: HTMLSelectElement;
  cleanup: () => void;
}

/** Searchable switcher result — root + lifecycle cleanup + open/close/focus methods */
export interface SearchableSwitcherResult {
  root: HTMLElement;
  cleanup: () => void;
  open: () => void;
  close: () => void;
  focus: () => void;
}

/** Searchable switcher constructor options */
export interface SearchableSwitcherOptions {
  i18n: import('../i18n/types').I18nInstance;
  /**
   * Mount point — element to append root to.
   * If provided, root is appended on construction. Otherwise caller mounts manually.
   */
  mount?: HTMLElement | null;
  /** Locales to pin at the top, in this order. Others follow RECOMMENDED_VISIBLE_ORDER. */
  preferredLocales?: import('../i18n/types').LocaleCode[];
  /** Render groups by region when true. Default: false (flat list). */
  groupByRegion?: boolean;
  /** Placeholder text for search input. Falls back to i18n `language.search` key. */
  searchPlaceholder?: string;
  /** Fired when user selects a locale. */
  onChange?: (locale: import('../i18n/types').LocaleCode) => void;
  /** CSS class for root element. */
  className?: string;
  /** id for root element. */
  id?: string;
}