// ABOUTME: Tests for LocationThumbnail — a small map thumbnail with a single pin,
// ABOUTME: with a placeholder fallback when coordinates are missing.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { IconCar, IconLocationDot } from '@phila/phila-ui-core/icons'
import LocationThumbnail from './LocationThumbnail.vue'

// Real map-core needs a MapLibre/WebGL context jsdom doesn't provide — stub it,
// rendering slot content through so a nested MapMarker still shows up for assertions.
vi.mock('@phila/phila-ui-map-core', () => ({
  Map: defineComponent({
    name: 'PhilaMap',
    props: ['center', 'zoom'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  MapMarker: defineComponent({
    name: 'MapMarker',
    props: ['lngLat'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  MapIconTextPin: defineComponent({
    name: 'MapIconTextPin',
    props: ['icon', 'color'],
    setup() {
      return () => h('div')
    },
  }),
}))

describe('LocationThumbnail', () => {
  it('renders a map centered on the given coordinates, with a pin at the same spot', () => {
    const w = mount(LocationThumbnail, { props: { latitude: 39.9526, longitude: -75.1652 } })
    const map = w.findComponent({ name: 'PhilaMap' })
    expect(map.exists()).toBe(true)
    expect(map.props('center')).toEqual([-75.1652, 39.9526])
    expect(w.findComponent({ name: 'MapMarker' }).props('lngLat')).toEqual([-75.1652, 39.9526])
  })

  it('defaults to zoom 16', () => {
    const w = mount(LocationThumbnail, { props: { latitude: 39.9526, longitude: -75.1652 } })
    expect(w.findComponent({ name: 'PhilaMap' }).props('zoom')).toBe(16)
  })

  it('respects a custom zoom', () => {
    const w = mount(LocationThumbnail, {
      props: { latitude: 39.9526, longitude: -75.1652, zoom: 14 },
    })
    expect(w.findComponent({ name: 'PhilaMap' }).props('zoom')).toBe(14)
  })

  it('passes icon and color through to the pin', () => {
    const w = mount(LocationThumbnail, {
      props: { latitude: 39.9526, longitude: -75.1652, icon: IconCar, color: '#734db3' },
    })
    const pin = w.findComponent({ name: 'MapIconTextPin' })
    // toStrictEqual, not toBe: Vue wraps an icon passed through mount()'s props
    // option in a reactive proxy, so the reference differs even though the
    // underlying component definition is the same (content-identical).
    expect(pin.props('icon')).toStrictEqual(IconCar)
    expect(pin.props('color')).toBe('#734db3')
  })

  it('falls back to a plain location-dot icon when no icon is given', () => {
    const w = mount(LocationThumbnail, { props: { latitude: 39.9526, longitude: -75.1652 } })
    expect(w.findComponent({ name: 'MapIconTextPin' }).props('icon')).toBe(IconLocationDot)
  })

  it('shows a placeholder icon instead of a map when coordinates are missing', () => {
    const w = mount(LocationThumbnail, { props: {} })
    expect(w.findComponent({ name: 'PhilaMap' }).exists()).toBe(false)
    const placeholder = w.find('.location-thumbnail__placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.findComponent({ name: 'Icon' }).props('icon')).toBe(IconLocationDot)
  })

  it('uses the given icon for the placeholder too', () => {
    const w = mount(LocationThumbnail, { props: { icon: IconCar } })
    const placeholder = w.find('.location-thumbnail__placeholder')
    // toStrictEqual — see note above.
    expect(placeholder.findComponent({ name: 'Icon' }).props('icon')).toStrictEqual(IconCar)
  })

  it('shows the placeholder when only one of latitude/longitude is given', () => {
    const w = mount(LocationThumbnail, { props: { latitude: 39.9526 } })
    expect(w.findComponent({ name: 'PhilaMap' }).exists()).toBe(false)
    expect(w.find('.location-thumbnail__placeholder').exists()).toBe(true)
  })
})
