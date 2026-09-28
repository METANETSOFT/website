import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, H, P, UL, Mail, COMPANY } from '../components/legal'

export const Route = createFileRoute('/data-deletion')({
  head: () => ({ meta: [{ title: 'Data Deletion Instructions | METANETSOFT' }] }),
  component: DataDeletion,
})

function DataDeletion() {
  return (
    <LegalPage title="User Data Deletion" updated="28 September 2026">
      <P>You can ask {COMPANY} to delete any data we hold about you that we received through Facebook, Instagram, Threads, TikTok or YouTube (for example a comment or message you sent to one of our accounts).</P>
      <H>How to request deletion</H>
      <UL items={[
        <>Email <Mail /> with the subject "Data deletion request".</>,
        'Include your username on the platform (e.g. your Instagram, Facebook, Threads or TikTok handle) and, if you can, a link to the comment or message.',
        'We confirm receipt within 7 days and complete the deletion within 30 days, then confirm by email.',
      ]} />
      <H>Removing app access</H>
      <P>If you connected an account to one of our apps, you can also remove it yourself:</P>
      <UL items={[
        'Facebook: Settings & privacy > Settings > Apps and websites > select the app > Remove.',
        'Instagram: Settings > Website permissions > Apps and websites > Remove.',
        'Threads: Settings > Account > Website permissions > Remove.',
        'TikTok: Settings and privacy > Security > Manage app permissions > Remove access.',
      ]} />
      <P>When access is removed, we delete the stored access tokens and related account data within 30 days.</P>
    </LegalPage>
  )
}
