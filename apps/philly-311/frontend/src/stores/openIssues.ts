// ABOUTME: Pinia store owning the canonical citywide open-issue dataset.
// ABOUTME: Loads progressively (page 1 first, then background paging) with count+TTL cache invalidation.
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchPage as defaultFetchPage,
  type Report,
  type PageParams,
  type PageResult,
} from '@/composables/useNearbyReports'
import { CITYWIDE_RADIUS } from '@/utils/geoDefaults'

const TTL_MS = 5 * 60_000
const PAGE_LIMIT = 200
// SOQL OFFSET cap mirrored from the backend — only the first 2000 nearest issues load;
// full-city paging awaits the backend's future cursor pagination.
const OFFSET_CAP = 2000

export interface EnsureLoadedOpts {
  /** Override the clock; defaults to Date.now. Useful in tests. */
  now?: () => number
  /** Override the fetch function; defaults to fetchPage. Useful in tests. */
  fetchPage?: (params: PageParams) => Promise<PageResult>
}

export const useOpenIssuesStore = defineStore('openIssues', () => {
  const reports = ref<Report[]>([])
  const byId = ref(new Map<string, Report>())
  const seed = ref<{ lat: number; lng: number } | null>(null)
  const total = ref<number | null>(null)
  const fetchedAt = ref<number | null>(null)
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const error = ref<Error | null>(null)

  // Not part of exposed state — tracks the in-flight Promise to prevent concurrent loads.
  let _inFlight: Promise<void> | null = null

  async function _fullLoad(
    anchor: { lat: number; lng: number },
    fetch: (params: PageParams) => Promise<PageResult>,
    now: () => number,
  ): Promise<void> {
    reports.value = []
    byId.value = new Map()
    total.value = null
    error.value = null
    isLoading.value = true

    let page1: PageResult
    try {
      page1 = await fetch({
        lat: anchor.lat,
        lng: anchor.lng,
        radius: CITYWIDE_RADIUS,
        limit: PAGE_LIMIT,
        offset: 0,
        withTotal: true,
      })
      for (const r of page1.reports) {
        if (!byId.value.has(r.id)) {
          reports.value.push(r)
          byId.value.set(r.id, r)
        }
      }
      total.value = page1.total ?? null
      fetchedAt.value = now()
    } catch (e) {
      error.value = e as Error
      return
    } finally {
      isLoading.value = false
    }

    const bound = Math.min(total.value ?? 0, OFFSET_CAP)
    if (PAGE_LIMIT >= bound) return

    isStreaming.value = true
    for (let offset = PAGE_LIMIT; offset < bound; offset += PAGE_LIMIT) {
      try {
        const page = await fetch({
          lat: anchor.lat,
          lng: anchor.lng,
          radius: CITYWIDE_RADIUS,
          limit: PAGE_LIMIT,
          offset,
        })
        for (const r of page.reports) {
          if (!byId.value.has(r.id)) {
            reports.value.push(r)
            byId.value.set(r.id, r)
          }
        }
        if (page.reports.length < PAGE_LIMIT) break
      } catch (e) {
        error.value = e as Error
        isStreaming.value = false
        return
      }
    }
    isStreaming.value = false
  }

  async function _run(
    anchor: { lat: number; lng: number },
    opts?: EnsureLoadedOpts,
  ): Promise<void> {
    const now = opts?.now ?? (() => Date.now())
    const fetch = opts?.fetchPage ?? defaultFetchPage

    // Empty cache: full load
    if (!fetchedAt.value) {
      await _fullLoad(anchor, fetch, now)
      return
    }

    // TTL expired: full reload regardless of count
    if (now() - fetchedAt.value > TTL_MS) {
      await _fullLoad(anchor, fetch, now)
      return
    }

    // Within TTL: check live count before deciding to reload
    const { total: liveTotal } = await fetch({
      lat: anchor.lat,
      lng: anchor.lng,
      radius: CITYWIDE_RADIUS,
      limit: PAGE_LIMIT,
      count: true,
    })

    if (liveTotal === total.value) return // cache is still fresh

    await _fullLoad(anchor, fetch, now)
  }

  function ensureLoaded(
    newSeed: { lat: number; lng: number },
    opts?: EnsureLoadedOpts,
  ): Promise<void> {
    seed.value = newSeed

    if (_inFlight) return _inFlight

    _inFlight = _run(newSeed, opts).finally(() => {
      _inFlight = null
    })

    return _inFlight
  }

  return {
    reports,
    byId,
    seed,
    total,
    fetchedAt,
    isLoading,
    isStreaming,
    error,
    ensureLoaded,
  }
})
