/**
 * Client entry — mounts the app, hydrates i18n, wires language switcher.
 *
 * - Reads bootstrap payload from <script id="__i18n_bootstrap__">
 * - Creates i18n with { initialLocale, skipDetect: true } so no client-side detection round-trip
 * - Applies locale to document (lang + dir)
 * - Wires <select id="lang-select-ssr"> to locale changes
 * - Detects shell mode:
 *     exact-shell (Tailwind, root /)  → full-page reload with ?locale=<code>
 *     generic (custom CSS, other routes) → live DOM translation via bindTranslations
 * - Updates document.title on locale change
 */

import { createI18n } from './i18n/i18n';
import { applyLocaleToDocument } from './ui/applyLocaleToDocument';
import { createLanguageSwitcher } from './ui/createLanguageSwitcher';
import { bindTranslations } from './ui/bindTranslations';
import { setLocaleCookie } from './i18n/cookie';
import type { LocaleCode } from './i18n/types';

// ─── Bootstrap from SSR payload ─────────────────────────────────────────────

interface BootstrapPayload {
  locale: LocaleCode;
  skipDetect: boolean;
}

function getBootstrap(): BootstrapPayload | null {
  const el = document.getElementById('__i18n_bootstrap__');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent ?? '') as BootstrapPayload;
  } catch {
    return null;
  }
}

// ─── Shell mode detection ─────────────────────────────────────────────────────

/**
 * Detects whether we're running in the exact shell (Tailwind static preview)
 * or the generic template-based SSR shell.
 *
 * exact-shell: body uses Tailwind bg/text classes (bg-background, text-on-background)
 * generic:     body does not have those Tailwind classes
 */
function isExactShell(): boolean {
  const body = document.body;
  return (
    body.classList.contains('bg-background') ||
    body.classList.contains('bg-surface') ||
    body.classList.contains('text-on-background')
  );
}

function findExactShellLangControl(): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('div'));
  return nodes.find((node) => {
    const text = (node.textContent ?? '').replace(/\s+/g, '');
    return /^(EN|ES|DE|FR|JA|ZH|TW|PT|KO|AR|RU|IT|ID|HI|UR|TR|VI|PL|NL|RO|CS|SV|HU|UK|TH|BN|FA|FIL|MS|EL)keyboard_arrow_down$/.test(text);
  }) ?? null;
}

function mountExactShellSelect(currentLocale: LocaleCode): HTMLSelectElement | null {
  const control = findExactShellLangControl();
  if (!control) return null;

  const existing = control.querySelector<HTMLSelectElement>('#lang-select-ssr');
  if (existing) {
    existing.value = currentLocale;
    return existing;
  }

  const ordered: LocaleCode[] = ['en','es','de','fr','ja','zh-CN','zh-TW','pt-BR','ko','ar','ru','it','id','hi','ur','tr','vi','pl','nl','ro','cs','sv','hu','uk','th','bn','fa','fil','ms','el'];
  const labels: Record<LocaleCode, string> = {
    en: 'EN', es: 'ES', de: 'DE', fr: 'FR', ja: 'JA', 'zh-CN': 'ZH', 'zh-TW': 'TW', 'pt-BR': 'PT', ko: 'KO',
    ar: 'AR', ru: 'RU', it: 'IT', id: 'ID', hi: 'HI', ur: 'UR', tr: 'TR', vi: 'VI', pl: 'PL', nl: 'NL', ro: 'RO', cs: 'CS', sv: 'SV', hu: 'HU', uk: 'UK', th: 'TH', bn: 'BN', fa: 'FA', fil: 'FIL', ms: 'MS', el: 'EL',
  };

  control.style.position = 'relative';
  const select = document.createElement('select');
  select.id = 'lang-select-ssr';
  select.setAttribute('aria-label', 'Language');
  Object.assign(select.style, { position: 'absolute', inset: '0', opacity: '0', cursor: 'pointer', width: '100%', height: '100%' });

  for (const code of ordered) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = labels[code] ?? code;
    if (code === currentLocale) option.selected = true;
    select.appendChild(option);
  }

  control.appendChild(select);
  return select;
}

// ─── Update meta on locale change ─────────────────────────────────────────────

