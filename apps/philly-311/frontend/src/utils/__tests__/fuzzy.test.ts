// ABOUTME: Tests for the fuzzy scoring utility.
// ABOUTME: Verifies scoring tiers, keyword fallback, and empty-query behaviour.
import { describe, it, expect } from 'vitest'
import { fuzzyScore } from '../fuzzy'

describe('fuzzyScore', () => {
  it('returns 0 for an empty query', () => {
    expect(fuzzyScore('', 'Pothole Repair')).toBe(0)
  })

  it('returns 0 for a whitespace-only query', () => {
    expect(fuzzyScore('   ', 'Pothole Repair')).toBe(0)
  })

  it('returns 100 for an exact match (case-insensitive)', () => {
    expect(fuzzyScore('pothole repair', 'Pothole Repair')).toBe(100)
  })

  it('returns 80 for a word-prefix match', () => {
    expect(fuzzyScore('pot', 'Pothole Repair')).toBe(80)
  })

  it('returns 60 for a title substring match that is not a word prefix', () => {
    // "hole" appears inside "Pothole" but does not start a word
    expect(fuzzyScore('hole', 'Pothole Repair')).toBe(60)
  })

  it('returns 40 for a keyword-prefix match', () => {
    // "wheelchair" is a keyword for ADA Curb Ramp
    expect(fuzzyScore('wheel', 'ADA Curb Ramp', ['wheelchair', 'accessible'])).toBe(40)
  })

  it('returns 20 for a keyword-substring match', () => {
    expect(fuzzyScore('chair', 'ADA Curb Ramp', ['wheelchair', 'accessible'])).toBe(20)
  })

  it('returns 0 when there is no match in title or keywords', () => {
    expect(fuzzyScore('zzzz', 'Pothole Repair', ['hole', 'crack'])).toBe(0)
  })

  it('exact match scores higher than word-prefix', () => {
    const exact = fuzzyScore('pothole repair', 'Pothole Repair')
    const prefix = fuzzyScore('pot', 'Pothole Repair')
    expect(exact).toBeGreaterThan(prefix)
  })

  it('word-prefix scores higher than keyword match', () => {
    const prefix = fuzzyScore('pot', 'Pothole Repair', ['pothole'])
    const keyword = fuzzyScore('crack', 'Pothole Repair', ['crack'])
    expect(prefix).toBeGreaterThan(keyword)
  })

  it('substring in title scores at least as high as keyword-prefix', () => {
    const titleSub = fuzzyScore('hole', 'Pothole Repair', [])
    const kwPrefix = fuzzyScore('cra', 'Pothole Repair', ['crack'])
    expect(titleSub).toBeGreaterThanOrEqual(kwPrefix)
  })
})
