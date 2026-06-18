// ABOUTME: Tests for useNearbyReports — API fetch, row mapping, error surfacing,
// ABOUTME: and empty-result handling via the /private/key/nearby-issues endpoint.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPage } from '../useNearbyReports'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

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
