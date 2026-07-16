import { useState } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { useT } from '../i18n/react'

const submitContact = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('INVALID_FORM')
    return data
  })
  .handler(async ({ data }) => {
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !message) return { ok: false as const }
    try {
      const { sendContactMessage } = await import('../server/cv-mail')
      await sendContactMessage({ name, email, message })
      return { ok: true as const }
    } catch {
      return { ok: false as const }
    }
  })

export function ContactForm() {
  const t = useT()
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setBusy(true)
    try {
      const res = await submitContact({ data: new FormData(form) })
      if (res.ok) {
        toast.success(t('contact.success'))
        form.reset()
      } else {
        toast.error(t('contact.error'))
      }
    } catch {
      toast.error(t('contact.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs mono-label text-outline mb-2">{t('contact.nameLabel')}</label>
            <input name="name" required className="w-full bg-surface-container-low border border-outline/30 p-4 text-on-surface focus:outline-none focus:border-tertiary transition-colors" placeholder={t('contact.namePlaceholder')} type="text" />
          </div>
          <div>
            <label className="block text-xs mono-label text-outline mb-2">{t('contact.emailLabel')}</label>
            <input name="email" required className="w-full bg-surface-container-low border border-outline/30 p-4 text-on-surface focus:outline-none focus:border-tertiary transition-colors" placeholder={t('contact.emailPlaceholder')} type="email" />
          </div>
        </div>
        <div>
          <label className="block text-xs mono-label text-outline mb-2">{t('contact.messageLabel')}</label>
          <textarea name="message" required className="w-full bg-surface-container-low border border-outline/30 p-4 text-on-surface focus:outline-none focus:border-tertiary transition-colors h-32" placeholder={t('contact.messagePlaceholder')} />
        </div>
        <div className="flex flex-col items-stretch gap-4 md:items-start">
          <button disabled={busy} className="px-10 py-5 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 w-full md:w-auto disabled:opacity-40 disabled:cursor-not-allowed" type="submit">
            {busy ? t('contact.sending') : t('contact.submit')}
          </button>
          <a className="px-10 py-5 border border-primary text-primary font-headline font-bold uppercase tracking-widest hover:bg-surface-container transition-all active:scale-95 w-full md:w-auto text-center" href="https://cal.eu/metanetsoft/30min" target="_blank" rel="noreferrer">
            {t('contact.requestMeeting')}
          </a>
        </div>
      </form>
      <p className="text-sm text-outline mt-8 opacity-50">{t('contact.emailAlt')}</p>
    </>
  )
}
