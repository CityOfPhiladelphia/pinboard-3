// ABOUTME: Tests for LocationStep — AIS select, geolocation paths, map move +
// ABOUTME: coords-only fallback, out-of-bounds error/clearing, canAdvance gating.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LocationStep from '../LocationStep.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

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

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function mountStep(canAdvance = ref(false)) {
  return {
    canAdvance,
    w: mount(LocationStep, {
      global: { provide: { [WIZARD_CAN_ADVANCE_KEY]: canAdvance } },
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

  it('shows an error when reverseGeocode rejects on geolocation', async () => {
    mockGetCurrentPosition.mockResolvedValue({ lat: 39.9526, lng: -75.1652 })
    mockReverseGeocode.mockRejectedValue(new Error('network'))

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

  it('keeps address and updates coords when reverseGeocode rejects', async () => {
    mockReverseGeocode.mockRejectedValue(new Error('network'))

    const { w } = mountStep()
    const store = useReportSubmissionStore()
    store.setLocation({ address: 'Original Address', lat: 39.9526, lng: -75.1652 })

    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.94, lng: -75.15 })
    await flushPromises()

    expect(store.location).toEqual({ address: 'Original Address', lat: 39.94, lng: -75.15 })
  })
})

describe('LocationStep - race conditions', () => {
  it('an address selection during geolocation is not clobbered by the late geolocate result', async () => {
    const geo = deferred<{ lat: number; lng: number } | null>()
    mockGetCurrentPosition.mockImplementation(() => geo.promise)
    mockReverseGeocode.mockResolvedValue({ streetAddress: 'GEO RESULT', lat: 39.96, lng: -75.16 })

    const { w } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    // getCurrentPosition is still pending; emit a manual address selection
    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', IN_PHILLY_FEATURE)
    await flushPromises()

    // Now let the geolocation chain complete with a different feature
    geo.resolve({ lat: 39.96, lng: -75.16 })
    await flushPromises()

    const store = useReportSubmissionStore()
    expect(store.location?.address).toBe('1234 MARKET ST')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('a late geolocate failure does not splat an error over a newer selection', async () => {
    const geo = deferred<{ lat: number; lng: number } | null>()
    mockGetCurrentPosition.mockImplementation(() => geo.promise)

    const { w } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    // Address selection supersedes the in-flight geolocation
    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', IN_PHILLY_FEATURE)
    await flushPromises()

    // Geolocation resolves with null (denied) after the explicit selection
    geo.resolve(null)
    await flushPromises()

    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(useReportSubmissionStore().location?.address).toBe('1234 MARKET ST')
  })

  it('out-of-order drag geocodes: the newer drag wins', async () => {
    const FEATURE_A = { streetAddress: 'DRAG A', zipCode: '19107', lat: 39.95, lng: -75.16 }
    const FEATURE_B = { streetAddress: 'DRAG B', zipCode: '19107', lat: 39.96, lng: -75.17 }

    const defer1 = deferred<typeof FEATURE_A | null>()
    const defer2 = deferred<typeof FEATURE_B | null>()
    mockReverseGeocode
      .mockImplementationOnce(() => defer1.promise)
      .mockImplementationOnce(() => defer2.promise)

    const { w } = mountStep()
    const store = useReportSubmissionStore()
    store.setLocation({ address: 'ORIGINAL', lat: 39.94, lng: -75.15 })

    // Fire two rapid drags before either geocode resolves
    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.95, lng: -75.16 })
    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.96, lng: -75.17 })

    // Resolve the SECOND (newer) drag first
    defer2.resolve(FEATURE_B)
    await flushPromises()

    // Then resolve the FIRST (older) drag
    defer1.resolve(FEATURE_A)
    await flushPromises()

    // Newer drag result must win
    expect(store.location?.address).toBe('DRAG B')
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
