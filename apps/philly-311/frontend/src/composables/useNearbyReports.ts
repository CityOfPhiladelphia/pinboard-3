// ABOUTME: Nearby issues fetched from /private/key/nearby-issues, one page per call
// ABOUTME: with Link-header offsets. Anonymous-ok route, so no auth handle is passed.
import { api311Fetch, type QueryParams } from './api311'
import { parseError } from './useApiError'
import type { Issue, Report } from '@/types/api'

export interface PageParams extends QueryParams {
  lat: number
  lng: number
  radius: number
  limit: number
  offset?: number
}

export interface PageResult {
  reports: Report[]
  nextOffset: number | null
  lastOffset: number | null
}

export function toReport(issues: Issue[]): Report[] {
  const goodIssues = issues.filter(
    (issue) =>
      issue.id &&
      issue.serviceType &&
      issue.latitude &&
      issue.longitude &&
      issue.status &&
      issue.address,
  ) as Required<
    Pick<Issue, 'id' | 'serviceType' | 'latitude' | 'longitude' | 'status' | 'address'>
  >[]

  return goodIssues.map((report) => {
    return {
      lat: report.latitude,
      lng: report.longitude,
      ...report,
    }
  })
}

/**
 * Parse the RFC 5988 `Link` response header, extracting `next` and `last` offsets.
 * Each part is `<url>; rel="x"`. The offset is read from the `offset` query param.
 */
export function parseLinkHeader(header: string | null): {
  next: number | null
  last: number | null
} {
  if (!header) return { next: null, last: null }
  let next: number | null = null
  let last: number | null = null
  for (const part of header.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/)
    if (!match) continue
    const [, urlStr, rel] = match
    if (rel !== 'next' && rel !== 'last') continue
    try {
      const url = new URL(urlStr, 'http://localhost')
      const raw = url.searchParams.get('offset')
      if (raw === null) continue
      const num = parseInt(raw, 10)
      if (isNaN(num)) continue
      if (rel === 'next') next = num
      else last = num
    } catch {
      continue
    }
  }
  return { next, last }
}

export async function fetchPage(params: PageParams): Promise<PageResult> {
  const res = await api311Fetch({ path: '/private/key/nearby-issues', query: params })

  if (!res.ok) throw await parseError(res)

  const link = res.headers.get('Link')
  const { next, last } = parseLinkHeader(link)
  const body = (await res.json()) as { issues?: Issue[] }
  const reports = toReport(body.issues ?? [])
  return { reports, nextOffset: next, lastOffset: last }
}
