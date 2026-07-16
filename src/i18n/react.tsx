import { createContext, useContext, type ReactNode } from 'react'
import { en } from './dictionaries/en'
import { isRTL } from './locales'
import type { LocaleCode, TranslationDict } from './types'

interface I18nValue {
  locale: LocaleCode
  dict: TranslationDict
}

const I18nContext = createContext<I18nValue>({ locale: 'en', dict: en })

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: LocaleCode
  dict: TranslationDict
  children: ReactNode
}) {
  return (
    <I18nContext.Provider value={{ locale, dict }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLocale(): LocaleCode {
  return useContext(I18nContext).locale
}

export function useDir(): 'rtl' | 'ltr' {
  return isRTL(useContext(I18nContext).locale) ? 'rtl' : 'ltr'
}

export function useT() {
  const { dict } = useContext(I18nContext)
  return (key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>((o, k) => (o == null ? undefined : (o as any)[k]), dict)
    return typeof value === 'string' ? value : key
  }
}
