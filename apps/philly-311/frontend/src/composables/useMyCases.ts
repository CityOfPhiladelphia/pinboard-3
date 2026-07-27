// ABOUTME: The signed-in user's 311 cases from /private/key/me/issues — fetches
// ABOUTME: every page via Link-header offsets and maps to the shared Report type.
import { ref } from 'vue'
import { api311Fetch, type Auth } from './api311'
import { parseError } from './useApiError'
import { parseLinkHeader, toReport, type ApiNearbyIssue, type Report } from './useNearbyReports'

const PAGE_LIMIT = 200

export function useMyCases(auth: Auth) {
  const reports = ref<Report[]>([])
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function load(): Promise<void> {
    if (isLoading.value) return
    isLoading.value = true
    errorMessage.value = null
    const all: Report[] = []
    try {
      let offset: number | undefined
      do {
        const query: Record<string, number | undefined> = { limit: PAGE_LIMIT }
        if (offset !== undefined) query.offset = offset
        const res = await api311Fetch({ path: '/private/key/me/issues', auth, query })
        if (!res.ok) throw await parseError(res)
        const { next } = parseLinkHeader(res.headers.get('Link'))
        const body = (await res.json()) as { issues?: ApiNearbyIssue[] }
        all.push(...(body.issues ?? []).map(toReport))
        // Follow next only while it advances, so a server-side Link bug can't loop forever.
        offset = next !== null && next > (offset ?? 0) ? next : undefined
      } while (offset !== undefined)
      reports.value = all
    } catch (e) {
      errorMessage.value =
        e instanceof Error ? e.message : 'Something went wrong loading your requests.'
    } finally {
      isLoading.value = false
    }
  }

  return { reports, isLoading, errorMessage, load }
}
