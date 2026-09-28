import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, H, P, UL, Mail, COMPANY, COMPANY_NO, ADDRESS } from '../components/legal'

export const Route = createFileRoute('/terms')({
  head: () => ({ meta: [{ title: 'Terms of Service | METANETSOFT' }] }),
  component: Terms,
})

function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="28 September 2026">
      <P>These terms apply to metanetsoft.com and to the applications operated by {COMPANY} (company no. {COMPANY_NO}), including FoxCs2App and Metanetsoft Video &amp; Ads Manager.</P>
      <H>1. The service</H>
      <P>Our applications are internal tools used by {COMPANY} to publish content to, and manage comments, messages and insights for, social media accounts that {COMPANY} owns. They are not offered to the public.</P>
      <H>2. Acceptable use</H>
      <UL items={[
        'Only authorised staff of METANETSOFT LTD may use the applications.',
        'The applications may only be connected to accounts owned or operated by METANETSOFT LTD.',
        'Use must follow the terms and policies of each connected platform (Meta, TikTok, Google/YouTube).',
      ]} />
      <H>3. Content</H>
      <P>We publish our own original content. Gameplay footage is used in line with the game publisher's content guidelines, and third-party music is used only under a valid licence with the required attribution.</P>
      <H>4. Website</H>
      <P>The website is provided "as is". We may change or withdraw it at any time. To the extent permitted by law, we are not liable for indirect losses arising from its use.</P>
      <H>5. Privacy</H>
      <P>See our <a className="text-primary underline" href="/privacy">Privacy Policy</a>.</P>
      <H>6. Law</H>
      <P>These terms are governed by the laws of England and Wales.</P>
      <H>7. Contact</H>
      <P>{COMPANY}, {ADDRESS}. Email: <Mail />.</P>
    </LegalPage>
  )
}
