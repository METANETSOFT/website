import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, P } from '../../components/legal'

export const Route = createFileRoute('/tiktok/callback')({
  head: () => ({ meta: [{ title: 'TikTok authorization | METANETSOFT' }, { name: 'robots', content: 'noindex' }] }),
  component: Callback,
})

function Callback() {
  return (
    <LegalPage title="TikTok authorization" updated="28 September 2026">
      <P>This page receives the authorization response for METANETSOFT's internal TikTok integration. If you just authorized the app, you can close this page. METANETSOFT staff: copy the full URL from the address bar and send it to the operator; the code expires in 10 minutes.</P>
    </LegalPage>
  )
}
