// ABOUTME: Tests for useNearbyReports — API fetch, row mapping, error surfacing,
// ABOUTME: and empty-result handling via the /private/key/nearby-issues endpoint.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNearbyReports, fetchPage } from '../useNearbyReports'
import type { Region } from '../useNearbyReports'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

const PHILLY: Region = { lat: 39.9526, lng: -75.1652 }

const ISSUE = {
  id: '00812345',
  caseNumber: '00812345',
  serviceType: 'Pothole Repair',
  department: 'Streets',
  status: 'New',
  address: '123 Main St',
  description: 'Large pothole',
  mediaUrl: 'https://img.example.test/photo.jpg',
  latitude: 39.95,
  longitude: -75.16,
  distance: 0.3,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  childCount: 0,
}

function okResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function errorResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
})

describe('useNearbyReports', () => {
  it('populates reports from API issues after load', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [ISSUE] }))

    const { reports, isLoading, error, load } = useNearbyReports()
    const result = await load(PHILLY)

    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(result).toHaveLength(1)
    expect(reports.value[0]).toMatchObject({
      id: '00812345',
      caseNumber: '00812345',
      lat: 39.95,
      lng: -75.16,
      serviceType: 'Pothole Repair',
      department: 'Streets',
      status: 'New',
      address: '123 Main St',
      description: 'Large pothole',
      mediaUrl: 'https://img.example.test/photo.jpg',
      distance: 0.3,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    })
  })

  it('attaches lat/lng/radius/limit query params and the API key header', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [] }))
    const { load } = useNearbyReports()
    await load({ lat: 39.95, lng: -75.16, radius: 800 })

    const [calledUrl, init] = fetchMock.mock.calls[0]
    const url = new URL(calledUrl as string)
    expect(url.searchParams.get('lat')).toBe('39.95')
    expect(url.searchParams.get('lng')).toBe('-75.16')
    expect(url.searchParams.get('radius')).toBe('800')
    expect(url.searchParams.get('limit')).toBe('50')
    expect((init as RequestInit).headers).toHaveProperty('x-api-key')
  })

  it('sets error.value with the API error message on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(502, { error: 'Bad Gateway' }))

    const { reports, error, load } = useNearbyReports()
    const result = await load(PHILLY)

    expect(result).toEqual([])
    expect(reports.value).toEqual([])
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toContain('Bad Gateway')
  })

  it('handles empty issues array gracefully', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [] }))

    const { reports, error, load } = useNearbyReports()
    await load(PHILLY)

    expect(reports.value).toEqual([])
    expect(error.value).toBeNull()
  })

  it('maps null department and mediaUrl to undefined', async () => {
    const issueNulls = { ...ISSUE, department: null, mediaUrl: null }
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [issueNulls] }))

    const { reports, load } = useNearbyReports()
    await load(PHILLY)

    expect(reports.value[0].department).toBeUndefined()
    expect(reports.value[0].mediaUrl).toBeUndefined()
  })

  it('surfaces network errors via error.value', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network down'))

    const { reports, error, load } = useNearbyReports()
    const result = await load(PHILLY)

    expect(result).toEqual([])
    expect(reports.value).toEqual([])
    expect(error.value?.message).toBe('Network down')
  })
})

describe('fetchPage', () => {
  it('maps response body to reports with paging metadata', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [ISSUE], total: 42 }))

    const result = await fetchPage({ lat: 39.9526, lng: -75.1652, radius: 800, limit: 50 })

    expect(result.total).toBe(42)
    expect(result.reports).toHaveLength(1)
    expect(result.reports[0]).toMatchObject({
      id: '00812345',
      lat: 39.95,
      lng: -75.16,
      department: 'Streets',
      mediaUrl: 'https://img.example.test/photo.jpg',
    })
  })

  it('passes offset to the request query when set', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [] }))

    await fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50, offset: 400 })

    const [calledUrl] = fetchMock.mock.calls[0]
    const url = new URL(calledUrl as string)
    expect(url.searchParams.get('offset')).toBe('400')
  })

  it('omits offset from query when not set', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [] }))

    await fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50 })

    const [calledUrl] = fetchMock.mock.calls[0]
    const url = new URL(calledUrl as string)
    expect(url.searchParams.has('offset')).toBe(false)
  })

  it('passes withTotal=true to query only when withTotal is set', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [], total: 10 }))

    await fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50, withTotal: true })

    const [calledUrl] = fetchMock.mock.calls[0]
    const url = new URL(calledUrl as string)
    expect(url.searchParams.get('withTotal')).toBe('true')
  })

  it('omits withTotal from query when not set', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [] }))

    await fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50 })

    const [calledUrl] = fetchMock.mock.calls[0]
    const url = new URL(calledUrl as string)
    expect(url.searchParams.has('withTotal')).toBe(false)
  })

  it('returns total from count-only response without mapping issues', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ total: 42 }))

    const result = await fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50, count: true })

    const [calledUrl] = fetchMock.mock.calls[0]
    const url = new URL(calledUrl as string)
    expect(url.searchParams.get('count')).toBe('true')
    expect(result.total).toBe(42)
    expect(result.reports).toEqual([])
  })

  it('throws on non-ok response with the parsed error message', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(502, { error: 'Bad Gateway' }))

    await expect(
      fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50 }),
    ).rejects.toThrow('Bad Gateway')
  })
})
