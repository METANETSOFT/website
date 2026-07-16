/**
 * Custom DOM-based searchable language switcher — better suited for 30+ locales.
 * Plain TypeScript DOM only. No external deps.
 *
 * Combobox pattern: input owns listbox via aria-controls + aria-expanded + aria-activedescendant.
 * Keyboard nav from focused search input.
 */

import type { I18nInstance, LocaleCode } from '../i18n/types';
import { getOrderedLocaleList, RECOMMENDED_VISIBLE_ORDER, LOCALE_GROUP_LABELS } from './localeDisplay';
import type { LocaleDisplayEntry, LocaleGroup } from './localeDisplay';
import type { SearchableSwitcherOptions, SearchableSwitcherResult } from './types';

function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

// ─── Preferred-first ordering ───────────────────────────────────────────────

function buildLocaleOrder(preferred: LocaleCode[] = []): LocaleCode[] {
  const dedupedPreferred = Array.from(new Set(preferred));
  const preferredSet = new Set(dedupedPreferred);
  const rest = RECOMMENDED_VISIBLE_ORDER.filter(c => !preferredSet.has(c));
  return [...dedupedPreferred, ...rest];
}

function buildOrderedEntries(orderedCodes: LocaleCode[]): LocaleDisplayEntry[] {
  const entryMap = new Map(getOrderedLocaleList().map(entry => [entry.code, entry] as const));
  return orderedCodes
    .map(code => entryMap.get(code))
    .filter((entry): entry is LocaleDisplayEntry => Boolean(entry));
}

// ─── i18n label helpers ──────────────────────────────────────────────────────

function i18nLabel(i18n: I18nInstance, key: string, fallback: string): string {
  const val = i18n.t(key);
  return val !== key ? val : fallback;
}

// ─── Search ─────────────────────────────────────────────────────────────────

function caseInsensitiveIncludes(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function filterLocales(entries: LocaleDisplayEntry[], query: string): LocaleDisplayEntry[] {
  if (!query.trim()) return entries;
  const q = query.trim().toLowerCase();
  return entries.filter(entry =>
    caseInsensitiveIncludes(entry.code, q) ||
    caseInsensitiveIncludes(entry.name, q) ||
    caseInsensitiveIncludes(entry.nativeName, q)
  );
}

// ─── Group detection ─────────────────────────────────────────────────────────

function isGroupedList(entries: LocaleDisplayEntry[]): boolean {
  let prev: LocaleGroup | undefined;
  for (const e of entries) {
    if (prev !== undefined && e.group !== prev) return true;
    prev = e.group;
  }
  return false;
}

// ─── Markup builders ────────────────────────────────────────────────────────

function updateTriggerLabel(btn: HTMLButtonElement, code: LocaleCode): void {
  const entry = getOrderedLocaleList().find(e => e.code === code);
  btn.textContent = entry ? entry.nativeName : code;
}

function buildTrigger(
  i18n: I18nInstance,
  currentCode: LocaleCode,
  className?: string,
  id?: string,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className ? `${className}-trigger` : 'lang-search-trigger';
  if (id) btn.id = `${id}-trigger`;
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', i18nLabel(i18n, 'header.languageSelect', 'Select language'));
  updateTriggerLabel(btn, currentCode);
  return btn;
}

function buildPopover(
  className?: string,
  id?: string,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = className ? `${className}-popover` : 'lang-search-popover';
  if (id) panel.id = `${id}-popover`;
  panel.style.display = 'none';
  return panel;
}

function buildSearchInput(
  placeholder: string,
  ariaLabel: string,
  className?: string,
  id?: string,
  listboxId?: string,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = className ? `${className}-search` : 'lang-search-input';
  if (id) input.id = `${id}-search`;
  input.setAttribute('placeholder', placeholder);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-label', ariaLabel);
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listboxId ?? '');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-activedescendant', '');
  return input;
}

function buildListbox(
  className?: string,
  id?: string,
): HTMLElement {
  const listbox = document.createElement('ul');
  listbox.className = className ? `${className}-listbox` : 'lang-search-listbox';
  if (id) listbox.id = id;
  listbox.setAttribute('role', 'listbox');
  listbox.style.overflowY = 'auto';
  listbox.style.maxHeight = '300px';
  listbox.style.listStyle = 'none';
  listbox.style.padding = '0';
  listbox.style.margin = '0';
  return listbox;
}

function buildGroupLabel(
  group: LocaleGroup,
  className?: string,
): HTMLElement {
  const el = document.createElement('li');
  el.className = className ? `${className}-group-label` : 'lang-search-group-label';
  el.setAttribute('role', 'presentation');
  el.textContent = LOCALE_GROUP_LABELS[group];
  return el;
}

