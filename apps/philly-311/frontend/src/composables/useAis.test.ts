// ABOUTME: Tests for the AIS composable — autocomplete, address search, and
// ABOUTME: reverse geocoding against mocked fetch responses.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { autocompleteAddresses, searchAddress, reverseGeocode } from './useAis'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

beforeEach(() => {
  fetchMock.mockReset()
})

describe('autocompleteAddresses', () => {
  it('returns mapped results from the API', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: {
            addresses: [
              { address: '1234 MARKET ST', search_address: '1234 MARKET ST' },
              { address: '1234 MARKET ST UNIT 2', search_address: '1234 MARKET ST UNIT 2' },
            ],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const results = await autocompleteAddresses('1234')
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' })
    expect(results[1]).toEqual({
      address: '1234 MARKET ST UNIT 2',
      searchAddress: '1234 MARKET ST UNIT 2',
    })
  })

  it('returns empty array without fetching when query is empty', async () => {
    const results = await autocompleteAddresses('   ')
    expect(results).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when the API returns a non-ok status', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    await expect(autocompleteAddresses('1234')).rejects.toThrow('AIS autocomplete failed: 500')
  })

  it('includes the q param in the autocomplete URL', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: { addresses: [] } }), { status: 200 }),
    )
    await autocompleteAddresses('broad st')
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('q')).toBe('broad st')
    expect(calledUrl.pathname).toBe('/autocomplete')
  })
})

describe('searchAddress', () => {
  it('returns a mapped AisFeature for a valid address', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          features: [
            {
              geometry: { coordinates: [-75.1652, 39.9526] },
              properties: { street_address: '1234 MARKET ST', zip_code: '19107' },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const feature = await searchAddress('1234 MARKET ST')
    expect(feature).toEqual({
      streetAddress: '1234 MARKET ST',
      zipCode: '19107',
      lat: 39.9526,
      lng: -75.1652,
    })
  })

  it('appends gatekeeperKey query param', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ features: [] }), { status: 200 }))
    await searchAddress('1234 MARKET ST')
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('gatekeeperKey')).toBe('test-gatekeeper')
  })

  it('returns null when the API returns a 4xx status', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }))
    const result = await searchAddress('unknown address')
    expect(result).toBeNull()
  })

  it('returns null when features array is empty', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ features: [] }), { status: 200 }))
    const result = await searchAddress('1234 MARKET ST')
    expect(result).toBeNull()
  })
})

describe('reverseGeocode', () => {
  it('builds URL with lng,lat path (lng first, percent-encoded)', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ features: [] }), { status: 200 }))
    await reverseGeocode(39.95, -75.16)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    // The path segment must be /-75.16%2C39.95 (lng,lat encoded)
    expect(calledUrl).toContain('/search/-75.16%2C39.95')
  })

  it('appends gatekeeperKey query param', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ features: [] }), { status: 200 }))
    await reverseGeocode(39.95, -75.16)
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('gatekeeperKey')).toBe('test-gatekeeper')
  })

  it('returns a mapped AisFeature on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          features: [
            {
              geometry: { coordinates: [-75.16, 39.95] },
              properties: { street_address: '100 BROAD ST', zip_code: '19102' },
            },
          ],
        }),
        { status: 200 },
      ),
    )
    const feature = await reverseGeocode(39.95, -75.16)
    expect(feature).toEqual({
      streetAddress: '100 BROAD ST',
      zipCode: '19102',
      lat: 39.95,
      lng: -75.16,
    })
  })
})
