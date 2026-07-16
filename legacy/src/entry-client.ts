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

interface ContactApiErrorResponse {
  ok?: boolean;
  error?: string;
  errorCode?: string;
  jobId?: string;
  status?: string;
  queuePosition?: number | null;
}

type ToastVariant = 'info' | 'success' | 'error';

interface ToastHandle {
  update: (message: string, variant: ToastVariant, autoHideMs?: number) => void;
  dismiss: () => void;
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
  const navActions = document.querySelector('.exact-shell-nav__actions');
  const nodes = Array.from((navActions ?? document).querySelectorAll<HTMLElement>('div'));
  return nodes.find((node) => {
    const text = (node.textContent ?? '').replace(/\s+/g, '');
    return /^(EN|ES|DE|FR|JA|ZH|TW|PT|KO|AR|RU|IT|ID|HI|UR|TR|VI|PL|NL|RO|CS|SV|HU|UK|TH|BN|FA|FIL|MS|EL)keyboard_arrow_down$/.test(text);
  }) ?? null;
}

function ensureFormStatusElement(form: HTMLFormElement): HTMLElement {
  let statusEl = document.getElementById('form-status');
  if (statusEl) return statusEl;

  statusEl = document.createElement('p');
  statusEl.id = 'form-status';
  statusEl.className = 'form-status text-sm text-on-surface-variant';
  statusEl.setAttribute('aria-live', 'polite');
  form.appendChild(statusEl);
  return statusEl;
}

function ensureToastRoot(): HTMLDivElement {
  let root = document.getElementById('toast-root') as HTMLDivElement | null;
  if (root) return root;

  root = document.createElement('div');
  root.id = 'toast-root';
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-atomic', 'true');
  Object.assign(root.style, {
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    zIndex: '2147483647',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: 'min(92vw, 24rem)',
    pointerEvents: 'none',
  });
  document.body.appendChild(root);
  return root;
}

function showToast(message: string, variant: ToastVariant, autoHideMs = 0): ToastHandle {
  const root = ensureToastRoot();
  const toast = document.createElement('div');
  const accent = document.createElement('span');
  const content = document.createElement('span');
  let timeoutId: number | null = null;

  toast.appendChild(accent);
  toast.appendChild(content);
  root.appendChild(toast);

  const applyVariant = (nextVariant: ToastVariant): void => {
    const accentColor = nextVariant === 'success'
      ? '#63f5b0'
      : nextVariant === 'error'
        ? '#ff7f7f'
        : '#8ff5ff';
    Object.assign(accent.style, {
      width: '0.25rem',
      alignSelf: 'stretch',
      borderRadius: '999px',
      background: accentColor,
      boxShadow: `0 0 18px ${accentColor}`,
      flexShrink: '0',
    });
    toast.style.borderColor = `${accentColor}33`;
  };

  const dismiss = (): void => {
    if (timeoutId != null) window.clearTimeout(timeoutId);
    toast.remove();
  };

  const update = (nextMessage: string, nextVariant: ToastVariant, nextAutoHideMs = 0): void => {
    if (timeoutId != null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }

    content.textContent = nextMessage;
    applyVariant(nextVariant);

    if (nextAutoHideMs > 0) {
      timeoutId = window.setTimeout(dismiss, nextAutoHideMs);
    }
  };

  Object.assign(toast.style, {
    display: 'grid',
    gridTemplateColumns: '0.25rem 1fr',
    gap: '0.85rem',
    alignItems: 'stretch',
    padding: '0.9rem 1rem',
    border: '1px solid rgba(143,245,255,0.2)',
    background: 'rgba(11, 15, 18, 0.96)',
    color: '#f4f7f8',
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.38)',
    backdropFilter: 'blur(18px)',
    borderRadius: '0.95rem',
    pointerEvents: 'auto',
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: '0.92rem',
    lineHeight: '1.45',
  });

  content.style.minWidth = '0';
  update(message, variant, autoHideMs);

  return { update, dismiss };
}

function setFormStatus(statusEl: HTMLElement, message: string, variant: ToastVariant): void {
  statusEl.textContent = message;
  statusEl.style.color = variant === 'error'
    ? '#ff9b9b'
    : variant === 'success'
      ? '#8ff5ff'
      : '#b8c7cf';
}

function buildQueueAcceptedMessage(i18n: ReturnType<typeof createI18n>, queuePosition?: number | null): string {
  if (typeof queuePosition === 'number' && queuePosition > 1) {
    return i18n.t('contact.queuedWithPosition', { position: queuePosition });
  }
  return i18n.t('contact.queued');
}

function resolveContactErrorMessage(i18n: ReturnType<typeof createI18n>, errorCode?: string, fallback?: string): string {
  switch (errorCode) {
    case 'INVALID_PAYLOAD':
      return i18n.t('contact.errorInvalid');
    case 'INVALID_JOB_ID':
    case 'JOB_NOT_FOUND':
      return i18n.t('contact.errorQueueLost');
    case 'RATE_LIMITED':
      return i18n.t('contact.errorRateLimited');
    case 'QUEUE_FULL':
      return i18n.t('contact.errorQueueFull');
    case 'MAIL_CONFIG_MISSING':
      return i18n.t('contact.errorUnavailable');
    case 'MAIL_AUTH_FAILED':
      return i18n.t('contact.errorAuth');
    case 'MAIL_TLS_FAILED':
      return i18n.t('contact.errorTls');
    case 'MAIL_TIMEOUT':
      return i18n.t('contact.errorTimeout');
    case 'MAIL_UNREACHABLE':
      return i18n.t('contact.errorUnavailable');
    case 'MAIL_SEND_FAILED':
      return i18n.t('contact.errorServer');
    default:
      return fallback?.trim() || i18n.t('contact.errorServer');
  }
}

