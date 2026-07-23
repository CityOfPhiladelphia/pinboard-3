// ABOUTME: Tests for PinboardBody's slot-forwarding seam — the locations-filters
// ABOUTME: slot and count-noun prop must actually reach LocationsPanel, per path.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import PinboardBody from './PinboardBody.vue'
import type { BasicLocation, MapCardPropsGetter } from '../types'

// MapPanel pulls in the real @phila/phila-ui-map-core (maplibre) chain, which
// isn't needed for these slot/prop-forwarding assertions and is noisy under jsdom.
vi.mock('./MapPanel.vue', () => ({
  default: { name: 'MapPanel', template: '<div class="map-panel-stub" />' },
}))

const MapCardStub = {
  name: 'MapCard',
  props: ['heading', 'subheader'],
  template: '<div class="mapcard-stub">{{ heading }}</div>',
}

const BottomSheetStub = {
  name: 'BottomSheet',
  template: '<div class="bottom-sheet-stub"><slot /></div>',
}

function locations(): BasicLocation[] {
  return [
    { id: 'a1', name: 'Pothole Repair', latitude: 39.95, longitude: -75.16 },
    { id: 'b2', name: 'Graffiti Removal', latitude: 39.96, longitude: -75.17 },
  ]
}

const getMapCardProps: MapCardPropsGetter<BasicLocation> = (location) => ({
  heading: location.name,
})

const mounted: { wrapper: VueWrapper; container: HTMLElement }[] = []

afterEach(() => {
  mounted.forEach(({ wrapper, container }) => {
    wrapper.unmount()
    container.remove()
  })
  mounted.length = 0
})

// On mobile, LocationsPanel is Teleported to #locations-panel-mobile — an id
// PinboardBody renders itself, inside the bottom sheet. Vue's Teleport can only
// resolve a target that (a) already exists in the real `document` (hence
// attachTo, not VTU's default detached container) and (b) was created in an
// earlier patch than the Teleport itself. The real app satisfies (b) for free
// because it boots with isLoading true and flips false once data loads, so the
// bottom sheet (and #locations-panel-mobile within it) is already in the DOM
// by the time Teleport activates. Mounting straight to isLoading: false skips
// that first patch and Teleport fails to find its target — so every mount here
// replays the same isLoading true → false sequence.
async function mountPinboardBody(
  extraProps: Record<string, unknown> & { isLoading?: string | false } = {}
) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const { isLoading = false, ...rest } = extraProps
  const wrapper = mount(PinboardBody, {
    attachTo: container,
    props: {
      locations: locations(),
      getMapCardProps,
      isMobile: false,
      searchOrUserLocation: { latitude: NaN, longitude: NaN },
      isLoading: 'Loading locations…',
      errorMessage: null,
      locationPanelSearch: 'Search by address or ZIP',
      ...rest,
    },
    slots: {
      'locations-header': '<div class="my-header">Header</div>',
      'locations-filters': '<div class="my-filters">Chips</div>',
    },
    global: {
      stubs: { MapCard: MapCardStub, BottomSheet: BottomSheetStub },
    },
  })
  await wrapper.setProps({ isLoading })
  await nextTick()
  mounted.push({ wrapper: wrapper as VueWrapper, container })
  return wrapper as VueWrapper
}

describe('PinboardBody - locations-filters slot forwarding (desktop)', () => {
  it('renders filters slot content between the search box and the location list', async () => {
    const w = await mountPinboardBody({ isMobile: false })
    const desktop = w.find('.finder-panel-locations')
    const html = desktop.html()
    const searchIdx = html.indexOf('location-search')
    const filtersIdx = html.indexOf('my-filters')
    const listIdx = html.indexOf('location-list')
    expect(searchIdx).toBeGreaterThan(-1)
    expect(searchIdx).toBeLessThan(filtersIdx)
    expect(filtersIdx).toBeLessThan(listIdx)
  })
})

// The mobile-only DOM (behind the `isMobile: true` prop) is a single Teleported
// LocationsPanel instance rather than a second separate mount — the Teleport's
// target (#locations-panel-mobile) lives inside the bottom sheet, so setting
// isMobile true moves the same LocationsPanel (and its forwarded filters slot)
// there instead of a second component tree.
describe('PinboardBody - locations-filters slot forwarding (mobile bottom sheet)', () => {
  it('renders filters slot content after locations-header content', async () => {
    const w = await mountPinboardBody({ isMobile: true })
    const sheet = w.find('.bottom-sheet-stub')
    const html = sheet.html()
    const headerIdx = html.indexOf('my-header')
    const filtersIdx = html.indexOf('my-filters')
    expect(headerIdx).toBeGreaterThan(-1)
    expect(headerIdx).toBeLessThan(filtersIdx)
    // LocationsPanel itself teleported into the sheet, not just the raw slot.
    expect(sheet.findAll('.mapcard-stub')).toHaveLength(2)
  })

  it('renders filters slot content exactly once on mobile', async () => {
    const w = await mountPinboardBody({ isMobile: true })
    // The Teleported LocationsPanel carries the forwarded #filters slot; a
    // second raw <slot> in the sheet would double-render the app's filters UI.
    expect(w.findAll('.my-filters')).toHaveLength(1)
  })
})

describe('PinboardBody - locationPanelCountNoun forwarding', () => {
  it('reaches LocationsPanel on desktop (isMobile: false)', async () => {
    const w = await mountPinboardBody({ locationPanelCountNoun: 'report', isMobile: false })
    const count = w.find('.location-count')
    expect(count.exists()).toBe(true)
    expect(count.text()).toBe('2 reports')
  })

  it('does not reach LocationsPanel on mobile (isMobile: true) — count-noun is desktop-only', async () => {
    const w = await mountPinboardBody({ locationPanelCountNoun: 'report', isMobile: true })
    // LocationsPanel really did teleport in and render its cards — the
    // missing count-noun is the assertion under test, not a no-op mount.
    expect(w.findAll('.mapcard-stub')).toHaveLength(2)
    expect(w.find('.location-count').exists()).toBe(false)
  })

  it('uses the noun in the mobile sheet header, defaulting to item', async () => {
    const withNoun = await mountPinboardBody({ locationPanelCountNoun: 'report' })
    expect(withNoun.find('.location-sheet-header').text()).toContain('2 reports')

    const withoutNoun = await mountPinboardBody()
    expect(withoutNoun.find('.location-sheet-header').text()).toContain('2 items')
  })
})
