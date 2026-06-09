import { describe, it, expect } from 'vitest'
import { faRoad, faDumpster, faLocationDot } from '@fortawesome/pro-solid-svg-icons'
import { serviceTypeIconDefinition } from './reportIcon'

describe('serviceTypeIconDefinition', () => {
  it('maps a known common-category service type to its FA icon', () => {
    expect(serviceTypeIconDefinition('Pothole Repair')).toBe(faRoad)
    expect(serviceTypeIconDefinition('Illegal Dumping')).toBe(faDumpster)
  })
  it('falls back to a neutral pin icon for unknown / missing types', () => {
    expect(serviceTypeIconDefinition('Some Unmapped Type')).toBe(faLocationDot)
    expect(serviceTypeIconDefinition(undefined)).toBe(faLocationDot)
  })
})
