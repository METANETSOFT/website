import type { I18nInstance } from '../i18n/types';

function isBrowser(): boolean {
  return typeof document !== 'undefined';
}

const TEXT_ATTRS = new Set(['textContent', 'innerText', 'text']);

interface BindingEntry {
  el: Element;
  key: string;
  attr: string;
  params: Record<string, string | number>;
}

function parseParamAttr(name: string): string | null {
  const m = name.match(/^data-i18n-param-(.+)$/);
  return m ? m[1] : null;
}

function collectBindings(container: Element): BindingEntry[] {
  const bindings: BindingEntry[] = [];
  const elements = container.querySelectorAll('[data-i18n]');

  for (const el of elements) {
    const key = (el as HTMLElement).dataset.i18n ?? '';
    if (!key) continue;

    const params: Record<string, string | number> = {};
    for (const attr of el.attributes) {
      const paramName = parseParamAttr(attr.name);
      if (paramName) params[paramName] = attr.value;
    }

    const attrName = (el as HTMLElement).dataset.i18nAttr;
    const attr = attrName ?? 'textContent';

    bindings.push({ el, key, attr, params });
  }

  return bindings;
}

function applyBinding(binding: BindingEntry, i18n: I18nInstance): void {
  const translated = Object.keys(binding.params).length > 0
    ? i18n.t(binding.key, binding.params)
    : i18n.t(binding.key);

  if (TEXT_ATTRS.has(binding.attr)) {
    (binding.el as HTMLElement).textContent = translated;
  } else {
    binding.el.setAttribute(binding.attr, translated);
  }
}

/**
 * Scan the DOM for [data-i18n] elements, apply translations, and keep them updated.
 *
 * - Re-scans the full current DOM on every locale change (handles dynamic elements cleanly)
 * - MutationObserver catches additions/removals between locale changes
 * - Suppresses observer callbacks during translation to prevent re-entry thrash
 *
 * @param i18n      I18nInstance from createI18n()
 * @param container Parent element to scan. Defaults to document.body.
 * @returns         Cleanup function — call to remove listeners and disconnect observer.
 */
export function bindTranslations(
  i18n: I18nInstance,
  container?: Element,
): () => void {
  if (!isBrowser()) return () => {};

  const root = container ?? document.body;
  let suppressObserver = false;

  function applyAll(): void {
    suppressObserver = true;
    try {
      const bindings = collectBindings(root);
      for (const binding of bindings) {
        applyBinding(binding, i18n);
      }
    } finally {
      suppressObserver = false;
    }
  }

  // Initial pass
  applyAll();

  // Re-apply on locale change
  const unsubscribe = i18n.subscribe(() => {
    applyAll();
  });

  // Observe for dynamic element changes between locale switches
  const observer = new MutationObserver(() => {
    if (suppressObserver) return;
    // Newly added elements get translations immediately
    const bindings = collectBindings(root);
    for (const b of bindings) {
      applyBinding(b, i18n);
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  return () => {
    unsubscribe();
    observer.disconnect();
  };
}

/**
 * Apply translations to a single element.
 * Useful for elements created programmatically after the initial bindTranslations pass.
 */
export function bindElement(el: HTMLElement, i18n: I18nInstance): void {
  const key = el.dataset.i18n;
  if (!key) return;

  const params: Record<string, string | number> = {};
  for (const attr of el.attributes) {
    const paramName = parseParamAttr(attr.name);
    if (paramName) params[paramName] = attr.value;
  }

  const attrName = el.dataset.i18nAttr;
  const translated = Object.keys(params).length > 0 ? i18n.t(key, params) : i18n.t(key);

  if (attrName && !TEXT_ATTRS.has(attrName)) {
    el.setAttribute(attrName, translated);
  } else {
    el.textContent = translated;
  }
}