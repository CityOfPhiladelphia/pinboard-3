// ABOUTME: Tests for useReportFinder — geolocation seed, city-wide store integration,
// ABOUTME: filter state, and derived locations/filterOptions/reportById.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Report } from '@/composables/useNearbyReports'
import { useOpenIssuesStore } from '@/stores/openIssues'

const getCurrentPosition = vi.fn()
vi.mock('@/composables/useGeolocation', () => ({ getCurrentPosition: () => getCurrentPosition() }))

import { useReportFinder } from '../useReportFinder'

const sample: Report = {
  id: '1',
  caseNumber: '1',
  lat: 39.95,
  lng: -75.16,
  serviceType: 'Pothole Repair',
  status: 'Open',
  address: 'A St',
  distance: 100,
}
const other: Report = { ...sample, id: '2', serviceType: 'Illegal Dumping' }

let ensureLoaded: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  setActivePinia(createPinia())
  const store = useOpenIssuesStore()
  ensureLoaded = vi.spyOn(store, 'ensureLoaded').mockResolvedValue(undefined)
  store.$patch({
    reports: [sample, other],
    byId: new Map([
      ['1', sample],
      ['2', other],
    ]),
  })
  getCurrentPosition.mockReset()
})

describe('useReportFinder', () => {
  it('seeds region from geolocation and loads once', async () => {
    getCurrentPosition.mockResolvedValue({ lat: 40, lng: -75 })
    const f = useReportFinder()
    await f.init()
    expect(ensureLoaded).toHaveBeenCalledWith({ lat: 40, lng: -75 })
    expect(f.searchOrUserLocation.value).toEqual({ latitude: 40, longitude: -75 })
    expect(f.locations.value).toHaveLength(2)
  })

  it('falls back to the default Philly center when geolocation is null', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(ensureLoaded).toHaveBeenCalledWith({ lat: 39.9526, lng: -75.1652 })
  })

  it('filters locations by selected service type', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    f.setFilter('Pothole Repair')
    expect(f.locations.value.map((l) => l.id)).toEqual(['1'])
    f.setFilter('all')
    expect(f.locations.value).toHaveLength(2)
  })

  it('derives filterOptions from report data, ordered by prevalence desc', async () => {
    const store = useOpenIssuesStore()
    store.$patch({
      reports: [
        { ...sample, id: 'a', serviceType: 'Pothole Repair' },
        { ...sample, id: 'b', serviceType: 'Pothole Repair' },
        { ...sample, id: 'c', serviceType: 'Illegal Dumping' },
      ],
    })
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(f.filterOptions.value).toEqual([
      { value: 'Pothole Repair', label: 'Pothole Repair' },
      { value: 'Illegal Dumping', label: 'Illegal Dumping' },
    ])
  })

  it('breaks count ties alphabetically and omits service types absent from the data', async () => {
    const store = useOpenIssuesStore()
    store.$patch({
      reports: [
        { ...sample, id: 'a', serviceType: 'Tree Maintenance' },
        { ...sample, id: 'b', serviceType: 'Abandoned Vehicle' },
      ],
    })
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(f.filterOptions.value.map((o) => o.value)).toEqual([
      'Abandoned Vehicle',
      'Tree Maintenance',
    ])
  })

  it('looks up a report by id', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(f.reportById('2')?.serviceType).toBe('Illegal Dumping')
  })

  it('exposes the load error message', async () => {
    const store = useOpenIssuesStore()
    store.$patch({ error: new Error('boom') })
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(f.errorMessage.value).toBe('boom')
  })

  it('setCenter updates the view center and does not refetch', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    ensureLoaded.mockClear()
    await f.setCenter({ latitude: 40.1, longitude: -75.2 })
    expect(f.searchOrUserLocation.value).toEqual({ latitude: 40.1, longitude: -75.2 })
    expect(ensureLoaded).not.toHaveBeenCalled()
  })
})
