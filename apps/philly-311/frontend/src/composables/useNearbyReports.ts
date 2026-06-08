// ABOUTME: Nearby issues fetched from /private/key/nearby-issues. The API talks
// ABOUTME: to the same Salesforce instance as /issues/:id so case-number IDs
// ABOUTME: round-trip cleanly when a user clicks a marker for the detail page.
// ABOUTME: Anonymous-ok route, so no auth handle is passed to api311Fetch.
import { ref, type Ref } from 'vue'
import { api311Fetch } from './api311'
import { parseError } from './useApiError'

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

const DEFAULT_RADIUS = 1600
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

interface ApiResponse {
  issues: ApiNearbyIssue[]
}

export function useNearbyReports() {
  const reports: Ref<Report[]> = ref([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function load(region: Region): Promise<Report[]> {
    isLoading.value = true
    error.value = null

    try {
      const res = await api311Fetch({
        path: '/private/key/nearby-issues',
        query: {
          lat: region.lat,
          lng: region.lng,
          radius: region.radius ?? DEFAULT_RADIUS,
          limit: DEFAULT_LIMIT,
        },
      })
      if (!res.ok) {
        error.value = await parseError(res)
        reports.value = []
        return []
      }
      const result = (await res.json()) as ApiResponse
      const issues = result?.issues ?? []
      reports.value = issues.map(
        (i): Report => ({
          id: i.id,
          caseNumber: i.caseNumber,
          lat: i.latitude,
          lng: i.longitude,
          serviceType: i.serviceType,
          status: i.status,
          address: i.address,
          department: i.department ?? undefined,
          mediaUrl: i.mediaUrl ?? undefined,
          description: i.description,
          distance: i.distance,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        }),
      )
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
