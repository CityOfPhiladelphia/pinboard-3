// ABOUTME: Tests api311Url + api311Headers — base+path joining, query encoding,
// ABOUTME: x-api-key always, Bearer when authenticated, content-type opt-in.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { api311Url, api311Headers } from './api311'

const auth = {
  isAuthenticated: { value: false },
  acquireToken: vi.fn(async () => null as string | null),
}

beforeEach(() => {
  auth.isAuthenticated.value = false
  auth.acquireToken.mockReset()
  auth.acquireToken.mockResolvedValue(null)
})

describe('api311Url', () => {
  it('concatenates the base onto an absolute path', () => {
    expect(api311Url('/private/key/health')).toBe(
      `${import.meta.env.VITE_API_BASE_URL}/private/key/health`,
    )
  })

  it('adds a leading slash when missing', () => {
    expect(api311Url('private/key/health')).toBe(
      `${import.meta.env.VITE_API_BASE_URL}/private/key/health`,
    )
  })

  it('preserves the stage path on the base', () => {
    // VITE_API_BASE_URL in tests is https://api.example.test; verify the path
    // segment is appended, not "swallowed" by URL parsing.
    const base = import.meta.env.VITE_API_BASE_URL
    expect(api311Url('/x')).toBe(`${base}/x`)
  })

  it('strips a trailing slash on the base before joining', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/test/')
    try {
      expect(api311Url('/x')).toBe('https://api.example.test/test/x')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('encodes query params and skips undefined', () => {
    const url = new URL(api311Url('/x', { lat: 39.95, lng: -75.16, foo: undefined }))
    expect(url.searchParams.get('lat')).toBe('39.95')
    expect(url.searchParams.get('lng')).toBe('-75.16')
    expect(url.searchParams.has('foo')).toBe(false)
  })

  it('omits the question mark when the query object yields no params', () => {
    const url = api311Url('/x', { foo: undefined })
    expect(url.endsWith('/x')).toBe(true)
  })
})

describe('api311Headers', () => {
  it('always includes x-api-key', async () => {
    const h = await api311Headers()
    expect(h['x-api-key']).toBeTruthy()
  })

  it('omits Authorization when not authenticated', async () => {
    const h = await api311Headers({ auth })
    expect(h['Authorization']).toBeUndefined()
  })

  it('attaches Bearer token when authenticated', async () => {
    auth.isAuthenticated.value = true
    auth.acquireToken.mockResolvedValueOnce('TOKEN')
    const h = await api311Headers({ auth })
    expect(h['Authorization']).toBe('Bearer TOKEN')
  })

  it('forwards forceRefreshToken into acquireToken', async () => {
    auth.isAuthenticated.value = true
    auth.acquireToken.mockResolvedValueOnce('FRESH')
    await api311Headers({ auth, forceRefreshToken: true })
    expect(auth.acquireToken).toHaveBeenCalledWith({ forceRefresh: true })
  })

  it('only sets content-type when opt-in', async () => {
    const h1 = await api311Headers()
    expect(h1['content-type']).toBeUndefined()
    const h2 = await api311Headers({ contentType: 'application/json' })
    expect(h2['content-type']).toBe('application/json')
  })
})
