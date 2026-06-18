// ABOUTME: Tests for the open-issues Pinia store.
// ABOUTME: Covers progressive loading, dedup, TTL/count cache invalidation, and concurrency guard.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOpenIssuesStore } from '../openIssues'
import type { Report, PageResult, PageParams } from '@/composables/useNearbyReports'

// ------- helpers -------

function makeReport(id: string): Report {
  return {
    id,
    caseNumber: id,
    lat: 39.95,
    lng: -75.16,
    serviceType: 'Pothole',
    status: 'Open',
    address: '123 Main St',
    distance: 0,
  }
}

function pageResult(reports: Report[], total?: number): PageResult {
  return { reports, total }
}

const SEED = { lat: 39.9526, lng: -75.1652 }
const ALT_SEED = { lat: 40.0, lng: -75.2 }
const FIXED_NOW = 1_000_000

// Pre-loads the store with a single report (id '001', total 1) at FIXED_NOW.
async function loadInitial(store: ReturnType<typeof useOpenIssuesStore>) {
  const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([makeReport('001')], 1))
  await store.ensureLoaded(SEED, { fetchPage: mockFetch, now: () => FIXED_NOW })
}

// ------- tests -------

describe('useOpenIssuesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('empty cache', () => {
    it('sets isLoading true immediately, clears after page 1', async () => {
      const store = useOpenIssuesStore()

      let isLoadingDuringPage2: boolean | undefined
      const mockFetch = vi.fn()
        // Page 1: total=250 > PAGE_LIMIT=200, so background loop starts at offset=200
        .mockResolvedValueOnce(pageResult([makeReport('001')], 250))
        .mockImplementationOnce(async () => {
          // Captured while offset=200 page is being fetched — after page 1 completed
          isLoadingDuringPage2 = store.isLoading
          return pageResult([makeReport('002')]) // 1 report < PAGE_LIMIT, loop stops
        })

      const promise = store.ensureLoaded(SEED, { fetchPage: mockFetch })
      expect(store.isLoading).toBe(true) // set synchronously before page 1 resolves

      await promise

      expect(isLoadingDuringPage2).toBe(false) // cleared after page 1, before streaming
      expect(store.isLoading).toBe(false)
    })

    it('loads page 1 then streams remaining pages, deduplicating by id', async () => {
      const store = useOpenIssuesStore()
      const r1 = makeReport('001')
      const r2 = makeReport('002')
      const r3 = makeReport('003')
      const r2dup = makeReport('002') // duplicate id — should appear only once

      const mockFetch = vi.fn()
        // Page 1: total=250 > PAGE_LIMIT=200, loop enters at offset=200
        .mockResolvedValueOnce(pageResult([r1, r2], 250))
        // offset=200: 2 reports < PAGE_LIMIT, stops the loop
        .mockResolvedValueOnce(pageResult([r2dup, r3]))

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      expect(store.reports).toHaveLength(3) // r1, r2, r3; r2dup deduped
      expect(store.total).toBe(250)
      expect(store.byId.has('001')).toBe(true)
      expect(store.byId.has('002')).toBe(true)
      expect(store.byId.has('003')).toBe(true)
      expect(store.isStreaming).toBe(false)
      expect(store.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets seed from the call argument', async () => {
      const store = useOpenIssuesStore()
      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([], 0))
      await store.ensureLoaded(SEED, { fetchPage: mockFetch })
      expect(store.seed).toEqual(SEED)
    })

    it('single-page load: isStreaming never true', async () => {
      const store = useOpenIssuesStore()
      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([makeReport('001')], 1))
      await store.ensureLoaded(SEED, { fetchPage: mockFetch })
      expect(store.isStreaming).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('page-1 error', () => {
    it('sets error, isLoading false, reports remain empty', async () => {
      const store = useOpenIssuesStore()
      const boom = new Error('network fail')
      const mockFetch = vi.fn().mockRejectedValueOnce(boom)

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      expect(store.isLoading).toBe(false)
      expect(store.isStreaming).toBe(false)
      expect(store.reports).toHaveLength(0)
      expect(store.error).toBe(boom)
    })
  })

  describe('mid-stream error', () => {
    it('keeps page-1 data, sets error, clears isStreaming', async () => {
      const store = useOpenIssuesStore()
      const r1 = makeReport('001')
      const boom = new Error('stream fail')
      const mockFetch = vi.fn()
        // Page 1: total=250 so loop starts at offset=200
        .mockResolvedValueOnce(pageResult([r1], 250))
        // offset=200 throws
        .mockRejectedValueOnce(boom)

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      expect(store.reports).toHaveLength(1)
      expect(store.reports[0].id).toBe('001')
      expect(store.isStreaming).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(boom)
    })
  })

  describe('populated + within TTL', () => {
    it('count unchanged → no page fetch (only count call)', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // total=1

      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([], 1)) // count returns same total
      await store.ensureLoaded(SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000, // well within TTL
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchObject({ count: true })
      expect(store.reports).toHaveLength(1) // original data preserved
    })

    it('count changed → full reload', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // total=1, report '001'

      const r2 = makeReport('002')
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(pageResult([], 2))    // count check: total now 2
        .mockResolvedValueOnce(pageResult([r2], 2)) // page 1 of reload, total=2 < PAGE_LIMIT, no loop
      await store.ensureLoaded(SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000,
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(store.reports).toHaveLength(1)
      expect(store.reports[0].id).toBe('002')
      expect(store.total).toBe(2)
    })
  })

  describe('TTL expired', () => {
    it('reloads without a count check when cache is stale', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // fetchedAt=FIXED_NOW, total=1

      const r2 = makeReport('002')
      const reloadFetch = vi.fn().mockResolvedValueOnce(pageResult([r2], 1))
      await store.ensureLoaded(SEED, {
        fetchPage: reloadFetch,
        now: () => FIXED_NOW + 5 * 60_000 + 1, // 1ms past TTL
      })

      // One call: page 1 of the reload — no count check
      expect(reloadFetch).toHaveBeenCalledTimes(1)
      expect(reloadFetch.mock.calls[0][0]).not.toHaveProperty('count')
      expect(store.reports[0].id).toBe('002')
    })
  })

  describe('changed seed on re-entry', () => {
    it('updates seed but keeps data when cache is fresh and count is unchanged', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store)

      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([], 1))
      await store.ensureLoaded(ALT_SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000,
      })

      expect(store.seed).toEqual(ALT_SEED) // seed updated
      expect(store.reports).toHaveLength(1) // original data kept
      // Only the count check — no page reload
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchObject({ count: true })
    })
  })

  describe('concurrency guard', () => {
    it('concurrent calls share a single in-flight load', async () => {
      const store = useOpenIssuesStore()
      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([makeReport('001')], 1))

      const p1 = store.ensureLoaded(SEED, { fetchPage: mockFetch })
      const p2 = store.ensureLoaded(SEED, { fetchPage: mockFetch })

      // Pinia wraps each action call in a new Promise for its subscription system,
      // so p1 !== p2 at the surface — but both resolve from the same in-flight load.
      await Promise.all([p1, p2])

      expect(mockFetch).toHaveBeenCalledTimes(1) // only one actual load
      expect(store.reports).toHaveLength(1)
    })
  })

  describe('OFFSET_CAP', () => {
    it('stops paging at OFFSET_CAP even when total exceeds it', async () => {
      const store = useOpenIssuesStore()
      const calledOffsets: number[] = []

      const mockFetch = vi.fn().mockImplementation(async (params: PageParams) => {
        calledOffsets.push(params.offset ?? 0)
        // Return exactly 200 (PAGE_LIMIT) reports to prevent the early-stop branch
        const reports = Array.from(
          { length: 200 },
          (_, i) => makeReport(`${params.offset ?? 0}_${i}`),
        )
        return { reports, total: params.withTotal ? 5000 : undefined }
      })

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      // offset=0 (page 1) + offset=200,400,...,1800 = 10 calls; offset=2000 must not appear
      expect(mockFetch).toHaveBeenCalledTimes(10)
      expect(calledOffsets).not.toContain(2000)
      expect(Math.max(...calledOffsets)).toBe(1800)
    })
  })
})
