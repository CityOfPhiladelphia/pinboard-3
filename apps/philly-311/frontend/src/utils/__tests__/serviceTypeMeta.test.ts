// ABOUTME: Tests serviceTypeMeta — known mappings + neutral fallback for unknowns.
import { describe, it, expect } from 'vitest'
import { serviceTypeColor, serviceTypeIcon } from '../serviceTypeMeta'

describe('serviceTypeColor', () => {
  it('returns the mapped hex color for a known service type', () => {
    expect(serviceTypeColor('Pothole Repair')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(serviceTypeColor('Illegal Dumping')).not.toBe(serviceTypeColor('Tree Maintenance'))
  })

  it('returns the neutral fallback for unknown types', () => {
    expect(serviceTypeColor('Made-Up Type')).toBe('#666673')
  })

  it('returns the fallback when the service type is missing', () => {
    expect(serviceTypeColor(undefined)).toBe('#666673')
    expect(serviceTypeColor(null)).toBe('#666673')
    expect(serviceTypeColor('')).toBe('#666673')
  })
})

describe('serviceTypeIcon', () => {
  it('returns the mapped Material Symbols icon name for a known type', () => {
    expect(serviceTypeIcon('Pothole Repair')).toBe('construction')
    expect(serviceTypeIcon('Tree Maintenance')).toBe('park')
    expect(serviceTypeIcon('Abandoned Vehicle')).toBe('directions_car')
  })

  it('returns the help fallback for unknown types', () => {
    expect(serviceTypeIcon('Made-Up Type')).toBe('help')
  })

  it('returns the fallback when the service type is missing', () => {
    expect(serviceTypeIcon(undefined)).toBe('help')
    expect(serviceTypeIcon(null)).toBe('help')
    expect(serviceTypeIcon('')).toBe('help')
  })
})
