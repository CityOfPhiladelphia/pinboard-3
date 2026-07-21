// ABOUTME: Tests buildUrl — base+path joining, query encoding, trailing/leading
// ABOUTME: slash handling. Header + auth behavior is covered via useApi.test.ts.
import { describe, expect, it } from 'vitest'
import { buildUrl } from '../api311'

describe('buildUrl', () => {
  it('concatenates the base onto an absolute path', () => {
    expect(buildUrl('https://api.example.test', '/private/key/health')).toBe(
      'https://api.example.test/private/key/health',
    )
  })

  it('adds a leading slash when missing', () => {
    expect(buildUrl('https://api.example.test', 'private/key/health')).toBe(
      'https://api.example.test/private/key/health',
    )
  })

  it('preserves the stage path on the base', () => {
    // Verify the path segment is appended, not "swallowed" by URL parsing.
    expect(buildUrl('https://api.example.test/test', '/x')).toBe('https://api.example.test/test/x')
  })

  it('strips a trailing slash on the base before joining', () => {
    expect(buildUrl('https://api.example.test/test/', '/x')).toBe('https://api.example.test/test/x')
  })

  it('encodes query params and skips undefined', () => {
    const url = new URL(buildUrl('https://api.example.test', '/x', { lat: 39.95, lng: -75.16, foo: undefined }))
    expect(url.searchParams.get('lat')).toBe('39.95')
    expect(url.searchParams.get('lng')).toBe('-75.16')
    expect(url.searchParams.has('foo')).toBe(false)
  })

  it('omits the question mark when the query object yields no params', () => {
    const url = buildUrl('https://api.example.test', '/x', { foo: undefined })
    expect(url.endsWith('/x')).toBe(true)
  })
})
