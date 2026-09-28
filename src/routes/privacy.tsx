import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, H, P, UL, Mail, COMPANY, COMPANY_NO, ADDRESS } from '../components/legal'

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy Policy | METANETSOFT' }, { name: 'description', content: 'How METANETSOFT LTD collects, uses and protects data, including data from Meta (Facebook, Instagram, Threads), TikTok and Google/YouTube APIs.' }] }),
  component: Privacy,
})

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="28 September 2026">
      <P>This policy explains how {COMPANY} (company no. {COMPANY_NO}, registered in England and Wales, {ADDRESS}) ("we", "us") handles personal data on metanetsoft.com and in our internal applications, including FoxCs2App and Metanetsoft Video &amp; Ads Manager.</P>

      <H>1. Who this applies to</H>
      <P>Our applications are internal tools. They connect only to social media accounts owned and operated by {COMPANY} (for example our Counter-Strike 2 highlight channels on Facebook, Instagram, Threads, TikTok and YouTube). We do not offer these tools to the public and we do not log in third-party users.</P>

      <H>2. Data we process</H>
      <UL items={[
        <>Account data for our own accounts: account ID, username, display name, profile picture, access tokens.</>,
        <>Content we publish: videos, images, captions and their publishing status.</>,
        <>Engagement on our own posts: public comments and replies (commenter username, comment text, time), and direct messages sent to our accounts.</>,
        <>Aggregated insights for our own accounts: views, reach, likes, shares, follower counts.</>,
        <>Website: messages you send through our contact form (name, email, message) and standard server logs.</>,
      ]} />

      <H>3. How we use it</H>
      <UL items={[
        'Publishing our own videos and posts to our own accounts.',
        'Reading, replying to, hiding or deleting comments on our own posts, and replying to messages sent to us.',
        'Internal reporting on how our content performs, and deciding which content to promote with ads.',
        'Answering enquiries sent through the website.',
      ]} />
      <P>We do not sell personal data, we do not use it for profiling or advertising targeting, and we do not share it with third parties except the service providers that host our systems (hosted in the EU/UK) and where the law requires it.</P>

      <H>4. Platform data (Meta, TikTok, Google)</H>
      <P>Data received through the Facebook, Instagram, Threads, TikTok and YouTube APIs is used only for the purposes above and in line with each platform's developer terms. Google user data obtained through YouTube API Services is handled in accordance with the Google API Services User Data Policy; see also the <a className="text-primary underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>.</P>

      <H>5. Retention</H>
      <P>Access tokens are kept until they expire or the connection is removed. Comments, messages and insights are kept for up to 24 months for reporting, then deleted. Contact form messages are kept for up to 24 months.</P>

      <H>6. Security</H>
      <P>Tokens and secrets are stored encrypted in access-controlled systems. Only authorised staff of {COMPANY} can access them.</P>

      <H>7. Your rights</H>
      <P>Under UK GDPR you can ask for access to, correction of, or deletion of your personal data, and you can object to processing. To request deletion of any data we hold about you (for example a comment you left on one of our posts), follow the steps on our <a className="text-primary underline" href="/data-deletion">Data Deletion</a> page or email <Mail />. You can also complain to the UK Information Commissioner's Office (ico.org.uk).</P>

      <H>8. Contact</H>
      <P>{COMPANY}, {ADDRESS}. Email: <Mail />.</P>
    </LegalPage>
  )
}
