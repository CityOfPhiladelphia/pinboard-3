// ABOUTME: Tests for PinboardBody's slot-forwarding seam — the locations-filters
// ABOUTME: slot and count-noun prop must actually reach LocationsPanel, per path.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PinboardBody from './PinboardBody.vue'
import type { BasicLocation } from '../types'

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

function mountPinboardBody(extraProps: Record<string, unknown> = {}) {
  return mount(PinboardBody, {
    props: {
      locations: locations(),
      searchOrUserLocation: { latitude: NaN, longitude: NaN },
      isLoading: false,
      errorMessage: null,
      locationPanelSearch: 'Search by address or ZIP',
      ...extraProps,
    },
    slots: {
      'locations-header': '<div class="my-header">Header</div>',
      'locations-filters': '<div class="my-filters">Chips</div>',
    },
    global: {
      stubs: { MapCard: MapCardStub, BottomSheet: BottomSheetStub },
    },
  })
}

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ??
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
})

describe('PinboardBody - locations-filters slot forwarding (desktop)', () => {
  it('renders filters slot content between the search box and the location list', () => {
    const w = mountPinboardBody()
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

describe('PinboardBody - locations-filters slot forwarding (mobile bottom sheet)', () => {
  it('renders filters slot content after locations-header content', () => {
    const w = mountPinboardBody()
    const sheet = w.find('.bottom-sheet-stub')
    const html = sheet.html()
    const headerIdx = html.indexOf('my-header')
    const filtersIdx = html.indexOf('my-filters')
    expect(headerIdx).toBeGreaterThan(-1)
    expect(headerIdx).toBeLessThan(filtersIdx)
  })
})

describe('PinboardBody - locationPanelCountNoun forwarding', () => {
  it('reaches the desktop LocationsPanel but not the mobile one', () => {
    const w = mountPinboardBody({ locationPanelCountNoun: 'report' })
    const desktopCount = w.find('.finder-panel-locations').find('.location-count')
    expect(desktopCount.exists()).toBe(true)
    expect(desktopCount.text()).toBe('2 reports')

    const sheetCount = w.find('.bottom-sheet-stub').find('.location-count')
    expect(sheetCount.exists()).toBe(false)
  })
})