function updateMeta(i18n: ReturnType<typeof createI18n>): void {
  const title = i18n.t('meta.pageTitle');
  const description = i18n.t('meta.pageDescription');
  document.title = title;
  const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDesc) metaDesc.content = description;
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = title;
  const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = description;
  const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.content = title;
  const twitterDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.content = description;
}

// ─── Exact shell locale change: full-page reload with ?locale= ───────────────

function localeNavigate(code: LocaleCode): void {
  // Write localStorage so next SSR detects the choice
  try { localStorage.setItem('metanet.locale', code); } catch { /* blocked */ }
  // Set cookie for SSR bootstrap
  setLocaleCookie(code);
  // Full-page reload with locale query param — SSR will serve correct locale
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('locale', code);
  window.location.href = newUrl.toString();
}

function setupFooterModals(): void {
  const modals = Array.from(document.querySelectorAll<HTMLElement>('[data-modal-id]'));
  if (!modals.length) return;

  const closeAll = () => {
    for (const modal of modals) modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  for (const modal of modals) {
    const modalId = modal.dataset.modalId;
    if (!modalId) continue;

    const openButtons = Array.from(document.querySelectorAll<HTMLElement>(`[data-open-modal="${modalId}"]`));
    const closeButtons = Array.from(modal.querySelectorAll<HTMLElement>('[data-close-modal]'));

    const open = () => {
      closeAll();
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    };

    for (const button of openButtons) button.addEventListener('click', open);
    for (const button of closeButtons) button.addEventListener('click', closeAll);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeAll();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
}

function reportDomI18nGaps(i18n: ReturnType<typeof createI18n>): void {
  const domKeys = Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]'))
    .map((el) => el.dataset.i18n)
    .filter((key): key is string => Boolean(key));
  const extraKeys = ['meta.pageTitle', 'meta.pageDescription', 'nav.contact', 'footer.privacy', 'footer.terms'];
  const uniqueKeys = Array.from(new Set([...domKeys, ...extraKeys]));
  i18n.debugReportMissing(uniqueKeys);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const bootstrap = getBootstrap();

  // Create i18n seeded from SSR — no client-side detection round-trip
  const i18n = createI18n({
    initialLocale: bootstrap?.locale,
    skipDetect: bootstrap?.skipDetect ?? true,
  });

  await i18n.init();

  // Apply lang + dir to <html>
  applyLocaleToDocument(i18n.getLocale());

  // Update page meta on init
  updateMeta(i18n);
  setupFooterModals();
  reportDomI18nGaps(i18n);

  // Wire the SSR-rendered <select> switcher
  const ssrSelect = isExactShell()
    ? mountExactShellSelect(i18n.getLocale())
    : document.getElementById('lang-select-ssr') as HTMLSelectElement | null;

  if (ssrSelect) {
    ssrSelect.addEventListener('change', () => {
      const selected = ssrSelect.value as LocaleCode;
      localeNavigate(selected);
    });
  } else {
    // No SSR select found — mount a fresh switcher in #lang-mount if element exists
    const mount = document.getElementById('lang-mount');
    if (mount) {
      const shellMode = isExactShell();
      const { select } = createLanguageSwitcher({
        i18n,
        onChange: (locale) => {
          localeNavigate(locale);
        },
      });
      mount.appendChild(select);
    }
  }

  // Simple contact form feedback (works in both shells — IDs are set in SSR)
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', (e: SubmitEvent) => {
      e.preventDefault();
      const statusEl = document.getElementById('form-status');
      if (!statusEl) return;
      const name = (document.getElementById('contact-name') as HTMLInputElement)?.value;
      const email = (document.getElementById('contact-email') as HTMLInputElement)?.value;
      const message = (document.getElementById('contact-message') as HTMLTextAreaElement)?.value;
      if (!name || !email || !message) {
        statusEl.textContent = i18n.t('common.error');
        statusEl.style.color = 'red';
        return;
      }
      statusEl.textContent = i18n.t('contact.success');
      statusEl.style.color = 'green';
      form.reset();
    });
  }

  // Expose for potential debugging
  (window as unknown as Record<string, unknown>).__i18n = i18n;
}

init().catch(console.error);
