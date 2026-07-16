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
import { isRTL } from '../i18n/locales'
import type { LocaleCode } from '../i18n/types'

// SSR locale detection: cookie (explicit switch) → Accept-Language → 'en'.
const detectLocale = createServerFn({ method: 'GET' }).handler((): LocaleCode => {
  const cookie = getCookie(LOCALE_COOKIE)
  const acceptLanguage = getRequestHeader('accept-language')
  return pickLocale(cookie ?? null, acceptLanguage ?? null)
})

export const Route = createRootRoute({
  loader: async () => ({ locale: await detectLocale() }),
  head: ({ loaderData }) => {
    const locale = (loaderData?.locale ?? 'en') as LocaleCode
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: 'Metanetsoft — AI, Web, Mobil & Bulut Mühendisliği' },
        {
          name: 'description',
          content:
            'Metanetsoft: AI, web, mobil, bulut mimarisi ve dijital dönüşüm odaklı teknik danışmanlık.',
        },
        { property: 'og:locale', content: locale.replace('-', '_') },
      ],
      links: [{ rel: 'stylesheet', href: appCss }],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const { locale } = Route.useLoaderData()
  const code = locale as LocaleCode
  return (
    <html lang={code} dir={isRTL(code) ? 'rtl' : 'ltr'}>
      <head>
        <HeadContent />
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
