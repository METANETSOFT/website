import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { LegalPage, P } from '../../components/legal'

// GameClipFactory OAuth callback. When the operator started the login from /tiktok/publisher the
// state cookie matches and the code is exchanged server-side; otherwise the page only explains itself.
const finishLogin = createServerFn({ method: 'GET' })
  .validator((d: { code?: string; state?: string; error?: string }) => d)
  .handler(async ({ data }) => {
    if (!data.code) return { done: false, error: data.error ?? '' }
    const { getCookie, deleteCookie } = await import('@tanstack/react-start/server')
    const t = await import('../../server/tiktok')
    if (!t.validSession(getCookie('gcf_session'))) return { done: false, error: '' }
    if (!data.state || data.state !== getCookie('gcf_oauth_state')) return { done: false, error: 'state_mismatch' }
    deleteCookie('gcf_oauth_state', { path: '/' })
    try {
      await t.exchangeCode(data.code)
      return { done: true, error: '' }
    } catch (e) {
      return { done: false, error: (e as Error).message }
    }
  })

export const Route = createFileRoute('/tiktok/callback')({
  head: () => ({ meta: [{ title: 'TikTok authorization | METANETSOFT' }, { name: 'robots', content: 'noindex' }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === 'string' ? s.code : undefined,
    state: typeof s.state === 'string' ? s.state : undefined,
    error: typeof s.error === 'string' ? s.error : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const r = await finishLogin({ data: deps })
    if (r.done) throw redirect({ to: '/tiktok/publisher' })
    return r
  },
  component: Callback,
})

function Callback() {
  const { error } = Route.useLoaderData()
  return (
    <LegalPage title="TikTok authorization" updated="18 November 2026">
      {error ? (
        <P>TikTok authorization could not be completed ({error}). Return to the GameClipFactory publisher and try again.</P>
      ) : (
        <P>This page receives the authorization response for METANETSOFT's GameClipFactory TikTok integration. If you just authorized the app, you can close this page.</P>
      )}
    </LegalPage>
  )
}
