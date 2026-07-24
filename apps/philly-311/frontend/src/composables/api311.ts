// ABOUTME: Shared URL + header + fetch wrappers for the 311 API. Concatenates
// ABOUTME: path onto VITE_API_BASE_URL so stage paths (".../test", ".../dev")
// ABOUTME: and the same-origin dev proxy ("/api") both round-trip cleanly.
import type { useAuth } from '@phila/sso-vue'

export type Auth = ReturnType<typeof useAuth>

export type QueryParams = Record<string, string | number | boolean | undefined>

function apiKey(): string {
  return import.meta.env.VITE_API_KEY ?? ''
}

/**
 * Concatenate a base URL with a path and query.
 *
 * Joins by string concatenation rather than `new URL(path, base)` so the
 * base's path segment (e.g. `/test`, `/ais-autocomplete/v1`) is preserved.
 * URL would treat a leading-slash path as absolute against the origin and
 * strip those segments.
 */
export function buildUrl(base: string, path: string, query?: QueryParams): string {
  const b = (base ?? '').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  const url = b + p
  if (!query) return url
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) sp.set(k, String(v))
  }
  const qs = sp.toString()
  return qs ? `${url}?${qs}` : url
}

function api311Url(path: string, query?: QueryParams): string {
  return buildUrl(import.meta.env.VITE_API_BASE_URL ?? '', path, query)
}

interface Api311HeaderOptions {
  auth?: Auth
  forceRefreshToken?: boolean
  contentType?: string
}

async function api311Headers(opts: Api311HeaderOptions = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'x-api-key': apiKey() }
  if (opts.contentType) headers['content-type'] = opts.contentType
  if (opts.auth?.isAuthenticated.value) {
    const token = await opts.auth.acquireToken({ forceRefresh: opts.forceRefreshToken ?? false })
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export interface Api311FetchOptions {
  path: string
  method?: string
  body?: unknown
  query?: QueryParams
  signal?: AbortSignal
  /**
   * Optional auth handle. When provided AND the user is signed in, attaches
   * a Bearer token and retries once with a refreshed token on a 401. Omit
   * for anonymous-ok routes.
   */
  auth?: Auth
}

/**
 * Low-level 311-API fetch. Builds the URL + headers + body, sends the
 * request, and (when auth was sent) retries once on 401 with a refreshed
 * token. Returns the raw `Response`; the caller decides whether non-2xx
 * is an error in their domain.
 */
export async function api311Fetch(opts: Api311FetchOptions): Promise<Response> {
  const send = async (
    forceRefreshToken: boolean,
  ): Promise<{ response: Response; sentBearer: boolean }> => {
    const headers = await api311Headers({
      auth: opts.auth,
      forceRefreshToken,
      contentType: opts.body !== undefined ? 'application/json' : undefined,
    })
    const sentBearer = 'Authorization' in headers
    const response = await fetch(api311Url(opts.path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    })
    return { response, sentBearer }
  }

  const { response: firstResponse, sentBearer } = await send(false)
  let response = firstResponse
  if (response.status === 401 && sentBearer) {
    ;({ response } = await send(true))
  }
  return response
}
