import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { IconRoad, IconBoxArchive, IconLocationDot } from '@phila/phila-ui-core/icons'
import { serviceTypeIconComponent } from '../reportIcon'

describe('serviceTypeIconComponent', () => {
  it('maps a known common-category service type to its phila icon', () => {
    expect(serviceTypeIconComponent('Pothole Repair')).toBe(IconRoad)
    expect(serviceTypeIconComponent('Illegal Dumping')).toBe(IconBoxArchive)
  })

  it('falls back to a neutral pin icon for unknown / missing types', () => {
    expect(serviceTypeIconComponent('Some Unmapped Type')).toBe(IconLocationDot)
    expect(serviceTypeIconComponent(undefined)).toBe(IconLocationDot)
  })

  it('returns a stable component identity per icon', () => {
    expect(serviceTypeIconComponent('Pothole Repair')).toBe(
      serviceTypeIconComponent('Pothole Repair'),
    )
    expect(serviceTypeIconComponent('Some Unmapped Type')).toBe(serviceTypeIconComponent(undefined))
    expect(serviceTypeIconComponent('Pothole Repair')).not.toBe(
      serviceTypeIconComponent('Illegal Dumping'),
    )
  })

  it('renders an svg and passes through attrs such as class', () => {
    const w = mount(serviceTypeIconComponent('Pothole Repair'), {
      attrs: { class: 'pin-glyph' },
    })
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('svg').classes()).toContain('pin-glyph')
  })
})
