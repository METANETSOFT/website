import { createFileRoute } from '@tanstack/react-router'
import { useT } from '../i18n/react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const t = useT()
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Metanetsoft</h1>
      <p className="mt-4 text-neutral-600">{t('nav.appointment')}</p>
      <p className="mt-2 text-sm text-neutral-400">
        TanStack Start SSR scaffold — P1 OK (i18n engine ported)
      </p>
    </main>
  )
}
