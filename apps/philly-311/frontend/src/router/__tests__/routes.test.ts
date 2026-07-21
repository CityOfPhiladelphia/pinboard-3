// ABOUTME: Tests for the philly-311 route table — verifies all routes resolve correctly.
// ABOUTME: Uses createMemoryHistory to avoid guard dependencies (sso/Pinia).
import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '../index'

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

describe('routes', () => {
  it('resolves the report wizard shell + index (image) step', () => {
    const r = makeRouter()
    const resolved = r.resolve('/report')
    expect(resolved.matched).toHaveLength(2) // parent ReportPage + index ImageStep
  })
  it('resolves the wizard sub-steps', () => {
    const r = makeRouter()
    for (const p of [
      '/report/issue-type',
      '/report/location',
      '/report/details',
      '/report/review',
    ]) {
      expect(r.resolve(p).matched.length).toBeGreaterThanOrEqual(2)
    }
  })
  it('resolves an answer placeholder with an id param', () => {
    const r = makeRouter()
    const resolved = r.resolve('/answers/abc123')
    expect(resolved.matched).toHaveLength(1)
    expect(resolved.params.id).toBe('abc123')
  })
  it('resolves the confirmation page outside the wizard shell', () => {
    const r = makeRouter()
    const resolved = r.resolve('/report/confirmation')
    expect(resolved.matched).toHaveLength(1) // standalone — no ReportPage parent
  })
  it('resolves the reports stub page', () => {
    const r = makeRouter()
    expect(r.resolve('/reports').matched).toHaveLength(1)
  })
})
