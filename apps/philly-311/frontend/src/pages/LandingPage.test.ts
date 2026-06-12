// ABOUTME: Tests for LandingPage — the Pinboard-powered finder for nearby 311 reports.
// ABOUTME: Mocks @pinboard/ui locally so the map library isn't loaded in vitest.
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

vi.mock('@pinboard/ui', () => {
  const Pinboard = defineComponent({
    name: 'PinboardStub',
    props: [
      'locations',
      'searchOrUserLocation',
      'isLoading',
      'errorMessage',
      'locationPanelFilter',
      'locationPanelSearch',
    ],
    emits: ['selectedLocationsFilter', 'search'],
    setup:
      (props, { slots, emit }) =>
      () =>
        h('div', { class: 'pinboard-stub' }, [
          h('div', { class: 'count' }, String(props.locations.length)),
          h('div', {
            class: 'panel-filter-debug',
            'data-filter-set': String(props.locationPanelFilter != null),
          }),
          h('div', { class: 'header' }, slots['locations-header']?.()),
          h(
            'button',
            { class: 'do-search', onClick: () => emit('search', '1234 Market St') },
            'search',
          ),
          h(
            'div',
            { class: 'card-known' },
            slots['location-card']?.({
              location: { id: '1', name: 'Pothole Repair', latitude: 39.95, longitude: -75.16 },
            }) ?? [],
          ),
          h(
            'div',
            { class: 'card-unknown' },
            slots['location-card']?.({
              location: { id: 'unknown-xyz', name: 'Unknown Name', latitude: 0, longitude: 0 },
            }) ?? [],
          ),
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

const searchAddress = vi.fn()
vi.mock('@/composables/useAis', () => ({ searchAddress: (...a: unknown[]) => searchAddress(...a) }))
const loadArticles = vi.fn().mockResolvedValue({ items: [{ id: 'a1', title: 'Pothole help' }] })
vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticles }),
}))

import LandingPage from './LandingPage.vue'

const globalStubs = {
  RouterLink: RouterLinkStub,
  FontAwesomeIcon: true,
  Tags: { props: ['text', 'color'], template: '<span class="tags-stub">{{ text }}</span>' },
}

describe('LandingPage', () => {
  it('mounts the Pinboard with mapped locations after init', async () => {
    const w = mount(LandingPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    expect(w.find('.pinboard-stub').exists()).toBe(true)
    expect(w.find('.count').text()).toBe('1')
    expect(load).toHaveBeenCalled()
  })

  it('renders the report callout with "Start a report" CTA; trending articles are gone', async () => {
    searchAddress.mockResolvedValue(null)
    const w = mount(LandingPage, { global: { stubs: globalStubs } })
    await flushPromises()
    const header = w.find('.header')
    expect(header.text()).toContain('Report Issues Around You')
    expect(header.text()).toContain('Start a report')
    expect(header.text()).not.toContain('Trending articles')
    expect(header.find('.filter-chips').exists()).toBe(true)
  })

  it('FilterChips receives all category options with the initial all-filter selected', async () => {
    const w = mount(LandingPage, { global: { stubs: globalStubs } })
    await flushPromises()
    const chips = w.find('.header').findAll('button.filter-chips__chip')
    expect(chips.length).toBeGreaterThanOrEqual(11) // All Filters + 10 categories
    expect(chips[0].text()).toContain('All Filters')
    expect(chips[0].attributes('aria-pressed')).toBe('true')
    expect(chips.map((c) => c.text())).toEqual(expect.arrayContaining(['Pothole Repair']))
  })

  it('Pinboard does not receive locationPanelFilter', async () => {
    const w = mount(LandingPage, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(w.find('.panel-filter-debug').attributes('data-filter-set')).toBe('false')
  })

  it('location-card slot renders ReportListingCard for known report and plain text for unknown', async () => {
    const w = mount(LandingPage, { global: { stubs: globalStubs } })
    await flushPromises()
    const knownCard = w.find('.card-known')
    expect(knownCard.find('.listing-card').exists()).toBe(true)
    expect(knownCard.text()).toContain('Pothole Repair')
    const unknownCard = w.find('.card-unknown')
    expect(unknownCard.find('.listing-card').exists()).toBe(false)
    expect(unknownCard.text()).toContain('Unknown Name')
  })

  it('resolves a search query and recenters the finder', async () => {
    searchAddress.mockResolvedValue({ streetAddress: '1234 Market St', lat: 39.95, lng: -75.16 })
    const w = mount(LandingPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    load.mockClear()
    await w.find('.do-search').trigger('click')
    await flushPromises()
    expect(searchAddress).toHaveBeenCalledWith('1234 Market St')
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 39.95, lng: -75.16 }))
  })
})
