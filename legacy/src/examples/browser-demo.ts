/**
 * Browser demo — wires i18n init, document locale, language switcher, and DOM bindings.
 * Run in a browser script after the i18n bundle is loaded.
 *
 * Usage in HTML:
 *   <div id="lang-switcher-mount"></div>
 *   <p data-i18n="home.welcome"></p>
 *   <script type="module">
 *     import { browserDemo } from './browser-demo.js';
 *     browserDemo().then(cleanup => {
 *       // cleanup() called on unmount if needed
 *     });
 *   </script>
 */

import { createI18n } from '../i18n';
import { applyLocaleToDocument } from '../ui/applyLocaleToDocument';
import { createLanguageSwitcher } from '../ui/createLanguageSwitcher';
import { bindTranslations } from '../ui/bindTranslations';
import type { LocaleCode } from '../i18n/types';

export interface BrowserDemoOptions {
  /** DOM id where the <select> switcher will be mounted */
  mountId?: string;
  /** CSS class added to the generated switcher */
  switcherClassName?: string;
  /** Seed locale from SSR/bootstrap — skips auto-detection when provided */
  initialLocale?: LocaleCode;
}

/**
 * Initialize i18n, apply document locale, mount switcher, bind [data-i18n] elements.
 * Returns cleanup function to remove all listeners and observers.
 */
export async function browserDemo(opts: BrowserDemoOptions = {}): Promise<() => void> {
  const { mountId = 'lang-switcher-mount', switcherClassName = 'lang-switcher', initialLocale } = opts;

  // 1. Create i18n — seed with SSR locale if available, skip IP detection
  const i18n = createI18n({ initialLocale, skipDetect: !!initialLocale });
  await i18n.init();
  const locale = i18n.getLocale();

  // 2. Apply lang/dir to <html> element
  applyLocaleToDocument(locale);

  // 3. Mount language switcher if mount point exists
  const mount = document.getElementById(mountId);
  let switcherCleanup = () => {};

  if (mount) {
    const { select, cleanup } = createLanguageSwitcher({
      i18n,
      currentLocale: locale,
      className: switcherClassName,
      onChange: (newLocale: LocaleCode) => {
        applyLocaleToDocument(newLocale);
      },
    });
    select.setAttribute('data-i18n-switcher', 'true');
    mount.appendChild(select);
    switcherCleanup = cleanup;
  }

  // 4. Bind all [data-i18n] elements in document.body
  const bindCleanup = bindTranslations(i18n);

  // 5. Return combined cleanup
  return () => {
    switcherCleanup();
    bindCleanup();
  };
}

export { createI18n } from '../i18n';
export { applyLocaleToDocument } from '../ui/applyLocaleToDocument';