import { useRef, useState } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { useT } from '../i18n/react'
import { ConsentModal } from './consent-modal'

// Server fn: receives the CV FormData, emails it to the pool inbox.
// nodemailer (server-only) is dynamically imported so it never hits the client bundle.
const submitCv = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('INVALID_FORM')
    return data
  })
  .handler(async ({ data }) => {
    const file = data.get('cv')
    const fullName = String(data.get('fullName') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const note = String(data.get('note') ?? '').trim()
    const consent = String(data.get('consent') ?? '')
    if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: 'NO_FILE' }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false as const, error: 'BAD_EMAIL' }
    if (consent !== 'yes') return { ok: false as const, error: 'NO_CONSENT' }
    const bytes = Buffer.from(await file.arrayBuffer())
    try {
      const { sendCvEmail } = await import('../server/cv-mail')
      await sendCvEmail({ fullName, email, note, fileName: file.name, contentType: file.type, bytes })
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, error: (e as Error)?.message || 'SEND_FAILED' }
    }
  })

export function CvSection() {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function send(form: HTMLFormElement) {
    const fd = new FormData(form)
    fd.set('consent', 'yes') // reaching here means the consent modal was accepted
    setBusy(true)
    try {
      const res = await submitCv({ data: fd })
      if (res.ok) {
        toast.success(t('cv.success'))
        form.reset()
      } else {
        toast.error(t('cv.error'))
      }
    } catch {
      toast.error(t('cv.error'))
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!e.currentTarget.reportValidity()) return
    // Gate every submission behind the explicit-consent modal.
    setModalOpen(true)
  }

  return (
    <section id="cv" className="py-32 px-8 md:px-24 bg-surface-container-low border-t border-outline/10">
      <div className="max-w-4xl mx-auto">
        <h3 className="mono-label text-tertiary mb-4">{t('cv.sectionIndex')}</h3>
        <h2 className="text-5xl font-headline font-bold tracking-tighter mb-6">{t('cv.title')}</h2>
        <p className="text-xl text-on-surface-variant leading-relaxed font-light mb-2">{t('cv.intro')}</p>
        <p className="text-sm text-outline mb-10">{t('cv.poolNote')}</p>

        <form ref={formRef} className="space-y-6" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs mono-label text-outline mb-2">{t('cv.nameLabel')}</label>
              <input name="fullName" className="w-full bg-surface border border-outline/30 p-4 text-on-surface focus:outline-none focus:border-tertiary transition-colors" placeholder={t('cv.namePlaceholder')} type="text" />
            </div>
            <div>
              <label className="block text-xs mono-label text-outline mb-2">{t('cv.emailLabel')}</label>
              <input name="email" required className="w-full bg-surface border border-outline/30 p-4 text-on-surface focus:outline-none focus:border-tertiary transition-colors" placeholder={t('cv.emailPlaceholder')} type="email" />
            </div>
          </div>
          <div>
            <label className="block text-xs mono-label text-outline mb-2">{t('cv.noteLabel')}</label>
            <textarea name="note" className="w-full bg-surface border border-outline/30 p-4 text-on-surface focus:outline-none focus:border-tertiary transition-colors h-24" placeholder={t('cv.notePlaceholder')} />
          </div>
          <div>
            <label className="block text-xs mono-label text-outline mb-2">{t('cv.fileLabel')}</label>
            <input name="cv" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full text-sm text-on-surface-variant file:mr-4 file:border-0 file:bg-primary file:text-on-primary file:font-headline file:font-bold file:uppercase file:tracking-widest file:px-6 file:py-3 file:cursor-pointer border border-outline/30 bg-surface p-3" type="file" />
            <p className="text-xs text-outline mt-2">{t('cv.fileHint')}</p>
          </div>
          <p className="text-sm text-on-surface-variant">{t('cv.consent')}</p>
          <button disabled={busy} className="px-10 py-5 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 w-full md:w-auto disabled:opacity-40 disabled:cursor-not-allowed" type="submit">
            {busy ? t('cv.sending') : t('cv.submit')}
          </button>
        </form>
      </div>

      <ConsentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAccept={() => {
          setModalOpen(false)
          if (formRef.current) void send(formRef.current)
        }}
      />
    </section>
  )
}
