// Server-only: GameClipFactory TikTok publisher (Login Kit + Content Posting API, Direct Post).
// One connected owner account; tokens are kept in a server-side JSON file, never sent to the browser.
// Env: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_PANEL_PASSWORD, optional TIKTOK_REDIRECT_URI, TIKTOK_STORE.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const API = 'https://open.tiktokapis.com'

function env(name: string): string {
  const v = (process.env[name] ?? '').trim()
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[0] === v[v.length - 1]) return v.slice(1, -1).trim()
  return v
}

export const redirectUri = () => env('TIKTOK_REDIRECT_URI') || 'https://metanetsoft.com/tiktok/callback'
const storePath = () => env('TIKTOK_STORE') || '/app/data/tiktok-owner.json'

export function isConfigured(): boolean {
  return ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_PANEL_PASSWORD'].every((k) => env(k).length > 0)
}

// --- operator session (panel password -> signed cookie value) ---
function sign(value: string): string {
  return createHmac('sha256', env('TIKTOK_PANEL_PASSWORD') + '|' + env('TIKTOK_CLIENT_SECRET')).update(value).digest('hex')
}
export function sessionToken(): string {
  return sign('gcf-operator')
}
export function checkPassword(pw: string): boolean {
  const a = Buffer.from(pw)
  const b = Buffer.from(env('TIKTOK_PANEL_PASSWORD'))
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b)
}
export function validSession(cookie: string | undefined): boolean {
  if (!cookie || !isConfigured()) return false
  const a = Buffer.from(cookie)
  const b = Buffer.from(sessionToken())
  return a.length === b.length && timingSafeEqual(a, b)
}

// --- OAuth ---
export function newState(): string {
  return randomBytes(16).toString('hex')
}
export function authorizeUrl(state: string): string {
  const q = new URLSearchParams({
    client_key: env('TIKTOK_CLIENT_KEY'),
    scope: 'user.info.basic,video.publish',
    response_type: 'code',
    redirect_uri: redirectUri(),
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${q}`
}

interface Tokens {
  access_token: string
  refresh_token: string
  open_id: string
  scope: string
  expires_at: number
  refresh_expires_at: number
}

async function saveTokens(t: Tokens) {
  await mkdir(dirname(storePath()), { recursive: true })
  await writeFile(storePath(), JSON.stringify(t), { mode: 0o600 })
}
async function loadTokens(): Promise<Tokens | null> {
  try {
    return JSON.parse(await readFile(storePath(), 'utf8')) as Tokens
  } catch {
    return null
  }
}
export async function disconnect() {
  const t = await loadTokens()
  if (t) {
    await fetch(`${API}/v2/oauth/revoke/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_key: env('TIKTOK_CLIENT_KEY'), client_secret: env('TIKTOK_CLIENT_SECRET'), token: t.access_token }),
    }).catch(() => undefined)
  }
  await rm(storePath(), { force: true })
}

async function tokenRequest(params: Record<string, string>): Promise<Tokens> {
  const r = await fetch(`${API}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: env('TIKTOK_CLIENT_KEY'), client_secret: env('TIKTOK_CLIENT_SECRET'), ...params }),
  })
  const j = (await r.json()) as Record<string, any>
  if (!j.access_token) throw new Error(j.error_description || j.error || 'TOKEN_FAILED')
  const now = Date.now()
  const t: Tokens = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    open_id: j.open_id,
    scope: j.scope,
    expires_at: now + Number(j.expires_in) * 1000,
    refresh_expires_at: now + Number(j.refresh_expires_in) * 1000,
  }
  await saveTokens(t)
  return t
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri() })
}

async function accessToken(): Promise<string | null> {
  const t = await loadTokens()
  if (!t) return null
  if (Date.now() < t.expires_at - 60_000) return t.access_token
  if (Date.now() > t.refresh_expires_at) return null
  return (await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token })).access_token
}

async function api(path: string, body?: unknown, method = 'POST') {
  const token = await accessToken()
  if (!token) throw new Error('NOT_CONNECTED')
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const j = (await r.json()) as { data?: any; error?: { code: string; message: string; log_id?: string } }
  if (j.error && j.error.code !== 'ok') throw new Error(`${j.error.code}: ${j.error.message}`)
  return j.data
}

export interface Account {
  displayName: string
  avatarUrl: string
  creatorUsername: string
  creatorNickname: string
  privacyOptions: string[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxDurationSec: number
}

export async function account(): Promise<Account | null> {
  if (!(await loadTokens())) return null
  const user = await api('/v2/user/info/?fields=open_id,avatar_url,display_name', undefined, 'GET')
  const c = await api('/v2/post/publish/creator_info/query/', {})
  return {
    displayName: user.user.display_name,
    avatarUrl: c.creator_avatar_url || user.user.avatar_url,
    creatorUsername: c.creator_username,
    creatorNickname: c.creator_nickname,
    privacyOptions: c.privacy_level_options,
    commentDisabled: c.comment_disabled,
    duetDisabled: c.duet_disabled,
    stitchDisabled: c.stitch_disabled,
    maxDurationSec: c.max_video_post_duration_sec,
  }
}

export interface PostInput {
  title: string
  privacy: string
  allowComment: boolean
  allowDuet: boolean
  allowStitch: boolean
  yourBrand: boolean
  brandedContent: boolean
  video: Buffer
}

export async function publish(p: PostInput): Promise<string> {
  const size = p.video.length
  const data = await api('/v2/post/publish/video/init/', {
    post_info: {
      title: p.title,
      privacy_level: p.privacy,
      disable_comment: !p.allowComment,
      disable_duet: !p.allowDuet,
      disable_stitch: !p.allowStitch,
      brand_organic_toggle: p.yourBrand,
      brand_content_toggle: p.brandedContent,
    },
    source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: size, total_chunk_count: 1 },
  })
  const up = await fetch(data.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size), 'Content-Range': `bytes 0-${size - 1}/${size}` },
    body: new Uint8Array(p.video),
  })
  if (!up.ok) throw new Error(`UPLOAD_FAILED ${up.status}`)
  return data.publish_id as string
}

export async function status(publishId: string) {
  const d = await api('/v2/post/publish/status/fetch/', { publish_id: publishId })
  return { status: d.status as string, failReason: (d.fail_reason as string) || '', postIds: (d.publicaly_available_post_id as string[]) || [] }
}
