// ABOUTME: Tests for the philly-311 route table — verifies all routes resolve correctly.
// ABOUTME: Uses createMemoryHistory to avoid guard dependencies (sso/Pinia).
import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from './index'

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

describe('routes', () => {
  it('resolves the report placeholder', () => {
    const r = makeRouter()
    expect(r.resolve('/report').matched).toHaveLength(1)
  })
  it('resolves an answer placeholder with an id param', () => {
    const r = makeRouter()
    const resolved = r.resolve('/answers/abc123')
    expect(resolved.matched).toHaveLength(1)
    expect(resolved.params.id).toBe('abc123')
  })
})
