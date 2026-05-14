/**
 * Generic SSR render — all non-root routes.
 * Uses the existing generic HTML template (index.html) and assembles
 * sections from template strings. Keeps all existing generic behavior.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { LocaleCode } from './i18n/types';
import { isRTL } from './i18n/locales';
import { en } from './i18n/dictionaries/en';
import { es } from './i18n/dictionaries/es';
import { de } from './i18n/dictionaries/de';
import { fr } from './i18n/dictionaries/fr';
import { ja } from './i18n/dictionaries/ja';
import { zhCN } from './i18n/dictionaries/zh-CN';
import { zhTW } from './i18n/dictionaries/zh-TW';
import { ptBR } from './i18n/dictionaries/pt-BR';
import { ko } from './i18n/dictionaries/ko';
import { ar } from './i18n/dictionaries/ar';
import { ru } from './i18n/dictionaries/ru';
import { it } from './i18n/dictionaries/it';
import { id } from './i18n/dictionaries/id';
import { hi } from './i18n/dictionaries/hi';
import { ur } from './i18n/dictionaries/ur';
import { tr } from './i18n/dictionaries/tr';
import { vi } from './i18n/dictionaries/vi';
import { pl } from './i18n/dictionaries/pl';
import { nl } from './i18n/dictionaries/nl';
import { ro } from './i18n/dictionaries/ro';
import { cs } from './i18n/dictionaries/cs';
import { sv } from './i18n/dictionaries/sv';
import { hu } from './i18n/dictionaries/hu';
import { uk } from './i18n/dictionaries/uk';
import { th } from './i18n/dictionaries/th';
import { bn } from './i18n/dictionaries/bn';
import { fa } from './i18n/dictionaries/fa';
import { fil } from './i18n/dictionaries/fil';
import { ms } from './i18n/dictionaries/ms';
import { el } from './i18n/dictionaries/el';
import type { TranslationDict } from './i18n/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DICTIONARIES: Record<LocaleCode, TranslationDict> = {
  en, es, de, fr, ja,
  'zh-CN': zhCN, 'zh-TW': zhTW,
  'pt-BR': ptBR, ko, ar, ru,
  it, id, hi, ur, tr, vi, pl, nl,
  ro, cs, sv, hu, uk, th, bn, fa,
  fil, ms, el,
};

// ─── Server-side translation ───────────────────────────────────────────────────

function t(dict: TranslationDict, key: string, params?: Record<string, string | number>): string {
  const parts = key.split('.');
  const resolveValue = (source: TranslationDict): unknown => {
    let val: unknown = source;
    for (const part of parts) {
      if (val && typeof val === 'object' && part in val) {
        val = (val as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }
    return val;
  };

  let val: unknown = resolveValue(dict);
  if (val == null) {
    val = resolveValue(en);
  }
  if (typeof val !== 'string') return key;
  if (!params) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

// ─── HTML escaper ─────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getReferencesNavLabel(locale: LocaleCode): string {
  const map: Partial<Record<LocaleCode, string>> = {
    tr: 'Referanslar',
    en: 'References',
    es: 'Referencias',
    de: 'Referenzen',
    fr: 'Références',
    it: 'Referenze',
    'pt-BR': 'Referências',
  };
  return map[locale] ?? 'References';
}

function renderPrivacyModal(locale: LocaleCode): string {
  const isTr = locale === 'tr';
  const title = isTr ? 'Metanetsoft Gizlilik Politikası' : 'Metanetsoft Privacy Policy';
  const close = isTr ? 'Kapat' : 'Close';
  const intro = isTr
    ? 'Metanetsoft, ziyaretçilerinin ve müşterilerinin gizliliğine önem verir. Bu politika; topladığımız bilgileri, kullanım amaçlarımızı ve koruma yaklaşımımızı genel hatlarıyla açıklar.'
    : 'Metanetsoft values the privacy of its visitors and clients. This policy outlines the information we collect, why we use it, and how we protect it.';
  const bullets = isTr
    ? [
        'İletişim formları üzerinden ad, e-posta adresi ve mesaj içeriği gibi temel iletişim bilgilerini toplayabiliriz.',
        'Toplanan bilgiler yalnızca taleplerinizi yanıtlamak, hizmet süreçlerini yürütmek ve gerekli iş iletişimini sağlamak amacıyla kullanılır.',
        'Bilgileriniz, yasal zorunluluklar dışında üçüncü taraflara satılmaz veya izinsiz paylaşılmaz.',
        'Teknik güvenlik önlemleriyle verilerinizi yetkisiz erişime, kayba ve kötüye kullanıma karşı korumayı hedefleriz.',
        'Tarayıcı tercihleri, çerezler ve dil seçimleri kullanıcı deneyimini iyileştirmek için sınırlı ölçüde saklanabilir.',
        'Gizlilik talepleriniz veya veri erişim başvurularınız için Metanetsoft ile doğrudan iletişime geçebilirsiniz.',
      ]
    : [
        'We may collect basic contact details such as name, email address, and message content through contact forms.',
        'Collected information is used only to respond to requests, operate service processes, and maintain necessary business communication.',
        'Your information is not sold or shared with third parties without consent, except where required by law.',
        'We aim to protect your data against unauthorized access, loss, and misuse through reasonable technical safeguards.',
        'Browser preferences, cookies, and language choices may be stored in a limited way to improve user experience.',
        'For privacy requests or data access inquiries, you may contact Metanetsoft directly.',
      ];

  return `
  <div id="privacy-modal" data-modal-id="privacy" class="hidden fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm px-4 py-8" aria-hidden="true">
    <div class="mx-auto max-w-3xl bg-[#131313] border border-[#2b2b2b] text-[#e5e5e5] max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between px-6 py-5 border-b border-[#2b2b2b]">
        <h2 class="text-xl font-bold font-headline tracking-tight">${title}</h2>
        <button type="button" data-close-modal class="text-xs uppercase tracking-[0.2em] text-[#8ff5ff]">${close}</button>
      </div>
      <div class="px-6 py-6 space-y-5 text-sm leading-7 text-[#c8c8c8]">
        <p>${intro}</p>
        <ul class="space-y-3 list-disc pl-5">
          ${bullets.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>`;
}

function renderTermsModal(locale: LocaleCode): string {
  const isTr = locale === 'tr';
  const title = isTr ? 'Metanetsoft Hizmet Şartları' : 'Metanetsoft Terms of Service';
  const close = isTr ? 'Kapat' : 'Close';
  const intro = isTr
    ? 'Bu web sitesini ve Metanetsoft tarafından sunulan içerik, iletişim ve danışmanlık hizmetlerini kullanan herkes aşağıdaki genel hizmet şartlarını kabul etmiş sayılır.'
    : 'By using this website and any content, communication, or consulting services provided by Metanetsoft, you agree to the following general terms of service.';
  const bullets = isTr
    ? [
        'Sitede yer alan tüm içerikler yalnızca bilgilendirme amacı taşır ve önceden haber verilmeksizin güncellenebilir.',
        'Metanetsoft ile kurulan ilk iletişim, otomatik olarak bağlayıcı bir hizmet sözleşmesi oluşturmaz.',
        'Teslim kapsamı, süre, ücretlendirme ve sorumluluklar ancak yazılı teklif, sözleşme veya onaylı iş planı ile kesinleşir.',
        'Kullanıcılar siteyi hukuka aykırı, yanıltıcı, zararlı veya sistemlere zarar verecek şekilde kullanmamayı kabul eder.',
        'Metanetsoft, hizmet sürekliliği için makul çaba gösterir; ancak kesintisiz erişim, hatasız çalışma veya belirli sonuç garantisi vermez.',
        'İş birliği sürecinde paylaşılan ticari ve teknik bilgiler ilgili sözleşme hükümlerine, gizlilik yükümlülüklerine ve yürürlükteki mevzuata tabidir.',
      ]
    : [
        'All content on this site is provided for informational purposes only and may be updated without prior notice.',
        'Initial contact with Metanetsoft does not automatically create a binding service agreement.',
        'Scope, timing, pricing, and responsibilities become binding only through written proposals, agreements, or approved work plans.',
        'Users agree not to use the site in any unlawful, misleading, harmful, or system-disruptive manner.',
        'Metanetsoft makes reasonable efforts to maintain service continuity but does not guarantee uninterrupted access, error-free operation, or specific outcomes.',
        'Commercial and technical information shared during collaboration is governed by applicable agreements, confidentiality obligations, and relevant law.',
      ];

  return `
  <div id="terms-modal" data-modal-id="terms" class="hidden fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm px-4 py-8" aria-hidden="true">
    <div class="mx-auto max-w-3xl bg-[#131313] border border-[#2b2b2b] text-[#e5e5e5] max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between px-6 py-5 border-b border-[#2b2b2b]">
        <h2 class="text-xl font-bold font-headline tracking-tight">${title}</h2>
        <button type="button" data-close-modal class="text-xs uppercase tracking-[0.2em] text-[#8ff5ff]">${close}</button>
      </div>
      <div class="px-6 py-6 space-y-5 text-sm leading-7 text-[#c8c8c8]">
        <p>${intro}</p>
        <ul class="space-y-3 list-disc pl-5">
          ${bullets.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>`;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function renderNav(dict: TranslationDict, locale: LocaleCode, switcherHtml: string): string {
  return `
  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <div class="site-nav__inner">
      <a class="site-nav__brand" href="/">METANETSOFT</a>
      <div class="site-nav__links">
        <a href="#services" data-i18n="nav.services">${t(dict, 'nav.services')}</a>
        <a href="#references">${getReferencesNavLabel(locale)}</a>
        <a href="#vision">${locale === 'tr' ? 'Vizyon' : 'Vision'}</a>
        <a href="#mission">${locale === 'tr' ? 'Misyon' : 'Mission'}</a>
      </div>
      <div class="site-nav__actions">
        <div class="site-nav__lang">${switcherHtml}</div>
        <a class="site-nav__cta" href="#contact" data-i18n="nav.contact">${t(dict, 'nav.contact')}</a>
      </div>
    </div>
  </nav>`;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function renderHero(dict: TranslationDict): string {
  return `
  <section class="hero" aria-label="Hero">
    <div class="hero__bg-grid"></div>
    <div class="hero__content">
      <div class="hero__status-line">
        <span class="hero__status-accent"></span>
        <span class="hero__status-text" data-i18n="hero.statusLabel">${t(dict, 'hero.statusLabel')}</span>
      </div>
      <h1 class="hero__headline">
        ${t(dict, 'hero.titleLine1')}<span class="hero__headline-dim"> ${t(dict, 'hero.titleLine2')}</span>
      </h1>
      <p class="hero__subtitle" data-i18n="hero.subtitle">${t(dict, 'hero.subtitle')}</p>
      <a class="hero__cta" href="#portfolio" data-i18n="hero.ctaPrimary">${t(dict, 'hero.ctaPrimary')}</a>
    </div>
    <div class="hero__ornament" aria-hidden="true">
      <span class="hero__ornament-item" data-i18n="hero.latLabel">${t(dict, 'hero.latLabel')}</span>
      <span class="hero__ornament-item" data-i18n="hero.lonLabel">${t(dict, 'hero.lonLabel')}</span>
      <span class="hero__ornament-item hero__ornament-item--pulse">
        <span class="hero__ornament-dot"></span>
        <span data-i18n="hero.uptimeLabel">${t(dict, 'hero.uptimeLabel')}</span>
      </span>
    </div>
  </section>`;
}

// ─── About ───────────────────────────────────────────────────────────────────

function renderAbout(dict: TranslationDict): string {
  return `
  <section class="about" id="about" aria-labelledby="about-title">
    <div class="about__grid">
      <div class="about__header">
        <span class="section-index" data-i18n="about.sectionIndex">${t(dict, 'about.sectionIndex')}</span>
        <h2 id="about-title" data-i18n="about.title">${t(dict, 'about.title')}</h2>
      </div>
      <div class="about__body">
        <p class="lead" data-i18n="about.bodyLead">${t(dict, 'about.bodyLead')}</p>
        <p data-i18n="about.bodyExtended">${t(dict, 'about.bodyExtended')}</p>
        <div class="metrics-row">
          <div class="metric-block metric-block--bordered">
            <span class="metric-block__value" data-i18n="about.uptimeValue">${t(dict, 'about.uptimeValue')}</span>
            <span class="metric-block__label" data-i18n="about.uptimeMetric">${t(dict, 'about.uptimeMetric')}</span>
          </div>
          <div class="metric-block metric-block--bordered">
            <span class="metric-block__value" data-i18n="about.latencyValue">${t(dict, 'about.latencyValue')}</span>
            <span class="metric-block__label" data-i18n="about.latencyMetric">${t(dict, 'about.latencyMetric')}</span>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// ─── Services ──────────────────────────────────────────────────────────────

function renderServices(dict: TranslationDict): string {
  return `
  <section class="services" id="services" aria-labelledby="services-title">
    <div class="services__header">
      <div>
        <span class="section-index" data-i18n="services.sectionIndex">${t(dict, 'services.sectionIndex')}</span>
        <h2 id="services-title" data-i18n="services.title">${t(dict, 'services.title')}</h2>
      </div>
      <p class="services__lead" data-i18n="services.lead">${t(dict, 'services.lead')}</p>
    </div>
    <div class="capability-cards">
      <div class="capability-card">
        <span class="capability-card__icon" aria-hidden="true">◈</span>
        <h3 data-i18n="services.ai.title">${t(dict, 'services.ai.title')}</h3>
        <p data-i18n="services.ai.description">${t(dict, 'services.ai.description')}</p>
        <ul class="capability-card__list">
          <li data-i18n="services.ai.bullet1">${t(dict, 'services.ai.bullet1')}</li>
          <li data-i18n="services.ai.bullet2">${t(dict, 'services.ai.bullet2')}</li>
        </ul>
      </div>
      <div class="capability-card">
        <span class="capability-card__icon" aria-hidden="true">▸</span>
        <h3 data-i18n="services.web.title">${t(dict, 'services.web.title')}</h3>
        <p data-i18n="services.web.description">${t(dict, 'services.web.description')}</p>
        <ul class="capability-card__list">
          <li data-i18n="services.web.bullet1">${t(dict, 'services.web.bullet1')}</li>
          <li data-i18n="services.web.bullet2">${t(dict, 'services.web.bullet2')}</li>
        </ul>
      </div>
      <div class="capability-card">
        <span class="capability-card__icon" aria-hidden="true">◎</span>
        <h3 data-i18n="services.mobile.title">${t(dict, 'services.mobile.title')}</h3>
        <p data-i18n="services.mobile.description">${t(dict, 'services.mobile.description')}</p>
        <ul class="capability-card__list">
          <li data-i18n="services.mobile.bullet1">${t(dict, 'services.mobile.bullet1')}</li>
          <li data-i18n="services.mobile.bullet2">${t(dict, 'services.mobile.bullet2')}</li>
        </ul>
      </div>
    </div>
  </section>`;
}

// ─── Portfolio ─────────────────────────────────────────────────────────────

function renderPortfolio(dict: TranslationDict): string {
  return `
  <section class="portfolio" id="portfolio" aria-labelledby="portfolio-title">
    <span class="section-index" data-i18n="portfolio.sectionIndex">${t(dict, 'portfolio.sectionIndex')}</span>
    <div class="project-list">
      <article class="project-item">
        <div class="project-item__image" aria-hidden="true">
          <img src="/images/neuralcoredesign.png" alt="Neural Core Redesign Visual" class="project-item__img" />
        </div>
        <div class="project-item__content">
          <span class="project-item__meta" data-i18n="portfolio.neuralCore.meta">${t(dict, 'portfolio.neuralCore.meta')}</span>
          <h3 data-i18n="portfolio.neuralCore.title">${t(dict, 'portfolio.neuralCore.title')}</h3>
          <p data-i18n="portfolio.neuralCore.description">${t(dict, 'portfolio.neuralCore.description')}</p>
        </div>
      </article>
      <article class="project-item project-item--reverse">
        <div class="project-item__image" aria-hidden="true">
          <img src="/images/skyscaleproject.png" alt="Sky Scale Project Visual" class="project-item__img" />
        </div>
        <div class="project-item__content">
          <span class="project-item__meta" data-i18n="portfolio.skyScale.meta">${t(dict, 'portfolio.skyScale.meta')}</span>
          <h3 data-i18n="portfolio.skyScale.title">${t(dict, 'portfolio.skyScale.title')}</h3>
          <p data-i18n="portfolio.skyScale.description">${t(dict, 'portfolio.skyScale.description')}</p>
        </div>
      </article>
      <article class="project-item">
        <div class="project-item__image" aria-hidden="true">
          <img src="/images/enterpriseflux.png" alt="Enterprise Flux Visual" class="project-item__img" />
        </div>
        <div class="project-item__content">
          <span class="project-item__meta" data-i18n="portfolio.enterpriseFlux.meta">${t(dict, 'portfolio.enterpriseFlux.meta')}</span>
          <h3 data-i18n="portfolio.enterpriseFlux.title">${t(dict, 'portfolio.enterpriseFlux.title')}</h3>
          <p data-i18n="portfolio.enterpriseFlux.description">${t(dict, 'portfolio.enterpriseFlux.description')}</p>
        </div>
      </article>
    </div>
    <div class="partners" id="references">
      <span class="partners__label" data-i18n="partners.label">${t(dict, 'partners.label')}</span>
      <div class="partners__logos">
        <span>NEXUS AI</span>
        <span>GLOBAL FREIGHT</span>
        <span>FINCORP</span>
        <span>QUANTUM SYSTEMS</span>
        <span>CYBERNETICS</span>
      </div>
    </div>
  </section>`;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

function renderContact(dict: TranslationDict): string {
  return `
  <section class="contact-section" id="contact" aria-labelledby="contact-title">
    <div class="contact-section__inner">
      <span class="section-index" data-i18n="contact.sectionIndex">${t(dict, 'contact.sectionIndex')}</span>
      <h2 id="contact-title" data-i18n="contact.title">${t(dict, 'contact.title')}</h2>
      <p class="contact-section__lead" data-i18n="contact.lead">${t(dict, 'contact.lead')}</p>
      <form class="contact-section__form" id="contact-form" novalidate>
        <div class="form-row">
          <div class="form-field">
            <label for="contact-name" data-i18n="contact.nameLabel">${t(dict, 'contact.nameLabel')}</label>
            <input type="text" id="contact-name" name="name" required data-i18n="contact.nameLabel" data-i18n-attr="placeholder" />
          </div>
          <div class="form-field">
            <label for="contact-email" data-i18n="contact.emailLabel">${t(dict, 'contact.emailLabel')}</label>
            <input type="email" id="contact-email" name="email" required data-i18n="contact.emailLabel" data-i18n-attr="placeholder" />
          </div>
        </div>
        <div class="form-field">
          <label for="contact-message" data-i18n="contact.messageLabel">${t(dict, 'contact.messageLabel')}</label>
          <textarea id="contact-message" name="message" rows="5" required data-i18n="contact.messageLabel" data-i18n-attr="placeholder"></textarea>
        </div>
        <button type="submit" class="btn btn--primary" data-i18n="contact.submit">${t(dict, 'contact.submit')}</button>
        <p class="form-status" id="form-status" aria-live="polite"></p>
      </form>
    </div>
  </section>`;
}

// ─── Vision & Mission ────────────────────────────────────────────────────────

function renderVisionMission(dict: TranslationDict): string {
  return `
  <section class="vision-mission" aria-labelledby="vm-title">
    <div class="vision-mission__grid">
      <div class="vision-mission__header">
        <span class="section-index" data-i18n="vm.sectionIndex">${t(dict, 'vm.sectionIndex')}</span>
        <h2 id="vm-title" data-i18n="vm.title">${t(dict, 'vm.title')}</h2>
      </div>
      <div class="vision-mission__cards">
        <div class="vm-card" id="vision">
          <span class="vm-card__label" data-i18n="vm.visionLabel">${t(dict, 'vm.visionLabel')}</span>
          <p data-i18n="vm.visionBody">${t(dict, 'vm.visionBody')}</p>
        </div>
        <div class="vm-card" id="mission">
          <span class="vm-card__label" data-i18n="vm.missionLabel">${t(dict, 'vm.missionLabel')}</span>
          <p data-i18n="vm.missionBody">${t(dict, 'vm.missionBody')}</p>
        </div>
      </div>
    </div>
  </section>`;
}

// ─── CTA ────────────────────────────────────────────────────────────────────

function renderCTA(dict: TranslationDict): string {
  return `
  <section class="cta-section" aria-labelledby="cta-title">
    <h2 id="cta-title" data-i18n="cta.title">${t(dict, 'cta.title')}</h2>
    <p data-i18n="cta.body">${t(dict, 'cta.body')}</p>
  </section>`;
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function renderFooter(dict: TranslationDict): string {
  return `
  <footer class="site-footer" role="contentinfo">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <span class="site-footer__brand-name">METANETSOFT</span>
        <p data-i18n="footer.tagline">${t(dict, 'footer.tagline')}</p>
      </div>
      <div class="site-footer__links">
        <button type="button" data-open-modal="privacy" data-i18n="footer.privacy">${t(dict, 'footer.privacy')}</button>
        <button type="button" data-open-modal="terms" data-i18n="footer.terms">${t(dict, 'footer.terms')}</button>
        <a href="https://www.linkedin.com/company/metanetsoft/about/?viewAsMember=true" target="_blank" rel="noreferrer" data-i18n="footer.linkedin">${t(dict, 'footer.linkedin')}</a>
        <a href="https://github.com/METANETSOFT" target="_blank" rel="noreferrer" data-i18n="footer.github">${t(dict, 'footer.github')}</a>
      </div>
    </div>
  </footer>`;
}

// ─── Language switcher SSR ───────────────────────────────────────────────────

function buildSwitcherOptionsHtml(locale: LocaleCode): string {
  const ordered: LocaleCode[] = [
    'en', 'es', 'de', 'fr', 'ja', 'zh-CN', 'zh-TW', 'pt-BR', 'ko',
    'ar', 'ru', 'it', 'id',
    'hi', 'ur', 'tr', 'vi',
    'pl', 'nl', 'ro', 'cs', 'sv', 'hu', 'uk',
    'th', 'bn', 'fa', 'fil', 'ms', 'el',
  ];
  const displayNames: Record<string, string> = {
    en: 'EN', es: 'ES', de: 'DE', fr: 'FR', ja: 'JA',
    'zh-CN': 'ZH', 'zh-TW': 'TW', 'pt-BR': 'PT', ko: 'KO',
    ar: 'AR', ru: 'RU', it: 'IT', id: 'ID',
    hi: 'HI', ur: 'UR', tr: 'TR', vi: 'VI',
    pl: 'PL', nl: 'NL', ro: 'RO', cs: 'CS', sv: 'SV', hu: 'HU', uk: 'UK',
    th: 'TH', bn: 'BN', fa: 'FA', fil: 'FIL', ms: 'MS', el: 'EL',
  };
  let html = `<select id="lang-select-ssr" aria-label="Language">`;
  for (const code of ordered) {
    const selected = code === locale ? ' selected' : '';
    html += `<option value="${code}"${selected}>${displayNames[code] ?? code}</option>`;
  }
  html += '</select>';
  return html;
}

// ─── JSON-LD ────────────────────────────────────────────────────────────────

function buildJsonLd(url: string, description: string): string {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Metanetsoft',
    url,
    description,
    knowsAbout: ['Artificial Intelligence', 'Web Development', 'Mobile Applications', 'Cloud Architecture', 'Digital Transformation'],
    areaServed: 'Worldwide',
  };
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Metanetsoft Technical Consultancy',
    description,
    provider: { '@type': 'Organization', name: 'Metanetsoft' },
    serviceType: 'Technical Consulting',
  };
  return `<script type="application/ld+json">${JSON.stringify(org)}</script>\n<script type="application/ld+json">${JSON.stringify(service)}</script>`;
}

// ─── Main generic render ─────────────────────────────────────────────────────

export async function render(
  _urlPath: string,
  locale: LocaleCode,
  _headers: Record<string, string | string[] | undefined>,
): Promise<{ html: string; status: number }> {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES['en'];
  const dir = isRTL(locale) ? 'rtl' : 'ltr';
  const canonicalUrl = process.env.SITE_URL ?? 'https://metanetsoft.com';

  const switcherHtml = buildSwitcherOptionsHtml(locale);
  const title = t(dict, 'meta.pageTitle');
  const description = t(dict, 'meta.pageDescription');
  const ogLocale = locale.replace('-', '_');
  const bootstrap = JSON.stringify({ locale, skipDetect: true });
  const robotsMeta = 'index, follow';

  const appHtml = `
<a id="skip-to-main" href="#main-content">Skip to main content</a>
${renderNav(dict, locale, switcherHtml)}
<main id="main-content" tabindex="-1">
  ${renderHero(dict)}
  ${renderAbout(dict)}
  ${renderServices(dict)}
  ${renderPortfolio(dict)}
  ${renderContact(dict)}
  ${renderVisionMission(dict)}
  ${renderCTA(dict)}
</main>
${renderFooter(dict)}
${renderPrivacyModal(locale)}
${renderTermsModal(locale)}`;

  let html = readFileSync(join(ROOT, 'index.html'), 'utf-8');
  html = html
    .replace('{{locale}}', escHtml(locale))
    .replace('{{dir}}', escHtml(dir))
    .replace('{{title}}', escHtml(title))
    .replace('{{description}}', escHtml(description))
    .replace('{{canonicalUrl}}', escHtml(canonicalUrl))
    .replace('{{robotsMeta}}', escHtml(robotsMeta))
    .replace('{{ogLocale}}', escHtml(ogLocale))
    .replace('<!-- app-html -->', appHtml)
    .replace('<!--bootstrap-->', bootstrap)
    .replace('<!-- head-extra -->', buildJsonLd(canonicalUrl, description));

  return { html, status: 200 };
}
