import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Nav, Footer } from '../../components/site'

// GameClipFactory publisher: the channel owner connects their TikTok account and posts finished
// CS2 replay clips through the Content Posting API (Direct Post). Server logic: ../../server/tiktok.ts
const SESSION = 'gcf_session'

async function authed() {
  const { getCookie } = await import('@tanstack/react-start/server')
  const t = await import('../../server/tiktok')
  return t.validSession(getCookie(SESSION))
}

const loadPanel = createServerFn({ method: 'GET' }).handler(async () => {
  const t = await import('../../server/tiktok')
  if (!t.isConfigured()) return { state: 'unconfigured' as const }
  if (!(await authed())) return { state: 'locked' as const }
  try {
    const account = await t.account()
    return account ? { state: 'connected' as const, account } : { state: 'disconnected' as const }
  } catch (e) {
    return { state: 'disconnected' as const, error: (e as Error).message }
  }
})

const unlock = createServerFn({ method: 'POST' })
  .validator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const { setCookie } = await import('@tanstack/react-start/server')
    const t = await import('../../server/tiktok')
    if (!t.checkPassword(data.password)) return { ok: false }
    setCookie(SESSION, t.sessionToken(), { httpOnly: true, secure: true, sameSite: 'lax', path: '/tiktok', maxAge: 60 * 60 * 12 })
    return { ok: true }
  })

const startLogin = createServerFn({ method: 'POST' }).handler(async () => {
  if (!(await authed())) throw new Error('LOCKED')
  const { setCookie } = await import('@tanstack/react-start/server')
  const t = await import('../../server/tiktok')
  const state = t.newState()
  setCookie('gcf_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/tiktok', maxAge: 600 })
  return { url: t.authorizeUrl(state) }
})

const logout = createServerFn({ method: 'POST' }).handler(async () => {
  if (!(await authed())) throw new Error('LOCKED')
  const t = await import('../../server/tiktok')
  await t.disconnect()
  return { ok: true }
})

const postVideo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('INVALID_FORM')
    return data
  })
  .handler(async ({ data }) => {
    if (!(await authed())) return { ok: false as const, error: 'LOCKED' }
    const file = data.get('video')
    if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: 'NO_VIDEO' }
    const privacy = String(data.get('privacy') ?? '')
    if (!privacy) return { ok: false as const, error: 'NO_PRIVACY' }
    const t = await import('../../server/tiktok')
    try {
      const publishId = await t.publish({
        title: String(data.get('title') ?? '').slice(0, 2200),
        privacy,
        allowComment: data.get('allowComment') === 'yes',
        allowDuet: data.get('allowDuet') === 'yes',
        allowStitch: data.get('allowStitch') === 'yes',
        yourBrand: data.get('yourBrand') === 'yes',
        brandedContent: data.get('brandedContent') === 'yes',
        video: Buffer.from(await file.arrayBuffer()),
      })
      return { ok: true as const, publishId }
    } catch (e) {
      return { ok: false as const, error: (e as Error).message }
    }
  })

const fetchStatus = createServerFn({ method: 'POST' })
  .validator((d: { publishId: string }) => d)
  .handler(async ({ data }) => {
    if (!(await authed())) throw new Error('LOCKED')
    const t = await import('../../server/tiktok')
    return t.status(data.publishId)
  })

export const Route = createFileRoute('/tiktok/publisher')({
  head: () => ({ meta: [{ title: 'GameClipFactory — TikTok publisher | METANETSOFT' }, { name: 'robots', content: 'noindex' }] }),
  loader: () => loadPanel(),
  component: Publisher,
})

const PRIVACY_LABEL: Record<string, string> = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me',
}

const card = 'rounded-2xl border border-outline-variant/40 bg-surface-container/60 p-6'
const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed'

