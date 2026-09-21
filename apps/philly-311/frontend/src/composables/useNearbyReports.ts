// ABOUTME: Nearby issues fetched from /private/key/nearby-issues, one page per call
// ABOUTME: with Link-header offsets. Anonymous-ok route, so no auth handle is passed.
import type { Service } from '@/types/app'
import { api311Fetch } from './api311'
import { parseError } from './useApiError'

export interface Report {
  /** 8-digit Salesforce CaseNumber. */
  id: string
  lat: number
  lng: number
  serviceType: Service
  status: string
  address: string
  mediaUrl?: string
  description?: string
  createdAt?: string
  slaDate?: string
  department?: string
}

export interface PageParams {
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

export interface ApiNearbyIssue {
  id: string
  caseNumber: string
  serviceType: Service
  department: string | null
  status: string
  address: string
  description: string
  mediaUrl: string | null
  latitude: number
  longitude: number
  createdAt: string
  updatedAt: string
  slaDate?: string | null
  childCount: number
}

export function toReport(i: ApiNearbyIssue): Report {
  return {
    id: i.id,
    lat: i.latitude,
    lng: i.longitude,
    serviceType: i.serviceType,
    status: i.status,
    address: i.address,
    mediaUrl: i.mediaUrl ?? undefined,
    description: i.description,
    createdAt: i.createdAt,
    slaDate: i.slaDate ?? undefined,
    department: i.department ?? undefined,
  }
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
  const query: Record<string, string | number | undefined> = {
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    limit: params.limit,
  }
  if (params.offset !== undefined) query.offset = params.offset

  const res = await api311Fetch({ path: '/private/key/nearby-issues', query })

  if (!res.ok) {
    throw await parseError(res)
  }

  const link = res.headers.get('Link')
  const { next, last } = parseLinkHeader(link)
  const body = (await res.json()) as { issues?: ApiNearbyIssue[] }
  const reports = (body.issues ?? []).map(toReport)
  return { reports, nextOffset: next, lastOffset: last }
}
