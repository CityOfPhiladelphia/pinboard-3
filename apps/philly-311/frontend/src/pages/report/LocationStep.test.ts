// ABOUTME: Tests for LocationStep — AIS select, geolocation paths, map move +
// ABOUTME: coords-only fallback, out-of-bounds error/clearing, canAdvance gating.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LocationStep from './LocationStep.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const mockReverseGeocode = vi.fn()
vi.mock('@/composables/useAis', () => ({
  // AddressSearch (which uses autocompleteAddresses/searchAddress) is stubbed
  // below, so only reverseGeocode needs to be functional here.
  reverseGeocode: (...args: unknown[]) => mockReverseGeocode(...args),
}))

const mockGetCurrentPosition = vi.fn()
vi.mock('@/composables/useGeolocation', () => ({
  getCurrentPosition: () => mockGetCurrentPosition(),
}))

vi.mock('@/components/wizard/AddressSearch.vue', () => ({
  default: {
    name: 'AddressSearch',
    emits: ['select'],
    template: '<div data-testid="address-search" />',
  },
}))

vi.mock('@/components/wizard/LocationMap.vue', () => ({
  default: {
    name: 'LocationMap',
    props: ['location'],
    emits: ['outOfBounds', 'move'],
    template: '<div data-testid="location-map" />',
  },
}))

const IN_PHILLY_FEATURE = {
  streetAddress: '1234 MARKET ST',
  zipCode: '19107',
  lat: 39.9526,
  lng: -75.1652,
}

const OUT_OF_PHILLY_FEATURE = {
  streetAddress: '100 N MARKET ST',
  zipCode: '19801',
  lat: 39.7447,
  lng: -75.5484,
}

function mountStep(canAdvance = ref(false)) {
  return {
    canAdvance,
    w: mount(LocationStep, {
      global: { provide: { 'wizard:canAdvance': canAdvance } },
    }),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockReverseGeocode.mockReset()
  mockGetCurrentPosition.mockReset()
})

describe('LocationStep - AIS select', () => {
  it('stores a full WizardLocation and enables canAdvance', async () => {
    const { w, canAdvance } = mountStep()
    expect(canAdvance.value).toBe(false)

    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', IN_PHILLY_FEATURE)
    await flushPromises()

    const store = useReportSubmissionStore()
    expect(store.location).toEqual({
      address: '1234 MARKET ST',
      zipCode: '19107',
      lat: 39.9526,
      lng: -75.1652,
    })
    expect(canAdvance.value).toBe(true)
  })

  it('keeps canAdvance false for an out-of-Philly selection', async () => {
    const { w, canAdvance } = mountStep()
    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', OUT_OF_PHILLY_FEATURE)
    await flushPromises()
    expect(canAdvance.value).toBe(false)
  })
})

describe('LocationStep - Use my current location', () => {
  it('stores the reverse-geocoded location and enables canAdvance', async () => {
    mockGetCurrentPosition.mockResolvedValue({ lat: 39.9526, lng: -75.1652 })
    mockReverseGeocode.mockResolvedValue(IN_PHILLY_FEATURE)

    const { w, canAdvance } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    await flushPromises()

    const store = useReportSubmissionStore()
    expect(store.location?.address).toBe('1234 MARKET ST')
    expect(canAdvance.value).toBe(true)
  })

  it('shows an error and leaves the store empty when geolocation is denied', async () => {
    mockGetCurrentPosition.mockResolvedValue(null)

    const { w } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    await flushPromises()

    expect(useReportSubmissionStore().location).toBeNull()
    expect(w.find('[role="alert"]').text()).toContain("couldn't access your location")
  })

  it('shows an error when reverseGeocode returns null', async () => {
    mockGetCurrentPosition.mockResolvedValue({ lat: 39.9526, lng: -75.1652 })
    mockReverseGeocode.mockResolvedValue(null)

    const { w } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toContain("couldn't resolve your location")
  })
})

describe('LocationStep - out-of-bounds error', () => {
  it('shows the Philly-only error when LocationMap emits outOfBounds', async () => {
    const { w, canAdvance } = mountStep()
    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', OUT_OF_PHILLY_FEATURE)
    await w.findComponent({ name: 'LocationMap' }).vm.$emit('outOfBounds')
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toContain('311 only handles requests in Philadelphia')
    expect(canAdvance.value).toBe(false)
  })

  it('clears the error when a new in-bounds location is selected', async () => {
    const { w, canAdvance } = mountStep()
    await w.findComponent({ name: 'LocationMap' }).vm.$emit('outOfBounds')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)

    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', IN_PHILLY_FEATURE)
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(canAdvance.value).toBe(true)
  })
})

describe('LocationStep - map move', () => {
  it('reverse-geocodes the new point and stores the feature', async () => {
    mockReverseGeocode.mockResolvedValue(IN_PHILLY_FEATURE)

    const { w } = mountStep()
    const store = useReportSubmissionStore()
    store.setLocation({ address: 'OLD ADDRESS', lat: 39.95, lng: -75.17 })

    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.9526, lng: -75.1652 })
    await flushPromises()

    expect(mockReverseGeocode).toHaveBeenCalledWith(39.9526, -75.1652)
    expect(store.location?.address).toBe('1234 MARKET ST')
  })

  it('keeps the address and updates coords when reverseGeocode returns null', async () => {
    mockReverseGeocode.mockResolvedValue(null)

    const { w } = mountStep()
    const store = useReportSubmissionStore()
    store.setLocation({ address: 'Original Address', lat: 39.9526, lng: -75.1652 })

    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.94, lng: -75.15 })
    await flushPromises()

    expect(store.location).toEqual({ address: 'Original Address', lat: 39.94, lng: -75.15 })
  })
})

describe('LocationStep - chosen-address line', () => {
  it('shows the address when set, and falls back to coords for a deep-link seed', async () => {
    const { w } = mountStep()
    const store = useReportSubmissionStore()

    store.setLocation({ address: '1234 MARKET ST', zipCode: '19107', lat: 39.9526, lng: -75.1652 })
    await flushPromises()
    expect(w.find('[data-test="chosen-address"]').text()).toContain('1234 MARKET ST')

    store.setLocation({ address: '', lat: 39.9526, lng: -75.1652 })
    await flushPromises()
    expect(w.find('[data-test="chosen-address"]').text()).toContain('39.9526, -75.1652')
  })
})
