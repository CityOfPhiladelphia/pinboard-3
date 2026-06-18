// ABOUTME: Tests for useNearbyReports — API fetch, row mapping, error surfacing,
// ABOUTME: and Link-header pagination via the /private/key/nearby-issues endpoint.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPage, parseLinkHeader } from '../useNearbyReports'

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

function okResponse(body: unknown, link?: string) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...(link ? { Link: link } : {}),
    },
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

describe('parseLinkHeader', () => {
  it('extracts next and last offsets from a full Link header', () => {
    const header =
      '</api/nearby?offset=0>; rel="first", </api/nearby?offset=1000>; rel="last", </api/nearby?offset=200>; rel="next"'
    expect(parseLinkHeader(header)).toEqual({ next: 200, last: 1000 })
  })

  it('returns null for both when header is null', () => {
    expect(parseLinkHeader(null)).toEqual({ next: null, last: null })
  })

  it('returns null for next when only last is present', () => {
    const header = '</api/nearby?offset=999>; rel="last"'
    expect(parseLinkHeader(header)).toEqual({ next: null, last: 999 })
  })

  it('returns null for last when only next is present', () => {
    const header = '</api/nearby?offset=200>; rel="next"'
    expect(parseLinkHeader(header)).toEqual({ next: 200, last: null })
  })
})

describe('fetchPage', () => {
  it('maps response body to reports and parses Link header offsets', async () => {
    const link =
      '</api/nearby?offset=0>; rel="first", </api/nearby?offset=999>; rel="last", </api/nearby?offset=200>; rel="next"'
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [ISSUE] }, link))

    const result = await fetchPage({ lat: 39.9526, lng: -75.1652, radius: 800, limit: 50 })

    expect(result.nextOffset).toBe(200)
    expect(result.lastOffset).toBe(999)
    expect(result.reports).toHaveLength(1)
    expect(result.reports[0]).toMatchObject({
      id: '00812345',
      lat: 39.95,
      lng: -75.16,
      department: 'Streets',
      mediaUrl: 'https://img.example.test/photo.jpg',
    })
  })

  it('returns null offsets when no Link header is present', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ issues: [] }))

    const result = await fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50 })

    expect(result.nextOffset).toBeNull()
    expect(result.lastOffset).toBeNull()
    expect(result.reports).toHaveLength(0)
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

  it('throws on non-ok response with the parsed error message', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(502, { error: 'Bad Gateway' }))

    await expect(fetchPage({ lat: 39.95, lng: -75.16, radius: 800, limit: 50 })).rejects.toThrow(
      'Bad Gateway',
    )
  })
})
