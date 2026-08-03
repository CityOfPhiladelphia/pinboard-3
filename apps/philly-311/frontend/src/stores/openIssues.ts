// ABOUTME: Pinia store owning the canonical citywide open-issue dataset.
// ABOUTME: Loads progressively (page 1 first, then background paging) with probe+TTL cache invalidation.
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
// SOQL OFFSET cap mirrored from the backend — only the first 2000 nearest issues load.
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
  const total = ref<number | null>(null)
  const fetchedAt = ref<number | null>(null)
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  // Not part of exposed state — tracks the in-flight Promise to prevent concurrent loads.
  let _inFlight: Promise<void> | null = null

  /** Fetches a single row and derives total from the Link `last` offset. */
  async function _probeTotal(
    fetch: (params: PageParams) => Promise<PageResult>,
    anchor: { lat: number; lng: number },
  ): Promise<number> {
    const { reports: rows, lastOffset } = await fetch({
      lat: anchor.lat,
      lng: anchor.lng,
      radius: CITYWIDE_RADIUS,
      limit: 1,
      offset: 0,
    })
    return rows.length === 0 ? 0 : lastOffset !== null ? lastOffset + 1 : rows.length
  }

  async function _fullLoad(
    anchor: { lat: number; lng: number },
    fetch: (params: PageParams) => Promise<PageResult>,
    now: () => number,
  ): Promise<void> {
    // For an initial (empty-cache) load there is nothing to preserve, so clear immediately.
    // For a reload, keep prior data in place until page 1 succeeds to avoid a blank state
    // if page 1 fails mid-reload.
    const isReload = fetchedAt.value !== null
    const newReports: Report[] = []
    if (!isReload) {
      reports.value = []
      byId.value = new Map()
      total.value = null
    }
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
      })
      // Page 1 landed — atomically replace the dataset (clears stale data on reload path).
      const newById = new Map<string, Report>()

      for (const r of page1.reports) {
        if (!newById.has(r.id)) {
          newReports.push(r)
          newById.set(r.id, r)
        }
      }

      byId.value = newById
      fetchedAt.value = now()
    } catch (e) {
      error.value = e as Error
      return
    }

    // Background paging driven by nextOffset from each page
    let next = page1.nextOffset
    while (next !== null && next < OFFSET_CAP) {
      try {
        const page = await fetch({
          lat: anchor.lat,
          lng: anchor.lng,
          radius: CITYWIDE_RADIUS,
          limit: PAGE_LIMIT,
          offset: next,
        })
        for (const r of page.reports) {
          if (!byId.value.has(r.id)) {
            newReports.push(r)
            byId.value.set(r.id, r)
          }
        }
        if (page.reports.length === 0) break
        next = page.nextOffset
      } catch (e) {
        error.value = e as Error
        return
      }
    }
    reports.value = newReports
    total.value = newReports.length
    isLoading.value = false
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

    // Within TTL: probe live total before deciding to reload.
    // On a transient failure here, keep the cached dataset — a flaky revalidation
    // should not evict good data.
    let liveTotal: number
    try {
      liveTotal = await _probeTotal(fetch, anchor)
    } catch (e) {
      error.value = e as Error
      return
    }

    if (liveTotal === total.value) return // cache is still fresh

    await _fullLoad(anchor, fetch, now)
  }

  function ensureLoaded(
    newSeed: { lat: number; lng: number },
    opts?: EnsureLoadedOpts,
  ): Promise<void> {
    // CITYWIDE_RADIUS covers the full city from any in-bounds seed, so a seed change
    // mid-flight doesn't affect the completeness of the dataset being loaded.
    if (_inFlight) return _inFlight

    _inFlight = _run(newSeed, opts).finally(() => {
      _inFlight = null
    })

    return _inFlight
  }

  return {
    reports,
    byId,
    total,
    fetchedAt,
    isLoading,
    error,
    ensureLoaded,
  }
})