function buildOption(
  entry: LocaleDisplayEntry,
  isActive: boolean,
  optionId: string,
  className?: string,
): HTMLLIElement {
  const item = document.createElement('li');
  item.className = className ? `${className}-option` : 'lang-search-option';
  if (isActive) item.classList.add('lang-search-option-active');
  item.id = optionId;
  item.setAttribute('role', 'option');
  item.setAttribute('aria-selected', String(isActive));
  item.dataset.locale = entry.code;
  item.tabIndex = -1;

  const label = document.createElement('span');
  label.className = className ? `${className}-option-label` : 'lang-search-option-label';
  label.textContent = `${entry.nativeName} (${entry.name})`;
  item.appendChild(label);

  if (entry.isRTL) item.dir = 'rtl';

  return item;
}

function buildOptionsFragment(
  entries: LocaleDisplayEntry[],
  activeCode: LocaleCode,
  groupByRegion: boolean,
  optionIdPrefix: string,
  className?: string,
): DocumentFragment {
  const frag = document.createDocumentFragment();

  if (groupByRegion && isGroupedList(entries)) {
    const byGroup = new Map<LocaleGroup, LocaleDisplayEntry[]>();
    for (const e of entries) {
      if (!byGroup.has(e.group)) byGroup.set(e.group, []);
      byGroup.get(e.group)!.push(e);
    }
    for (const [, groupEntries] of byGroup) {
      frag.appendChild(buildGroupLabel(groupEntries[0].group, className));
      for (const entry of groupEntries) {
        frag.appendChild(buildOption(entry, entry.code === activeCode, `${optionIdPrefix}-${entry.code}`, className));
      }
    }
  } else {
    for (const entry of entries) {
      frag.appendChild(buildOption(entry, entry.code === activeCode, `${optionIdPrefix}-${entry.code}`, className));
    }
  }

  return frag;
}

// ─── Highlight management ────────────────────────────────────────────────────

function getActiveIndex(listbox: HTMLElement): number {
  return Array.from(listbox.querySelectorAll<HTMLElement>('[data-locale]')).findIndex(
    el => el.getAttribute('aria-selected') === 'true'
  );
}

