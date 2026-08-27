// ABOUTME: Tests serviceTypeIconComponent — kept in parity with iOS (ServiceType.swift)
// ABOUTME: and Android (ServiceTypeIcon.kt) icon choices; neutral pin as fallback.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  IconBagShopping,
  IconBicycle,
  IconCar,
  IconCartShopping,
  IconCircleChevronDown,
  IconCircleDot,
  IconCircleUp,
  IconCircleXmark,
  IconDumpster,
  IconEllipsis,
  IconHammer,
  IconHotel,
  IconLocationDot,
  IconMoon,
  IconOctagon,
  IconPaintbrush,
  IconPaw,
  IconPersonDigging,
  IconRecycle,
  IconSmog,
  IconSnowplow,
  IconTent,
  IconTrafficLight,
  IconTrashCan,
} from '@phila/phila-ui-core/icons'
import type { IconComponent } from '@phila/phila-ui-core/icons'
import { serviceTypeIconComponent } from '../reportIcon'

describe('serviceTypeIconComponent', () => {
  it.each<[string, IconComponent]>([
    ['Abandoned Vehicle', IconCar],
    ['Abandoned Bike', IconBicycle],
    ['Recyclables Collection', IconRecycle],
    ['Dumpster Violation', IconDumpster],
    ['Pothole Repair', IconPersonDigging],
    ['Depression', IconCircleChevronDown],
    ['Push-Up', IconCircleUp],
    ['Line Striping', IconTrafficLight],
    ['Alley Light Outage', IconMoon],
    ['Stop Sign Repair', IconOctagon],
    ['Graffiti Removal', IconPaintbrush],
    ['Dead Animal in Street', IconPaw],
    ['Smoke Detector', IconSmog],
    ['Manhole Cover Missing', IconCircleDot],
    ['Manhole Other Problem', IconCircleXmark],
    ['Homeless Encampment', IconTent],
    ['Demolition Complaint', IconHammer],
    ['Snow Removal', IconSnowplow],
    ['Other (Streets)', IconEllipsis],
    ['Vendor Complaint', IconCartShopping],
    ['Short Term Rental Complaint', IconHotel],
    ['Plastic Bag Complaint', IconBagShopping],
  ])('maps %s to the icon iOS/Android use for it', (serviceType, icon) => {
    expect(serviceTypeIconComponent(serviceType)).toBe(icon)
  })

  it('shares one trash icon between Illegal Dumping and Rubbish Collection, like native', () => {
    expect(serviceTypeIconComponent('Illegal Dumping')).toBe(IconTrashCan)
    expect(serviceTypeIconComponent('Rubbish Collection')).toBe(IconTrashCan)
  })

  it('falls back to a neutral pin icon for unknown / missing types', () => {
    expect(serviceTypeIconComponent('Some Unmapped Type')).toBe(IconLocationDot)
    expect(serviceTypeIconComponent(undefined)).toBe(IconLocationDot)
  })

  it('returns a stable component identity per icon', () => {
    expect(serviceTypeIconComponent('Abandoned Vehicle')).toBe(
      serviceTypeIconComponent('Abandoned Vehicle'),
    )
    expect(serviceTypeIconComponent('Some Unmapped Type')).toBe(serviceTypeIconComponent(undefined))
    expect(serviceTypeIconComponent('Abandoned Vehicle')).not.toBe(
      serviceTypeIconComponent('Recyclables Collection'),
    )
  })

  it('renders an svg and passes through attrs such as class', () => {
    const w = mount(serviceTypeIconComponent('Abandoned Vehicle'), {
      attrs: { class: 'pin-glyph' },
    })
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('svg').classes()).toContain('pin-glyph')
  })
})
