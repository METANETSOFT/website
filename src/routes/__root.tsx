import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getCookie } from '@tanstack/react-start/server'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import appCss from '../styles.css?url'
import { I18nProvider } from '../i18n/react'
import { dictFor } from '../i18n/all'
import { pickLocale, LOCALE_COOKIE } from '../i18n/detect'
import { isRTL, SUPPORTED_LOCALES } from '../i18n/locales'
import type { LocaleCode } from '../i18n/types'

const SITE_URL = 'https://metanetsoft.com'

// SSR locale detection: cookie (explicit switch) → Accept-Language → 'en'.
const detectLocale = createServerFn({ method: 'GET' }).handler((): LocaleCode => {
  const cookie = getCookie(LOCALE_COOKIE)
  const acceptLanguage = getRequestHeader('accept-language')
  return pickLocale(cookie ?? null, acceptLanguage ?? null)
})

function canonicalFor(locale: LocaleCode): string {
  return locale === 'en' ? `${SITE_URL}/` : `${SITE_URL}/?locale=${locale}`
}

export const Route = createRootRoute({
  loader: async () => ({ locale: await detectLocale() }),
  head: ({ loaderData }) => {
    const locale = (loaderData?.locale ?? 'en') as LocaleCode
    const dict = dictFor(locale)
    const title = dict.meta?.pageTitle ?? 'Metanetsoft'
    const description =
      dict.meta?.pageDescription ??
      'Technical consultancy focused on AI, web engineering, mobile apps, scalable architecture, and digital transformation.'
    const url = canonicalFor(locale)
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Metanetsoft' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:locale', content: locale.replace('-', '_') },
        { property: 'og:image', content: `${SITE_URL}/og-image.svg` },
        { property: 'og:image:type', content: 'image/svg+xml' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${SITE_URL}/og-image.svg` },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    }
  },
  shellComponent: RootDocument,
})

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Metanetsoft',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  description:
    'Technical consultancy focused on AI, web engineering, mobile apps, scalable architecture, and digital transformation.',
  knowsAbout: [
    'Artificial Intelligence',
    'Web Development',
    'Mobile Applications',
    'Cloud Architecture',
    'Digital Transformation',
  ],
  areaServed: 'Worldwide',
  sameAs: ['https://github.com/METANETSOFT', 'https://www.linkedin.com/company/122004088/'],
}
const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Metanetsoft',
  url: SITE_URL,
  inLanguage: SUPPORTED_LOCALES,
}

function RootDocument({ children }: { children: ReactNode }) {
  const { locale } = Route.useLoaderData()
  const code = locale as LocaleCode
  return (
    <html lang={code} dir={isRTL(code) ? 'rtl' : 'ltr'}>
      <head>
        <HeadContent />
        <link rel="canonical" href={canonicalFor(code)} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/`} />
        {SUPPORTED_LOCALES.map((c) => (
          <link key={c} rel="alternate" hrefLang={c} href={`${SITE_URL}/?locale=${c}`} />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </head>
      <body>
        <I18nProvider locale={code} dict={dictFor(code)}>
          {children}
        </I18nProvider>
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  )
}
