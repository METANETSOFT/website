/**
 * Framework-agnostic HTTP types and header accessors.
 * Works with: Node.js plain object headers, Fetch API Headers, and framework adapters.
 * No external runtime dependencies.
 */

// ── Header value container ───────────────────────────────────────────────────

/** Node.js / Express / Fastify style headers object (case-insensitive keys) */
export type NodeHeaders = Record<string, string | string[] | undefined>;

/** Fetch API Headers instance — structurally compatible with global Headers */
export type FetchHeaders = { get(name: string): string | null };

/** Unified headers shape: either Node object or Fetch Headers */
export type HeadersInput = NodeHeaders | FetchHeaders;

// ── Request shape ───────────────────────────────────────────────────────────

export interface Request {
  /** Node-style headers object OR Fetch Headers instance */
  headers: HeadersInput;
  ip?: string;
}

// ── Header accessors ─────────────────────────────────────────────────────────

/**
 * Get a header value from a Node-style headers object.
 * Search is case-insensitive — checks all keys, normalizes to lowercase compare.
 */
export function getHeaderFromNode(headers: NodeHeaders, key: string): string | null {
  const lowerKey = key.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lowerKey) {
      const val = headers[k];
      if (!val) return null;
      return Array.isArray(val) ? val[0] : val;
    }
  }
  return null;
}

/** Get a header value from a Fetch Headers instance */
export function getHeaderFromFetch(headers: FetchHeaders, key: string): string | null {
  return headers.get(key.toLowerCase());
}

/**
 * Get first matching header value from either Node headers object or Fetch Headers.
 * Tries as Node first, falls back to Fetch Headers .get() method.
 */
export function getHeader(headers: HeadersInput, key: string): string | null {
  if (isFetchHeaders(headers)) {
    return getHeaderFromFetch(headers, key);
  }
  return getHeaderFromNode(headers, key);
}

/**
 * Get first present header among multiple keys.
 * Tries as Node first, falls back to Fetch Headers.
 */
export function getHeaderFirst(headers: HeadersInput, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = getHeader(headers, key);
    if (val) return val;
  }
  return null;
}

// ── Type guard ────────────────────────────────────────────────────────────────

function isFetchHeaders(h: HeadersInput): h is FetchHeaders {
  return typeof (h as FetchHeaders).get === 'function';
}

// ── Country extraction ────────────────────────────────────────────────────────

const COUNTRY_HEADER_KEYS = [
  'cf-ipcountry',        // Cloudflare
  'x-vercel-ip-country', // Vercel Edge
  'cloudfront-viewer-country', // AWS CloudFront
  'x-country-code',      // Generic convention
] as const;

export function getCountryFromRequest(req: Request): string | null {
  const headers = req.headers ?? {};
  const countryHeader = getHeaderFirst(headers, ...COUNTRY_HEADER_KEYS);
  if (countryHeader) return countryHeader.toUpperCase().trim();
  return null;
}

// ── Client IP extraction ─────────────────────────────────────────────────────

export function getClientIP(req: Request): string | null {
  const forwarded = getHeader(req.headers, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip ?? null;
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function jsonResponse(data: unknown, status = 200): { status: number; body: string; contentType: string } {
  return {
    status,
    body: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
  };
}