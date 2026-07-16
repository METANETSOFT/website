// All 30 dictionaries mapped by locale code (ported from legacy entry-server).
import type { LocaleCode, TranslationDict } from './types'
import { en } from './dictionaries/en'
import { es } from './dictionaries/es'
import { de } from './dictionaries/de'
import { fr } from './dictionaries/fr'
import { ja } from './dictionaries/ja'
import { zhCN } from './dictionaries/zh-CN'
import { zhTW } from './dictionaries/zh-TW'
import { ptBR } from './dictionaries/pt-BR'
import { ko } from './dictionaries/ko'
import { ar } from './dictionaries/ar'
import { ru } from './dictionaries/ru'
import { it } from './dictionaries/it'
import { id } from './dictionaries/id'
import { hi } from './dictionaries/hi'
import { ur } from './dictionaries/ur'
import { tr } from './dictionaries/tr'
import { vi } from './dictionaries/vi'
import { pl } from './dictionaries/pl'
import { nl } from './dictionaries/nl'
import { ro } from './dictionaries/ro'
import { cs } from './dictionaries/cs'
import { sv } from './dictionaries/sv'
import { hu } from './dictionaries/hu'
import { uk } from './dictionaries/uk'
import { th } from './dictionaries/th'
import { bn } from './dictionaries/bn'
import { fa } from './dictionaries/fa'
import { fil } from './dictionaries/fil'
import { ms } from './dictionaries/ms'
import { el } from './dictionaries/el'

export const DICTIONARIES: Record<LocaleCode, TranslationDict> = {
  en, es, de, fr, ja,
  'zh-CN': zhCN, 'zh-TW': zhTW,
  'pt-BR': ptBR, ko, ar, ru,
  it, id, hi, ur, tr, vi, pl, nl,
  ro, cs, sv, hu, uk, th, bn, fa,
  fil, ms, el,
}

export function dictFor(locale: LocaleCode): TranslationDict {
  return DICTIONARIES[locale] ?? en
}