function Publisher() {
  const data = Route.useLoaderData()
  return (
    <div className="bg-background text-on-background min-h-screen">
      <Nav />
      <main className="relative z-10 pt-28 pb-24 px-6 md:px-24">
        <div className="max-w-4xl mx-auto">
          <p className="mono-label text-xs text-outline mb-2">GameClipFactory</p>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-3">TikTok publisher</h1>
          <p className="text-on-surface-variant mb-10">Post finished CS2 replay highlights from the CS2 Fox Replay pipeline to your own TikTok account.</p>
          {data.state === 'unconfigured' && <div className={card}>TikTok integration is not configured on this server.</div>}
          {data.state === 'locked' && <Unlock />}
          {data.state === 'disconnected' && <Connect error={'error' in data ? data.error : undefined} />}
          {data.state === 'connected' && <Composer account={data.account} />}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Unlock() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  return (
    <form
      className={card + ' max-w-md'}
      onSubmit={async (e) => {
        e.preventDefault()
        const r = await unlock({ data: { password: pw } })
        if (r.ok) window.location.reload()
        else setErr(true)
      }}
    >
      <label className="block font-semibold mb-2">Operator password</label>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-xl bg-surface px-4 py-3 mb-3 border border-outline-variant/40" />
      {err && <p className="text-error text-sm mb-3">Wrong password.</p>}
      <button className={btn + ' bg-primary text-on-primary'}>Open panel</button>
    </form>
  )
}

function Connect({ error }: { error?: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className={card + ' max-w-md'}>
      <h2 className="text-xl font-semibold mb-2">Connect your TikTok account</h2>
      <p className="text-on-surface-variant mb-5 text-sm">
        GameClipFactory asks for your basic profile (to show which account you are posting to) and permission to publish videos you choose here.
      </p>
      {error && error !== 'NOT_CONNECTED' && <p className="text-error text-sm mb-3">{error}</p>}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const r = await startLogin()
          window.location.href = r.url
        }}
        className={btn + ' bg-black text-white w-full'}
      >
        <TikTokMark /> Continue with TikTok
      </button>
    </div>
  )
}

type Account = Extract<Awaited<ReturnType<typeof loadPanel>>, { state: 'connected' }>['account']

