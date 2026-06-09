// ABOUTME: Tests for LandingPage — the Pinboard-powered finder for nearby 311 reports.
// ABOUTME: Mocks @pinboard/ui locally so the map library isn't loaded in vitest.
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@pinboard/ui', () => {
  const Pinboard = defineComponent({
    name: 'PinboardStub',
    props: [
      'locations',
      'searchOrUserLocation',
      'isLoading',
      'errorMessage',
      'locationPanelFilter',
    ],
    emits: ['selectedLocationsFilter'],
    setup:
      (props, { slots }) =>
      () =>
        h('div', { class: 'pinboard-stub' }, [
          h('div', { class: 'count' }, String(props.locations.length)),
          slots['map-content']?.({
            map: null,
            zoom: 12,
            isMobile: false,
            hoveredId: null,
            selectedId: null,
            mobileControlsTarget: null,
            mobileControlsTargetLeft: null,
            onHover: () => {},
            onHoverEnd: () => {},
            onSelect: () => {},
          }),
        ]),
  })
  const passthrough = (name: string) =>
    defineComponent({
      name,
      setup:
        (_p, { slots }) =>
        () =>
          h('div', slots.default?.()),
    })
  return {
    Pinboard,
    MapMarker: passthrough('MapMarker'),
    MapIconTextPin: passthrough('MapIconTextPin'),
    MapNavigationControl: passthrough('MapNavigationControl'),
    GeolocationButton: passthrough('GeolocationButton'),
    BasemapToggle: passthrough('BasemapToggle'),
  }
})
vi.mock('@/composables/useGeolocation', () => ({
  getCurrentPosition: vi.fn().mockResolvedValue(null),
}))
const load = vi.fn().mockResolvedValue([])
vi.mock('@/composables/useNearbyReports', () => ({
  useNearbyReports: () => ({
    reports: {
      value: [
        {
          id: '1',
          caseNumber: '1',
          lat: 39.95,
          lng: -75.16,
          serviceType: 'Pothole Repair',
          status: 'Open',
          address: 'A',
          distance: 100,
        },
      ],
    },
    isLoading: { value: false },
    error: { value: null },
    load,
  }),
}))

import LandingPage from './LandingPage.vue'

describe('LandingPage', () => {
  it('mounts the Pinboard with mapped locations after init', async () => {
    const w = mount(LandingPage)
    await flushPromises()
    expect(w.find('.pinboard-stub').exists()).toBe(true)
    expect(w.find('.count').text()).toBe('1')
    expect(load).toHaveBeenCalled()
  })
})
