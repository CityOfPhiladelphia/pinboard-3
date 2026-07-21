// ABOUTME: Tests for the open-issues Pinia store.
// ABOUTME: Covers progressive loading, dedup, TTL/probe cache invalidation, and concurrency guard.
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
  }
}

function pageResult(
  reports: Report[],
  nextOffset: number | null = null,
  lastOffset: number | null = null,
): PageResult {
  return { reports, nextOffset, lastOffset }
}

const SEED = { lat: 39.9526, lng: -75.1652 }
const ALT_SEED = { lat: 40.0, lng: -75.2 }
const FIXED_NOW = 1_000_000

// Pre-loads the store with a single report (id '001', total 1) at FIXED_NOW.
// Each load calls fetchPage twice: page 1 (limit:200) then the probe (limit:1).
async function loadInitial(store: ReturnType<typeof useOpenIssuesStore>) {
  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(pageResult([makeReport('001')], null, 0)) // page 1: 1 report, lastOffset=0
    .mockResolvedValueOnce(pageResult([makeReport('001')], null, 0)) // probe: lastOffset=0 → total=1
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

      let isLoadingDuringBgPage: boolean | undefined
      const mockFetch = vi
        .fn()
        // Page 1: nextOffset=200, so background loop starts at offset=200
        .mockResolvedValueOnce(pageResult([makeReport('001')], 200, 249))
        // Probe: lastOffset=249 → total=250
        .mockResolvedValueOnce(pageResult([makeReport('probe')], null, 249))
        .mockImplementationOnce(async () => {
          // Captured while offset=200 background page is being fetched — after page 1 + probe
          isLoadingDuringBgPage = store.isLoading
          return pageResult([makeReport('002')]) // nextOffset=null → loop stops
        })

      const promise = store.ensureLoaded(SEED, { fetchPage: mockFetch })
      expect(store.isLoading).toBe(true) // set synchronously before page 1 resolves

      await promise

      expect(isLoadingDuringBgPage).toBe(false) // cleared after page 1, before streaming
      expect(store.isLoading).toBe(false)
    })

    it('loads page 1 then streams remaining pages, deduplicating by id', async () => {
      const store = useOpenIssuesStore()
      const r1 = makeReport('001')
      const r2 = makeReport('002')
      const r3 = makeReport('003')
      const r2dup = makeReport('002') // duplicate id — should appear only once

      const mockFetch = vi
        .fn()
        // Page 1: nextOffset=200 so loop enters at offset=200
        .mockResolvedValueOnce(pageResult([r1, r2], 200, 249))
        // Probe: total=250
        .mockResolvedValueOnce(pageResult([makeReport('probe')], null, 249))
        // offset=200: nextOffset=null → stops the loop
        .mockResolvedValueOnce(pageResult([r2dup, r3]))

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      expect(store.reports).toHaveLength(3) // r1, r2, r3; r2dup deduped
      expect(store.total).toBe(250)
      expect(store.byId.has('001')).toBe(true)
      expect(store.byId.has('002')).toBe(true)
      expect(store.byId.has('003')).toBe(true)
      expect(store.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('single-page load makes no background paging calls', async () => {
      const store = useOpenIssuesStore()
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(pageResult([makeReport('001')], null, 0)) // page 1: no next
        .mockResolvedValueOnce(pageResult([makeReport('001')], null, 0)) // probe: total=1
      await store.ensureLoaded(SEED, { fetchPage: mockFetch })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('page-1 error', () => {
    it('sets error, isLoading false, reports remain empty', async () => {
      const store = useOpenIssuesStore()
      const boom = new Error('network fail')
      const mockFetch = vi.fn().mockRejectedValueOnce(boom)

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      expect(store.isLoading).toBe(false)
      expect(store.reports).toHaveLength(0)
      expect(store.error).toBe(boom)
    })

    it('preserves prior dataset when page-1 fails during a reload', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // reports=['001'], total=1, fetchedAt=FIXED_NOW

      const boom = new Error('reload page-1 fail')
      // TTL expired → reload path; page 1 fails
      const mockFetch = vi.fn().mockRejectedValueOnce(boom)
      await store.ensureLoaded(SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 5 * 60_000 + 1, // 1ms past TTL
      })

      expect(store.isLoading).toBe(false)
      // Prior data intact
      expect(store.reports).toHaveLength(1)
      expect(store.reports[0].id).toBe('001')
      expect(store.error).toBe(boom)
    })
  })

  describe('mid-stream error', () => {
    it('keeps page-1 data and sets error', async () => {
      const store = useOpenIssuesStore()
      const r1 = makeReport('001')
      const boom = new Error('stream fail')
      const mockFetch = vi
        .fn()
        // Page 1: nextOffset=200 so loop starts at offset=200
        .mockResolvedValueOnce(pageResult([r1], 200, 249))
        // Probe: total=250
        .mockResolvedValueOnce(pageResult([makeReport('probe')], null, 249))
        // offset=200 throws
        .mockRejectedValueOnce(boom)

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      expect(store.reports).toHaveLength(1)
      expect(store.reports[0].id).toBe('001')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(boom)
    })
  })

  describe('count-check error (populated + within TTL)', () => {
    it('retains cached data and surfaces error when probe fetch rejects', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // reports=['001'], total=1

      const boom = new Error('count check failed')
      const mockFetch = vi.fn().mockRejectedValueOnce(boom)
      await store.ensureLoaded(SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000, // well within TTL
      })

      // Only the failing probe call — no page reload
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchObject({ limit: 1 })
      // Cached data preserved
      expect(store.reports).toHaveLength(1)
      expect(store.reports[0].id).toBe('001')
      // Error surfaced
      expect(store.error).toBe(boom)
    })
  })

  describe('populated + within TTL', () => {
    it('count unchanged → no page fetch (only probe call)', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // total=1

      // Probe returns same total: 1 row, lastOffset=0 → total=1
      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([makeReport('probe')], null, 0))
      await store.ensureLoaded(SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000, // well within TTL
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchObject({ limit: 1 })
      expect(store.reports).toHaveLength(1) // original data preserved
    })

    it('count changed → full reload', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store) // total=1, report '001'

      const r2 = makeReport('002')
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(pageResult([makeReport('probe1')], null, 1)) // within-TTL probe: total=2
        .mockResolvedValueOnce(pageResult([r2], null, 1)) // reload page 1: r2, no next
        .mockResolvedValueOnce(pageResult([makeReport('probe2')], null, 1)) // reload probe: total=2
      await store.ensureLoaded(SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000,
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
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
      const reloadFetch = vi
        .fn()
        .mockResolvedValueOnce(pageResult([r2], null, 0)) // reload page 1
        .mockResolvedValueOnce(pageResult([r2], null, 0)) // reload probe: total=1
      await store.ensureLoaded(SEED, {
        fetchPage: reloadFetch,
        now: () => FIXED_NOW + 5 * 60_000 + 1, // 1ms past TTL
      })

      // Two calls: page 1 of the reload + probe — no prior count check
      expect(reloadFetch).toHaveBeenCalledTimes(2)
      expect(reloadFetch.mock.calls[0][0]).not.toHaveProperty('count')
      expect(store.reports[0].id).toBe('002')
    })
  })

  describe('changed seed on re-entry', () => {
    it('keeps data when cache is fresh and count is unchanged', async () => {
      const store = useOpenIssuesStore()
      await loadInitial(store)

      // Probe returns same total (lastOffset=0 → total=1 = cached)
      const mockFetch = vi.fn().mockResolvedValueOnce(pageResult([makeReport('probe')], null, 0))
      await store.ensureLoaded(ALT_SEED, {
        fetchPage: mockFetch,
        now: () => FIXED_NOW + 1_000,
      })

      expect(store.reports).toHaveLength(1) // original data kept
      // Only the probe — no page reload
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchObject({ limit: 1 })
    })
  })

  describe('concurrency guard', () => {
    it('concurrent calls share a single in-flight load', async () => {
      const store = useOpenIssuesStore()
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(pageResult([makeReport('001')], null, 0)) // page 1
        .mockResolvedValueOnce(pageResult([makeReport('001')], null, 0)) // probe → total=1

      const p1 = store.ensureLoaded(SEED, { fetchPage: mockFetch })
      const p2 = store.ensureLoaded(SEED, { fetchPage: mockFetch })

      // Pinia wraps each action call in a new Promise for its subscription system,
      // so p1 !== p2 at the surface — but both resolve from the same in-flight load.
      await Promise.all([p1, p2])

      expect(mockFetch).toHaveBeenCalledTimes(2) // page 1 + probe — only one actual load
      expect(store.reports).toHaveLength(1)
    })
  })

  describe('OFFSET_CAP', () => {
    it('stops paging at OFFSET_CAP even when total exceeds it', async () => {
      const store = useOpenIssuesStore()
      const calledOffsets: number[] = []

      const mockFetch = vi.fn().mockImplementation(async (params: PageParams) => {
        const offset = params.offset ?? 0
        calledOffsets.push(offset)

        if (params.limit === 1) {
          // probe call — signals a very large total
          return pageResult([makeReport('probe')], null, 4999)
        }

        // Page call: return exactly 200 (PAGE_LIMIT) reports to prevent the early-stop branch
        const reports = Array.from({ length: 200 }, (_, i) => makeReport(`${offset}_${i}`))
        const nextOffset = offset + 200
        return pageResult(reports, nextOffset, 4999)
      })

      await store.ensureLoaded(SEED, { fetchPage: mockFetch })

      // page1(offset=0) + probe(offset=0) + bg pages at offsets 200,400,...,1800 = 11 calls;
      // offset=2000 is not fetched because nextOffset=2000 fails the < OFFSET_CAP check
      expect(mockFetch).toHaveBeenCalledTimes(11)
      expect(calledOffsets).not.toContain(2000)
      expect(Math.max(...calledOffsets)).toBe(1800)
    })
  })
})
