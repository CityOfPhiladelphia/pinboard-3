// ABOUTME: Tests for LocationAccuracyCircle — verifies the MapMarker is placed at the
// ABOUTME: fix's lng/lat, the circle recenters itself purely via CSS (map-core's
// ABOUTME: MapMarker only reads `offset` once, at creation — it can't track zoom), and
// ABOUTME: the circle div is sized in pixels from the accuracy radius at that latitude/zoom.
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { accuracyRadiusPixels } from '@/utils/geoAccuracy'

const mapMarkerProps = vi.fn()
vi.mock('@pinboard/ui', () => ({
  MapMarker: defineComponent({
    name: 'MapMarkerStub',
    props: ['lngLat', 'offset'],
    setup: (props, { slots }) => {
      mapMarkerProps(props)
      return () => h('div', { class: 'map-marker-stub' }, slots.default?.())
    },
  }),
}))

import LocationAccuracyCircle from '../LocationAccuracyCircle.vue'

describe('LocationAccuracyCircle', () => {
  it('places the MapMarker at the fix lng/lat and passes no offset', () => {
    mount(LocationAccuracyCircle, {
      props: { latitude: 39.95, longitude: -75.16, accuracy: 10, zoom: 16 },
    })
    expect(mapMarkerProps).toHaveBeenCalledWith(
      expect.objectContaining({ lngLat: [-75.16, 39.95], offset: undefined }),
    )
  })

  it('recenters the circle on the bottom-anchored marker via translateY(50%)', () => {
    const w = mount(LocationAccuracyCircle, {
      props: { latitude: 39.95, longitude: -75.16, accuracy: 10, zoom: 16 },
    })
    expect(w.find('.location-accuracy-circle').attributes('style')).toContain(
      'transform: translateY(50%)',
    )
  })

  it('sizes the circle div to the pixel diameter of the accuracy radius', () => {
    const w = mount(LocationAccuracyCircle, {
      props: { latitude: 39.95, longitude: -75.16, accuracy: 10, zoom: 16 },
    })
    const radius = accuracyRadiusPixels(10, 39.95, 16)
    const circle = w.find('.location-accuracy-circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('style')).toContain(`width: ${(radius * 2).toFixed(2)}px`)
    expect(circle.attributes('style')).toContain(`height: ${(radius * 2).toFixed(2)}px`)
  })

  it('recomputes the diameter when zoom changes', async () => {
    const w = mount(LocationAccuracyCircle, {
      props: { latitude: 39.95, longitude: -75.16, accuracy: 10, zoom: 16 },
    })
    await w.setProps({ zoom: 17 })
    const radius = accuracyRadiusPixels(10, 39.95, 17)
    expect(w.find('.location-accuracy-circle').attributes('style')).toContain(
      `width: ${(radius * 2).toFixed(2)}px`,
    )
  })
})
