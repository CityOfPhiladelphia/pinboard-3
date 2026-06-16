// ABOUTME: Tests for the fuzzy scoring and matching utilities.
// ABOUTME: Verifies scoring tiers, keyword fallback, ranking order, and empty-query behaviour.
import { describe, it, expect } from 'vitest'
import { fuzzyScore, fuzzyMatch, type FuzzyMatchInput } from '../fuzzy'

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

describe('fuzzyMatch', () => {
  const inputs: FuzzyMatchInput<{ title: string }>[] = [
    {
      item: { title: 'Pothole Repair' },
      title: 'Pothole Repair',
      keywords: ['hole', 'crack', 'asphalt'],
    },
    {
      item: { title: 'Illegal Dumping' },
      title: 'Illegal Dumping',
      keywords: ['garbage', 'fly tipping'],
    },
    {
      item: { title: 'ADA Curb Ramp' },
      title: 'ADA Curb Ramp',
      keywords: ['wheelchair', 'accessible', 'disability'],
    },
  ]

  it('returns an empty array for an empty query', () => {
    expect(fuzzyMatch('', inputs)).toEqual([])
  })

  it('returns an empty array for a whitespace-only query', () => {
    expect(fuzzyMatch('   ', inputs)).toEqual([])
  })

  it('returns items, not input wrappers', () => {
    const results = fuzzyMatch('pothole', inputs)
    expect(results[0]).toEqual({ title: 'Pothole Repair' })
  })

  it('puts the best match first: pothole → Pothole Repair before others', () => {
    const results = fuzzyMatch('pothole', inputs)
    expect(results[0]).toEqual({ title: 'Pothole Repair' })
  })

  it('matches via keyword: "wheelchair" → ADA Curb Ramp', () => {
    const results = fuzzyMatch('wheelchair', inputs)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ title: 'ADA Curb Ramp' })
  })

  it('returns empty array when no inputs match', () => {
    expect(fuzzyMatch('zzzz', inputs)).toEqual([])
  })

  it('ranks title-prefix match above keyword match', () => {
    const mixed: FuzzyMatchInput<{ title: string }>[] = [
      { item: { title: 'Crack Filling' }, title: 'Crack Filling', keywords: [] },
      { item: { title: 'Pothole Repair' }, title: 'Pothole Repair', keywords: ['crack'] },
    ]
    const results = fuzzyMatch('crack', mixed)
    expect(results[0]).toEqual({ title: 'Crack Filling' })
  })
})