function Composer({ account }: { account: Account }) {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [title, setTitle] = useState('')
  const [privacy, setPrivacy] = useState('')
  const [allowComment, setAllowComment] = useState(false)
  const [allowDuet, setAllowDuet] = useState(false)
  const [allowStitch, setAllowStitch] = useState(false)
  const [disclose, setDisclose] = useState(false)
  const [yourBrand, setYourBrand] = useState(false)
  const [branded, setBranded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [publishId, setPublishId] = useState('')
  const [state, setState] = useState<{ status: string; failReason: string } | null>(null)
  const [error, setError] = useState('')
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (!publishId) return
    const poll = async () => {
      try {
        const s = await fetchStatus({ data: { publishId } })
        setState(s)
        if (s.status === 'PUBLISH_COMPLETE' || s.status === 'FAILED') clearInterval(timer.current)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    poll()
    timer.current = setInterval(poll, 4000)
    return () => clearInterval(timer.current)
  }, [publishId])

  const tooLong = duration > 0 && duration > account.maxDurationSec
  const brandedPrivate = branded && privacy === 'SELF_ONLY'
  const discloseIncomplete = disclose && !yourBrand && !branded
  const canPost = !!file && !!privacy && !tooLong && !brandedPrivate && !discloseIncomplete && !busy && !publishId
  const declaration = branded
    ? "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation."
    : "By posting, you agree to TikTok's Music Usage Confirmation."

  return (
    <div className="grid gap-6">
      <div className={card + ' flex items-center gap-4'}>
        {account.avatarUrl && <img src={account.avatarUrl} alt="" className="w-14 h-14 rounded-full" />}
        <div className="flex-1">
          <p className="text-sm text-outline">Posting to</p>
          <p className="text-lg font-semibold">{account.creatorNickname || account.displayName}</p>
          {account.creatorUsername && <p className="text-sm text-on-surface-variant">@{account.creatorUsername}</p>}
        </div>
        <button
          className={btn + ' border border-outline-variant/60 text-sm py-2'}
          onClick={async () => {
            await logout()
            window.location.reload()
          }}
        >
          Disconnect
        </button>
      </div>

      <div className={card + ' grid md:grid-cols-[260px_1fr] gap-6'}>
        <div>
          <label className="block font-semibold mb-2">Clip</label>
          <input
            type="file"
            accept="video/mp4,video/quicktime"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setDuration(0)
            }}
            className="text-sm mb-3"
          />
          <div className="aspect-[9/16] rounded-xl bg-black overflow-hidden flex items-center justify-center">
            {preview ? (
              <video src={preview} controls playsInline className="w-full h-full object-contain" onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} />
            ) : (
              <span className="text-outline text-sm">Preview</span>
            )}
          </div>
          {tooLong && <p className="text-error text-sm mt-2">This clip is longer than the {account.maxDurationSec}s your account allows.</p>}
        </div>

        <div className="grid gap-5 content-start">
          <div>
            <label className="block font-semibold mb-2">Caption</label>
            <textarea value={title} maxLength={2200} onChange={(e) => setTitle(e.target.value)} rows={4} className="w-full rounded-xl bg-surface px-4 py-3 border border-outline-variant/40" placeholder="Insane 1v4 clutch on Mirage #cs2 #counterstrike" />
          </div>

          <div>
            <label className="block font-semibold mb-2">Who can view this video</label>
            <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="w-full rounded-xl bg-surface px-4 py-3 border border-outline-variant/40">
              <option value="" disabled>
                Select privacy
              </option>
              {account.privacyOptions.map((o) => (
                <option key={o} value={o} disabled={branded && o === 'SELF_ONLY'}>
                  {PRIVACY_LABEL[o] ?? o}
                  {branded && o === 'SELF_ONLY' ? ' (not available for branded content)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-semibold mb-2">Allow users to</p>
            <div className="flex flex-wrap gap-5 text-sm">
              <Check label="Comment" checked={allowComment} disabled={account.commentDisabled} onChange={setAllowComment} />
              <Check label="Duet" checked={allowDuet} disabled={account.duetDisabled} onChange={setAllowDuet} />
              <Check label="Stitch" checked={allowStitch} disabled={account.stitchDisabled} onChange={setAllowStitch} />
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/40 p-4">
            <Check label="Disclose video content" checked={disclose} onChange={(v) => { setDisclose(v); if (!v) { setYourBrand(false); setBranded(false) } }} />
            <p className="text-xs text-on-surface-variant mt-1">Turn on to disclose that this video promotes goods or services in exchange for something of value.</p>
            {disclose && (
              <div className="mt-3 grid gap-2 text-sm">
                <Check label="Your brand — you are promoting yourself or your own business" checked={yourBrand} onChange={setYourBrand} />
                <Check label="Branded content — you are promoting another brand or a third party" checked={branded} onChange={setBranded} />
                {(yourBrand || branded) && (
                  <p className="text-xs text-on-surface-variant">Your photo/video will be labeled as "{branded ? 'Paid partnership' : 'Promotional content'}".</p>
                )}
                {discloseIncomplete && <p className="text-xs text-error">You need to indicate if your content promotes yourself, a third party, or both.</p>}
                {brandedPrivate && <p className="text-xs text-error">Branded content visibility cannot be set to private.</p>}
              </div>
            )}
          </div>

          <p className="text-xs text-on-surface-variant">{declaration}</p>

          <button
            disabled={!canPost}
            className={btn + ' bg-primary text-on-primary'}
            onClick={async () => {
              if (!file) return
              setBusy(true)
              setError('')
              const fd = new FormData()
              fd.set('video', file)
              fd.set('title', title)
              fd.set('privacy', privacy)
              if (allowComment) fd.set('allowComment', 'yes')
              if (allowDuet) fd.set('allowDuet', 'yes')
              if (allowStitch) fd.set('allowStitch', 'yes')
              if (yourBrand) fd.set('yourBrand', 'yes')
              if (branded) fd.set('brandedContent', 'yes')
              const r = await postVideo({ data: fd })
              setBusy(false)
              if (r.ok) setPublishId(r.publishId)
              else setError(r.error)
            }}
          >
            {busy ? 'Uploading…' : 'Post to TikTok'}
          </button>

          {error && <p className="text-error text-sm">{error}</p>}
          {publishId && (
            <div className="rounded-xl bg-surface p-4 text-sm">
              <p className="font-semibold">
                {state?.status === 'PUBLISH_COMPLETE' ? 'Posted to TikTok ✓' : state?.status === 'FAILED' ? 'Publishing failed' : 'Processing on TikTok…'}
              </p>
              <p className="text-on-surface-variant">Status: {state?.status ?? 'SUBMITTED'}{state?.failReason ? ` — ${state.failReason}` : ''}</p>
              <p className="text-on-surface-variant text-xs mt-1">It may take a few minutes for the video to appear on your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Check({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={'inline-flex items-center gap-2 ' + (disabled ? 'opacity-40' : 'cursor-pointer')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-current" />
      {label}
    </label>
  )
}

function TikTokMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  )
}
