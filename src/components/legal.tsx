import type { ReactNode } from 'react'
import { Nav, Footer } from './site'

export const COMPANY = 'METANETSOFT LTD'
export const COMPANY_NO = '17376914'
export const ADDRESS = '102 Rookery Court, 80 Ruckholt Road, Mainyard Studios Office C05 Suite G1269, London, E10 5FA, United Kingdom'
export const CONTACT = 'info@metanetsoft.com'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <Nav />
      <main className="relative z-10 pt-28 pb-24 px-6 md:px-24">
        <article className="legal max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-3">{title}</h1>
          <p className="mono-label text-xs text-outline mb-10">Last updated: {updated}</p>
          {children}
        </article>
      </main>
      <Footer />
    </div>
  )
}

export function H({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl font-headline font-semibold mt-10 mb-3 text-primary">{children}</h2>
}
export function P({ children }: { children: ReactNode }) {
  return <p className="text-on-surface-variant leading-relaxed mb-4">{children}</p>
}
export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-on-surface-variant leading-relaxed">
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  )
}
export const Mail = () => <a className="text-primary underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