async function pollContactJob(
  i18n: ReturnType<typeof createI18n>,
  jobId: string,
  toast: ToastHandle,
  statusEl: HTMLElement,
  isActive: () => boolean,
): Promise<void> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    if (!isActive()) return;

    try {
      const response = await fetch(`/api/contact-status?jobId=${encodeURIComponent(jobId)}`);
      const body = await response.json().catch(() => null) as ContactApiErrorResponse | null;
      if (!response.ok) {
        const errorMessage = resolveContactErrorMessage(i18n, body?.errorCode, body?.error);
        if (!isActive()) return;
        setFormStatus(statusEl, errorMessage, 'error');
        toast.update(errorMessage, 'error', 6000);
        return;
      }

      if (!body) continue;

      if (body.status === 'queued') {
        const queuedMessage = buildQueueAcceptedMessage(i18n, body.queuePosition);
        if (!isActive()) return;
        setFormStatus(statusEl, queuedMessage, 'info');
        toast.update(queuedMessage, 'info');
        continue;
      }

      if (body.status === 'processing') {
        const processingMessage = i18n.t('contact.processing');
        if (!isActive()) return;
        setFormStatus(statusEl, processingMessage, 'info');
        toast.update(processingMessage, 'info');
        continue;
      }

      if (body.status === 'completed') {
        const successMessage = i18n.t('contact.success');
        if (!isActive()) return;
        setFormStatus(statusEl, successMessage, 'success');
        toast.update(successMessage, 'success', 4200);
        return;
      }

      if (body.status === 'failed') {
        const errorMessage = resolveContactErrorMessage(i18n, body.errorCode, body.error);
        if (!isActive()) return;
        setFormStatus(statusEl, errorMessage, 'error');
        toast.update(errorMessage, 'error', 6000);
        return;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : i18n.t('contact.errorQueueLost');
      if (!isActive()) return;
      setFormStatus(statusEl, errorMessage, 'error');
      toast.update(errorMessage, 'error', 6000);
      return;
    }
  }

  if (!isActive()) return;
  const queuedMessage = i18n.t('contact.processingDelayed');
  setFormStatus(statusEl, queuedMessage, 'info');
  toast.update(queuedMessage, 'info', 6000);
}

function mountFormStatusObserver(form: HTMLFormElement): void {
  const observer = new MutationObserver(() => {
    if (!document.getElementById('form-status')) {
      ensureFormStatusElement(form);
    }
  });

  observer.observe(form, { childList: true });
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
  select.setAttribute('aria-label', 'Select language');
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
    ssrSelect.setAttribute('aria-label', i18n.t('header.languageSelect'));
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
    mountFormStatusObserver(form);
    let activeContactJobId: string | null = null;
    form.addEventListener('submit', async (e: SubmitEvent) => {
      e.preventDefault();
      const statusEl = ensureFormStatusElement(form);
      const name = (document.getElementById('contact-name') as HTMLInputElement)?.value;
      const email = (document.getElementById('contact-email') as HTMLInputElement)?.value;
      const message = (document.getElementById('contact-message') as HTMLTextAreaElement)?.value;
      if (!name || !email || !message) {
        const validationMessage = i18n.t('contact.errorRequired');
        setFormStatus(statusEl, validationMessage, 'error');
        showToast(validationMessage, 'error', 5000);
        return;
      }

      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const pendingMessage = i18n.t('contact.queueing');
      const toast = showToast(pendingMessage, 'info');

      try {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.style.opacity = '0.65';
          submitButton.style.cursor = 'progress';
        }
        setFormStatus(statusEl, pendingMessage, 'info');

        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, message }),
        });

        let responseBody: ContactApiErrorResponse | null = null;
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          responseBody = await response.json().catch(() => null);
        }

        if (!response.ok) {
          throw new Error(resolveContactErrorMessage(i18n, responseBody?.errorCode, responseBody?.error));
        }

        const jobId = responseBody?.jobId;
        const queuedMessage = buildQueueAcceptedMessage(i18n, responseBody?.queuePosition);
        activeContactJobId = jobId ?? null;
        setFormStatus(statusEl, queuedMessage, 'info');
        toast.update(queuedMessage, 'info');
        form.reset();

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.style.opacity = '';
          submitButton.style.cursor = '';
        }

        if (jobId) {
          void pollContactJob(i18n, jobId, toast, statusEl, () => activeContactJobId === jobId);
        } else {
          toast.update(i18n.t('contact.errorQueueLost'), 'error', 6000);
          setFormStatus(statusEl, i18n.t('contact.errorQueueLost'), 'error');
        }
        return;
      } catch (error) {
        console.error('[contact]', error);
        const messageText = error instanceof Error
          ? error.message
          : i18n.t('contact.errorServer');
        setFormStatus(statusEl, messageText, 'error');
        toast.update(messageText, 'error', 6000);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.style.opacity = '';
          submitButton.style.cursor = '';
        }
      }
    });
  }

  // Expose for potential debugging
  (window as unknown as Record<string, unknown>).__i18n = i18n;
}

init().catch(console.error);
