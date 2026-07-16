import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/react'
import { getConsentDoc } from '../i18n/consent'

export function ConsentModal({
  open,
  onAccept,
  onClose,
}: {
  open: boolean
  onAccept: () => void
  onClose: () => void
}) {
  const locale = useLocale()
  const doc = getConsentDoc(locale)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    if (!open) return
    setAtBottom(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-container border border-outline/30 max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline/20">
          <h3 className="text-2xl font-headline font-bold">{doc.title}</h3>
        </div>
        <div
          className="p-6 overflow-y-auto grow"
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setAtBottom(true)
          }}
        >
          <p className="text-on-surface-variant mb-6 leading-relaxed">{doc.intro}</p>
          {doc.sections.map((s, i) => (
            <div key={i} className="mb-5">
              <h4 className="font-headline font-bold mb-1">{s.heading}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{s.body}</p>
            </div>
          ))}
          <p className="mt-6 text-sm font-medium text-on-surface border-l-2 border-tertiary pl-4 leading-relaxed">
            {doc.statement}
          </p>
        </div>
        <div className="p-6 border-t border-outline/20 flex flex-col md:flex-row gap-3 md:justify-end items-stretch">
          {!atBottom && (
            <span className="mono-label text-xs text-outline self-center">{doc.scrollHint}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-outline/40 text-on-surface-variant font-headline uppercase tracking-widest hover:bg-surface-container-high transition-colors"
          >
            {doc.decline}
          </button>
          <button
            type="button"
            disabled={!atBottom}
            onClick={onAccept}
            className="px-6 py-3 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dim transition-colors"
          >
            {doc.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
