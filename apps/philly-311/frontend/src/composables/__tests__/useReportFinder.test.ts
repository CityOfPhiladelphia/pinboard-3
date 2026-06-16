import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Report } from '@/composables/useNearbyReports'

const load = vi.fn()
const reportsRef = { value: [] as Report[] }
const isLoadingRef = { value: false }
const errorRef = { value: null as Error | null }
vi.mock('@/composables/useNearbyReports', () => ({
  useNearbyReports: () => ({ reports: reportsRef, isLoading: isLoadingRef, error: errorRef, load }),
}))
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

beforeEach(() => {
  load.mockReset().mockResolvedValue([sample, other])
  reportsRef.value = [sample, other]
  errorRef.value = null
  getCurrentPosition.mockReset()
})

describe('useReportFinder', () => {
  it('seeds region from geolocation and loads once', async () => {
    getCurrentPosition.mockResolvedValue({ lat: 40, lng: -75 })
    const f = useReportFinder()
    await f.init()
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 40, lng: -75 }))
    expect(f.searchOrUserLocation.value).toEqual({ latitude: 40, longitude: -75 })
    expect(f.locations.value).toHaveLength(2)
  })
  it('falls back to the default Philly center when geolocation is null', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 39.9526, lng: -75.1652 }))
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
    getCurrentPosition.mockResolvedValue(null)
    reportsRef.value = [
      { ...sample, id: 'a', serviceType: 'Pothole Repair' },
      { ...sample, id: 'b', serviceType: 'Pothole Repair' },
      { ...sample, id: 'c', serviceType: 'Illegal Dumping' },
    ]
    const f = useReportFinder()
    await f.init()
    expect(f.filterOptions.value).toEqual([
      { value: 'Pothole Repair', label: 'Pothole Repair' },
      { value: 'Illegal Dumping', label: 'Illegal Dumping' },
    ])
  })
  it('breaks count ties alphabetically and omits service types absent from the data', async () => {
    getCurrentPosition.mockResolvedValue(null)
    reportsRef.value = [
      { ...sample, id: 'a', serviceType: 'Tree Maintenance' },
      { ...sample, id: 'b', serviceType: 'Abandoned Vehicle' },
    ]
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
    getCurrentPosition.mockResolvedValue(null)
    errorRef.value = new Error('boom')
    const f = useReportFinder()
    await f.init()
    expect(f.errorMessage.value).toBe('boom')
  })
  it('setCenter recenters and reloads for the new center', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    load.mockClear()
    await f.setCenter({ latitude: 40.1, longitude: -75.2 })
    expect(f.searchOrUserLocation.value).toEqual({ latitude: 40.1, longitude: -75.2 })
    expect(load).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 40.1, lng: -75.2, radius: 1600 }),
    )
  })
})