function setActiveOption(listbox: HTMLElement, index: number, className?: string): void {
  const items = Array.from(listbox.querySelectorAll<HTMLElement>('[data-locale]'));
  const activeClass = className ? `${className}-option-active` : 'lang-search-option-active';
  items.forEach(el => {
    el.setAttribute('aria-selected', 'false');
    el.classList.remove(activeClass);
  });
  if (index >= 0 && index < items.length) {
    const item = items[index];
    item.setAttribute('aria-selected', 'true');
    item.classList.add(activeClass);
    item.scrollIntoView({ block: 'nearest' });
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

/**
 * Build a custom DOM-based searchable language switcher.
 *
 * Combobox pattern: input (trigger) owns listbox via aria-controls + aria-expanded.
 * Keyboard nav operates from the search input.
 *
 * Returns { root, cleanup, open, close, focus }.
 * root is NOT auto-mounted — caller decides placement.
 * Syncs with external locale changes via i18n.subscribe.
 */
export function createSearchableLanguageSwitcher(opts: SearchableSwitcherOptions): SearchableSwitcherResult {
  if (!isBrowser()) {
    throw new Error('createSearchableLanguageSwitcher must be called in a browser context');
  }

  const {
    i18n,
    mount = null,
    preferredLocales = [],
    groupByRegion = false,
    searchPlaceholder,
    onChange,
    className,
    id,
  } = opts;

  // Single mutable source of truth for active locale
  let currentLocale = i18n.getLocale();

  // Ordered locale lists (preferred first, then recommended)
  const orderedCodes = buildLocaleOrder([currentLocale, ...preferredLocales]);
  const allOrderedEntries = buildOrderedEntries(orderedCodes);

  // IDs
  const instanceId = id ?? `lang-searchable-${Math.random().toString(36).slice(2, 10)}`;
  const rootId = id ?? '';
  const listboxId = `${instanceId}-listbox`;
  const optionIdPrefix = `${instanceId}-option`;

  // Labels
  const placeholder = searchPlaceholder ?? i18nLabel(i18n, 'language.search', 'Search language…');
  const searchAriaLabel = i18nLabel(i18n, 'language.search', 'Search language');

  // ─── DOM tree ─────────────────────────────────────────────────────────────

  const root = document.createElement('div');
  if (rootId) root.id = rootId;
  if (className) root.className = className;

  const trigger = buildTrigger(i18n, currentLocale, className, id);

  const popover = buildPopover(className, id);
  const searchInput = buildSearchInput(placeholder, searchAriaLabel, className, id, listboxId);
  const listbox = buildListbox(className, listboxId);
  listbox.setAttribute('aria-label', i18nLabel(i18n, 'language.title', 'Language list'));

  popover.appendChild(searchInput);
  popover.appendChild(listbox);
  root.appendChild(trigger);
  root.appendChild(popover);

  // ─── State ─────────────────────────────────────────────────────────────────

  let isOpen = false;
  let highlightedIndex = -1;

  // Current visible entries (filtered by search)
  let visibleEntries: LocaleDisplayEntry[] = allOrderedEntries;

  // ─── Render ───────────────────────────────────────────────────────────────

  function renderList(entries: LocaleDisplayEntry[]): void {
    listbox.textContent = '';
    if (entries.length === 0) {
      const msg = document.createElement('li');
      msg.className = 'lang-search-no-results';
      msg.textContent = i18n.t('common.noResults');
      listbox.appendChild(msg);
      highlightedIndex = -1;
      return;
    }
    listbox.appendChild(buildOptionsFragment(entries, currentLocale, groupByRegion, optionIdPrefix, className));
    highlightedIndex = -1;
  }

  function resetSearch(): void {
    searchInput.value = '';
    visibleEntries = allOrderedEntries;
    renderList(visibleEntries);
  }

  // Initial render
  renderList(visibleEntries);

  // ─── Panel open/close ──────────────────────────────────────────────────────

  function open(): void {
    if (isOpen) {
      searchInput.focus();
      return;
    }
    isOpen = true;
    popover.style.display = 'block';
    trigger.setAttribute('aria-expanded', 'true');
    searchInput.setAttribute('aria-expanded', 'true');
    resetSearch();
    searchInput.focus();
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    popover.style.display = 'none';
    trigger.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-activedescendant', '');
    highlightedIndex = -1;
  }

  function focus(): void {
    searchInput.focus();
  }

  // ─── Locale selection ─────────────────────────────────────────────────────

  function selectLocale(code: LocaleCode): void {
    currentLocale = code;
    i18n.setLocale(code);
    updateTriggerLabel(trigger, code);
    onChange?.(code);
    close();
  }

  // ─── Keyboard nav (operates from searchInput) ─────────────────────────────

  // Unified keyboard handler on searchInput
  searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
    const items = Array.from(listbox.querySelectorAll<HTMLElement>('[data-locale]'));

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        trigger.focus();
        break;

      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < items.length) {
          const code = items[highlightedIndex].dataset.locale as LocaleCode;
          if (code) selectLocale(code);
        } else {
          // No highlighted item — find first match if search text matches exactly a code
          const q = searchInput.value.trim().toLowerCase();
          if (q) {
            const match = visibleEntries.findIndex(
              e => e.code.toLowerCase() === q || e.nativeName.toLowerCase() === q || e.name.toLowerCase() === q
            );
            if (match >= 0) {
              selectLocale(visibleEntries[match].code);
            }
          }
        }
        break;
      }

      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        const nextIdx = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0;
        highlightedIndex = nextIdx;
        setActiveOption(listbox, nextIdx, className);
        searchInput.setAttribute('aria-activedescendant', items[nextIdx]?.id ?? '');
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) return;
        const prevIdx = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1;
        highlightedIndex = prevIdx;
        setActiveOption(listbox, prevIdx, className);
        searchInput.setAttribute('aria-activedescendant', items[prevIdx]?.id ?? '');
        break;
      }
    }
  });

  // Search input: filter on input
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    visibleEntries = q ? filterLocales(allOrderedEntries, q) : allOrderedEntries;
    // Reset highlighted to first match (or -1)
    highlightedIndex = visibleEntries.length > 0 ? 0 : -1;
    renderList(visibleEntries);
    if (highlightedIndex >= 0) {
      const items = Array.from(listbox.querySelectorAll<HTMLElement>('[data-locale]'));
      setActiveOption(listbox, 0, className);
      searchInput.setAttribute('aria-activedescendant', items[0]?.id ?? '');
    }
  });

  // Trigger: open on Enter/Space/ArrowDown
  trigger.addEventListener('keydown', (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        open();
        break;
    }
  });

  // Trigger: toggle on click
  trigger.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  // Listbox: click to select
  listbox.addEventListener('click', (e: MouseEvent) => {
    const item = (e.target as HTMLElement).closest('[data-locale]') as HTMLLIElement | null;
    if (!item) return;
    const code = item.dataset.locale as LocaleCode;
    if (code) selectLocale(code);
  });

  // Listbox: mousedown — prevent blur of searchInput (allows keyboard to stay active)
  listbox.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
  });

  // Click outside to close
  function onDocClick(e: MouseEvent): void {
    if (!root.contains(e.target as Node)) {
      close();
    }
  }

  // External sync: locale changed externally → update trigger + highlighted
  const unsubscribe = i18n.subscribe((locale: LocaleCode) => {
    currentLocale = locale;
    updateTriggerLabel(trigger, locale);
    renderList(visibleEntries);
    highlightedIndex = visibleEntries.findIndex(e => e.code === locale);
    if (highlightedIndex >= 0) {
      setActiveOption(listbox, highlightedIndex, className);
      const items = Array.from(listbox.querySelectorAll<HTMLElement>('[data-locale]'));
      searchInput.setAttribute('aria-activedescendant', items[highlightedIndex]?.id ?? '');
    } else {
      searchInput.setAttribute('aria-activedescendant', '');
    }
  });

  // ─── Mount ─────────────────────────────────────────────────────────────────

  if (mount) mount.appendChild(root);

  document.addEventListener('click', onDocClick);

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  function cleanup(): void {
    unsubscribe();
    document.removeEventListener('click', onDocClick);
    root.remove();
  }

  return { root, cleanup, open, close, focus };
}
