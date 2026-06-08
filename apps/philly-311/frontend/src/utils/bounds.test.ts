// ABOUTME: Tests for the Philly bounding-box check.
// ABOUTME: Covers center city (in bounds), Wilmington (south), and NJ (east).
import { describe, it, expect } from 'vitest'
import { isInPhilly } from './bounds'

describe('isInPhilly', () => {
  it('returns true for Center City coordinates', () => {
    // Broad & Market, Philadelphia PA
    expect(isInPhilly(39.9526, -75.1652)).toBe(true)
  })

  it('returns false for Wilmington, DE (south of Philly)', () => {
    expect(isInPhilly(39.7447, -75.5484)).toBe(false)
  })

  it('returns false for Atlantic City, NJ (east of Philly)', () => {
    // The AABB has known false positives for nearby NJ towns (Cherry Hill etc.);
    // a tighter polygon would help. For v1, AC is far enough east to clear the box.
    expect(isInPhilly(39.3643, -74.4229)).toBe(false)
  })
})
