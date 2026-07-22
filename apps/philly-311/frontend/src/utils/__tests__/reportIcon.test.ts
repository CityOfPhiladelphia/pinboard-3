import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { faRoad, faDumpster, faLocationDot } from '@fortawesome/pro-solid-svg-icons'
import { serviceTypeIconDefinition, serviceTypeIconComponent } from '../reportIcon'

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

describe('serviceTypeIconComponent', () => {
  it('returns a stable component identity per icon', () => {
    expect(serviceTypeIconComponent('Pothole Repair')).toBe(
      serviceTypeIconComponent('Pothole Repair'),
    )
    // Types sharing the fallback definition share one component.
    expect(serviceTypeIconComponent('Some Unmapped Type')).toBe(serviceTypeIconComponent(undefined))
    expect(serviceTypeIconComponent('Pothole Repair')).not.toBe(
      serviceTypeIconComponent('Illegal Dumping'),
    )
  })

  it('renders the FontAwesome svg for the mapped icon', () => {
    const w = mount(serviceTypeIconComponent('Pothole Repair'))
    expect(w.find('svg[data-icon="road"]').exists()).toBe(true)
  })

  it('passes through attrs such as class', () => {
    const w = mount(serviceTypeIconComponent('Pothole Repair'), {
      attrs: { class: 'pin-glyph' },
    })
    expect(w.find('svg').classes()).toContain('pin-glyph')
  })
})
