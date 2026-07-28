// ABOUTME: Tests for useServiceTypes — verifies caching behaviour, list ref population,
// ABOUTME: cache reset, and error handling on non-OK responses.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useServiceTypes, _resetServiceTypesCache } from '../useServiceTypes'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

const FAKE_SERVICE_TYPES = [
  {
    serviceType: 'Pothole Repair',
    caseType: 'Pothole',
    description: 'Hole in road',
    recordTypeID: 'abc',
    department: 'Streets',
    questions: [],
  },
  {
    serviceType: 'Illegal Dumping',
    caseType: 'Dumping',
    description: 'Illegal trash',
    recordTypeID: 'def',
    department: 'Sanitation',
    questions: [],
  },
]

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
  _resetServiceTypesCache()
})

describe('useServiceTypes - initial state', () => {
  it('list.value is null before load() is called', () => {
    const { list } = useServiceTypes()
    expect(list.value).toBeNull()
  })

  it('isLoading is false before load()', () => {
    const { isLoading } = useServiceTypes()
    expect(isLoading.value).toBe(false)
  })
})

describe('useServiceTypes - load()', () => {
  it('returns the service types array on success', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    const { load } = useServiceTypes()
    const result = await load()
    expect(result).toEqual(FAKE_SERVICE_TYPES)
  })

  it('populates list.value after load()', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    const { load, list } = useServiceTypes()
    expect(list.value).toBeNull()
    await load()
    expect(list.value).toEqual(FAKE_SERVICE_TYPES)
  })

  it('makes exactly one network request across two load() calls', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    const { load } = useServiceTypes()
    await load()
    await load()
    expect(fetchMock.mock.calls.length).toBe(1)
  })

  it('second load() returns the cached array without a new fetch', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    const { load } = useServiceTypes()
    await load()
    const second = await load()
    expect(second).toEqual(FAKE_SERVICE_TYPES)
  })

  it('second composable instance shares the same cache', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    await useServiceTypes().load()
    // A second composable instance should not fetch again
    await useServiceTypes().load()
    expect(fetchMock.mock.calls.length).toBe(1)
  })
})

describe('useServiceTypes - cache reset', () => {
  it('_resetServiceTypesCache() causes the next load() to fetch again', async () => {
    fetchMock.mockResolvedValue(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    const { load } = useServiceTypes()
    await load()
    _resetServiceTypesCache()
    await useServiceTypes().load()
    expect(fetchMock.mock.calls.length).toBe(2)
  })

  it('list.value is null after cache reset', () => {
    _resetServiceTypesCache()
    const { list } = useServiceTypes()
    expect(list.value).toBeNull()
  })
})

describe('useServiceTypes - error handling', () => {
  it('returns null when the API responds with a non-OK status', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(500, { error: 'Server error' }))
    const { load } = useServiceTypes()
    const result = await load()
    expect(result).toBeNull()
  })

  it('populates error.value on API failure', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(500, { error: 'Server error' }))
    const { load, error } = useServiceTypes()
    await load()
    expect(error.value).not.toBeNull()
    expect(error.value?.status).toBe(500)
  })

  it('does not cache on API error — next load() retries', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(500, { error: 'Server error' }))
      .mockResolvedValueOnce(okResponse({ serviceTypes: FAKE_SERVICE_TYPES }))
    const { load } = useServiceTypes()
    const first = await load()
    expect(first).toBeNull()
    const second = await useServiceTypes().load()
    expect(second).toEqual(FAKE_SERVICE_TYPES)
    expect(fetchMock.mock.calls.length).toBe(2)
  })
})
