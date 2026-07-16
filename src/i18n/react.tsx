import { createContext, useContext, type ReactNode } from 'react'
import { en } from './dictionaries/en'
import type { TranslationDict } from './types'

// Minimal React binding over the ported (framework-agnostic) i18n engine.
// P2 will extend this with SSR locale detection (cookie/header/geo), the
// 30-locale switcher, RTL <html dir>, and hreflang. For P1 it renders the
// default (en) dictionary so the scaffold builds and dict access is proven.
const I18nContext = createContext<TranslationDict>(en)

export function I18nProvider({
  children,
  dict = en,
}: {
  children: ReactNode
  dict?: TranslationDict
}) {
  return <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>
}

export function useT() {
  const dict = useContext(I18nContext)
  return (key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>((o, k) => (o == null ? undefined : (o as any)[k]), dict)
    return typeof value === 'string' ? value : key
  }
}
