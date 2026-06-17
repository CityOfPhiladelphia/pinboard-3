// ABOUTME: Nearby issues fetched from /private/key/nearby-issues. The API talks
// ABOUTME: to the same Salesforce instance as /issues/:id so case-number IDs
// ABOUTME: round-trip cleanly when a user clicks a marker for the detail page.
// ABOUTME: Anonymous-ok route, so no auth handle is passed to api311Fetch.
import { ref, type Ref } from 'vue'
import { api311Fetch } from './api311'
import { parseError } from './useApiError'
import { DEFAULT_RADIUS } from '@/utils/geoDefaults'

export interface Report {
  /** 8-digit Salesforce CaseNumber. Use this as the path param on /issues/:id. */
  id: string
  caseNumber: string
  lat: number
  lng: number
  serviceType: string
  status: string
  address: string
  department?: string
  mediaUrl?: string
  description?: string
  distance: number
  createdAt?: string
  updatedAt?: string
}

export interface Region {
  lat: number
  lng: number
  /** Maps to API's `radius` in meters. */
  radius?: number
}

export interface PageParams {
  lat: number
  lng: number
  radius: number
  limit: number
  cursor?: string
  withTotal?: boolean
  count?: boolean
}

export interface PageResult {
  reports: Report[]
  nextCursor: string | null
  total?: number
}

const DEFAULT_LIMIT = 50

interface ApiNearbyIssue {
  id: string
  caseNumber: string
  serviceType: string
  department: string | null
  status: string
  address: string
  description: string
  mediaUrl: string | null
  latitude: number
  longitude: number
  distance: number
  createdAt: string
  updatedAt: string
  childCount: number
}

interface ApiPageResponse {
  issues?: ApiNearbyIssue[]
  nextCursor?: string | null
  total?: number
}

function toReport(i: ApiNearbyIssue): Report {
  return {
    ...i,
    lat: i.latitude,
    lng: i.longitude,
    department: i.department ?? undefined,
    mediaUrl: i.mediaUrl ?? undefined,
  }
}

export async function fetchPage(params: PageParams): Promise<PageResult> {
  const query: Record<string, string | number | boolean | undefined> = {
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    limit: params.limit,
  }
  if (params.cursor !== undefined) query.cursor = params.cursor
  if (params.withTotal) query.withTotal = 'true'
  if (params.count) query.count = 'true'

  const res = await api311Fetch({ path: '/private/key/nearby-issues', query })

  if (!res.ok) {
    throw await parseError(res)
  }

  const body = (await res.json()) as ApiPageResponse

  if (params.count) {
    return { reports: [], nextCursor: null, total: body.total }
  }

  const reports = (body.issues ?? []).map(toReport)
  return { reports, nextCursor: body.nextCursor ?? null, total: body.total }
}

export function useNearbyReports() {
  const reports: Ref<Report[]> = ref([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function load(region: Region): Promise<Report[]> {
    isLoading.value = true
    error.value = null

    try {
      const result = await fetchPage({
        lat: region.lat,
        lng: region.lng,
        radius: region.radius ?? DEFAULT_RADIUS,
        limit: DEFAULT_LIMIT,
      })
      reports.value = result.reports
      return reports.value
    } catch (err) {
      error.value = err as Error
      reports.value = []
      return []
    } finally {
      isLoading.value = false
    }
  }

  return { reports, isLoading, error, load }
}
