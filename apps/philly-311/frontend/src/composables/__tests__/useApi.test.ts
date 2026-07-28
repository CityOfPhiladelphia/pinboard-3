// ABOUTME: Verifies useApi attaches headers, handles auth + retry, parses errors,
// ABOUTME: and respects the AbortController lifecycle.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Define controllable mocks for sso-vue + env BEFORE importing useApi.
const authState = {
  isAuthenticated: { value: false },
  acquireToken: vi.fn(async () => null as string | null),
}

vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
}))

import { useApi } from '../useApi'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

beforeEach(() => {
  fetchMock.mockReset()
  authState.isAuthenticated.value = false
  authState.acquireToken.mockReset()
  authState.acquireToken.mockResolvedValue(null)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useApi - URL building', () => {
  it('joins VITE_API_BASE_URL with opts.url', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })))
    const { fetchData } = useApi<{ ok: boolean }>({ url: '/private/key/health' })
    await fetchData()
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/private/key/health')
    expect(calledUrl.startsWith(import.meta.env.VITE_API_BASE_URL)).toBe(true)
  })

  it('appends query params, skipping undefined', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData } = useApi({
      url: '/x',
      query: { lat: 39.95, lng: -75.16, foo: undefined },
    })
    await fetchData()
    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.get('lat')).toBe('39.95')
    expect(url.searchParams.get('lng')).toBe('-75.16')
    expect(url.searchParams.has('foo')).toBe(false)
  })
})

describe('useApi - headers', () => {
  it('attaches x-api-key on every request', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData } = useApi({ url: '/x' })
    await fetchData()
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['x-api-key']).toBeTruthy()
  })

  it('sets content-type when body is provided', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData } = useApi({ url: '/x', method: 'POST', body: { hello: 1 } })
    await fetchData()
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ hello: 1 }))
  })

  it('attaches Authorization when authenticated', async () => {
    authState.isAuthenticated.value = true
    authState.acquireToken.mockResolvedValueOnce('TOKEN_A')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData } = useApi({ url: '/x' })
    await fetchData()
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer TOKEN_A')
  })

  it('does not attach Authorization when not authenticated', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData } = useApi({ url: '/x' })
    await fetchData()
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })
})

describe('useApi - 401 retry', () => {
  it('retries once with forceRefresh on 401 with bearer token', async () => {
    authState.isAuthenticated.value = true
    authState.acquireToken.mockResolvedValueOnce('STALE').mockResolvedValueOnce('FRESH')
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 1 })))

    const { fetchData, error } = useApi<{ ok: number }>({ url: '/x' })
    const result = await fetchData()

    expect(authState.acquireToken).toHaveBeenCalledTimes(2)
    expect(authState.acquireToken.mock.calls[1][0]).toEqual({ forceRefresh: true })
    expect(error.value).toBeNull()
    expect(result?.ok).toBe(1)
  })

  it('surfaces 401 as fatal after second attempt also fails', async () => {
    authState.isAuthenticated.value = true
    authState.acquireToken.mockResolvedValueOnce('STALE').mockResolvedValueOnce('STILL_STALE')
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const { fetchData, error } = useApi({ url: '/x' })
    await fetchData()

    expect(authState.acquireToken).toHaveBeenCalledTimes(2)
    expect(error.value?.status).toBe(401)
    expect(error.value?.message).toMatch(/unauth/i)
  })

  it('does not retry on 401 when no bearer token was attached', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    const { fetchData, error } = useApi({ url: '/x' })
    await fetchData()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(error.value?.status).toBe(401)
  })
})

describe('useApi - errors', () => {
  it('parses non-OK responses as ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Validation failed' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const { fetchData, error } = useApi({ url: '/x' })
    await fetchData()
    expect(error.value?.status).toBe(400)
    expect(error.value?.message).toBe('Validation failed')
  })

  it('surfaces network errors as ApiError(0, msg)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network down'))
    const { fetchData, error } = useApi({ url: '/x' })
    await fetchData()
    expect(error.value?.status).toBe(0)
    expect(error.value?.message).toBe('Network down')
  })

  it('returns null without surfacing error on AbortError', async () => {
    const abortErr = new Error('aborted')
    abortErr.name = 'AbortError'
    fetchMock.mockRejectedValueOnce(abortErr)
    const { fetchData, error } = useApi({ url: '/x' })
    const result = await fetchData()
    expect(result).toBeNull()
    expect(error.value).toBeNull()
  })
})

describe('useApi - lifecycle', () => {
  it('toggles isLoading around the request', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData, isLoading } = useApi({ url: '/x' })
    expect(isLoading.value).toBe(false)
    const p = fetchData()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
  })

  it('a new fetchData aborts the previous in-flight request', async () => {
    let firstSignal: AbortSignal | undefined
    fetchMock.mockImplementationOnce((_url, init) => {
      firstSignal = (init as RequestInit).signal as AbortSignal
      return new Promise(() => {
        /* never resolves */
      })
    })
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { fetchData } = useApi({ url: '/x' })
    fetchData()
    // Header-building is async (auth check), so fetch is invoked on a
    // later microtask; wait for it to register the signal before asserting.
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(firstSignal?.aborted).toBe(false)
    await fetchData()
    expect(firstSignal?.aborted).toBe(true)
  })
})
