// ABOUTME: Tests for LandingPage — the Pinboard-powered finder for nearby 311 reports.
// ABOUTME: Mocks @pinboard/ui locally so the map library isn't loaded in vitest.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { useOpenIssuesStore } from '@/stores/openIssues'
import type { Report } from '@/composables/useNearbyReports'

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
    emits: ['search'],
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

const searchAddress = vi.fn()
vi.mock('@/composables/useAis', () => ({ searchAddress: (...a: unknown[]) => searchAddress(...a) }))

const initialReports: Report[] = [
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
  {
    id: '2',
    caseNumber: '2',
    lat: 39.96,
    lng: -75.17,
    serviceType: 'Graffiti Removal',
    status: 'Open',
    address: 'B',
    distance: 200,
  },
]

let ensureLoaded: ReturnType<typeof vi.spyOn>

import LandingPage from '../LandingPage.vue'
import FilterChips from '@/components/FilterChips.vue'

const globalStubs = {
  RouterLink: RouterLinkStub,
  FontAwesomeIcon: true,
  Tags: { props: ['text', 'color'], template: '<span class="tags-stub">{{ text }}</span>' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  const store = useOpenIssuesStore()
  ensureLoaded = vi.spyOn(store, 'ensureLoaded').mockResolvedValue(undefined)
  store.$patch({ reports: initialReports, byId: new Map(initialReports.map((r) => [r.id, r])) })
})

describe('LandingPage', () => {
  it('mounts the Pinboard with mapped locations after init', async () => {
    const w = mount(LandingPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    expect(w.find('.pinboard-stub').exists()).toBe(true)
    expect(w.find('.count').text()).toBe('2')
    expect(ensureLoaded).toHaveBeenCalled()
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

  it('FilterChips receives only the service types present in the data, prevalence-sorted', async () => {
    const w = mount(LandingPage, { global: { stubs: globalStubs } })
    await flushPromises()
    const chips = w.findComponent(FilterChips)
    // One option per service type in the data; tie on count breaks alphabetically.
    expect(
      (chips.props('options') as { value: string; label: string }[]).map((o) => o.value),
    ).toEqual(['Graffiti Removal', 'Pothole Repair'])
    expect(chips.props('modelValue')).toBe('all')
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
    ensureLoaded.mockClear()
    await w.find('.do-search').trigger('click')
    await flushPromises()
    expect(searchAddress).toHaveBeenCalledWith('1234 Market St')
    expect(ensureLoaded).not.toHaveBeenCalled()
  })

  it('selecting a category chip filters the location list; "All Filters" restores it', async () => {
    const w = mount(LandingPage, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(w.find('.count').text()).toBe('2')

    const chips = w.findComponent(FilterChips)
    await chips.vm.$emit('update:modelValue', 'Graffiti Removal')
    await flushPromises()
    expect(w.find('.count').text()).toBe('1')

    await chips.vm.$emit('update:modelValue', 'all')
    await flushPromises()
    expect(w.find('.count').text()).toBe('2')
  })
})
