// ABOUTME: Tests serviceTypeMeta — known mappings + neutral fallback for unknowns.
import { describe, it, expect } from 'vitest'
import { serviceTypeColor, serviceTypeTintStyle } from '../serviceTypeMeta'

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

describe('serviceTypeTintStyle', () => {
  it('mixes the type color at 15% into the background and uses it plain for the icon', () => {
    const color = serviceTypeColor('Pothole Repair')
    expect(serviceTypeTintStyle('Pothole Repair')).toEqual({
      backgroundColor: `color-mix(in srgb, ${color} 15%, white)`,
      color,
    })
  })

  it('falls back to the neutral color for an unknown service type', () => {
    expect(serviceTypeTintStyle('Made-Up Type').color).toBe('#666673')
  })
})
