// ABOUTME: Tests for ReviewSummary — section rendering, em-dash fallbacks,
// ABOUTME: catalog-ordered question labels/required markers, Edit destinations,
// ABOUTME: and the visibility & contact summary line (incl. its Edit → modal wiring).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import type { ServiceType } from '@/types/api'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const list = ref<ServiceType[] | null>(null)
const load = vi.fn()
vi.mock('@/composables/useServiceTypes', () => ({
  useServiceTypes: () => ({ list, load, isLoading: ref(false), error: ref(null) }),
}))

// Real @pinboard/ui pulls dist CSS vitest can't load, and LocationThumbnail needs
// a real MapLibre/WebGL context jsdom doesn't provide — stub it. Its own
// coordinate/icon handling is covered by packages/ui's LocationThumbnail.test.ts.
vi.mock('@pinboard/ui', () => ({
  LocationThumbnail: defineComponent({
    name: 'LocationThumbnail',
    props: ['latitude', 'longitude', 'icon', 'color'],
    setup() {
      return () => null
    },
  }),
}))

// VisibilityContactModal has its own test file — stub it here to a component
// that exposes an `open` spy, so this file can check the 5th section's Edit
// button is wired to it without re-exercising the modal's own internals.
const openModal = vi.fn()
vi.mock('../VisibilityContactModal.vue', () => ({
  default: defineComponent({
    name: 'VisibilityContactModal',
    setup(_, { expose }) {
      expose({ open: openModal })
      return () => null
    },
  }),
}))

// Per-test controllable auth state (overrides the global setup mock).
const authState = { isAuthenticated: ref(false) }
vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
  createB2CPlugin: () => ({ install: () => undefined }),
}))

import ReviewSummary from '../ReviewSummary.vue'

function mountSummary() {
  return mount(ReviewSummary)
}

function catalogEntry(): ServiceType {
  return {
    serviceType: 'Abandoned Vehicle',
    caseType: 'Abandoned Vehicle',
    description: 'Cars left on the street for an extended period.',
    recordTypeID: 'rt1',
    department: 'Streets',
    questions: [
      {
        field: 'Body_Style__c',
        label: 'Body Style',
        type: 'picklist',
        required: true,
        options: ['Sedan'],
      },
      { field: 'Color__c', label: 'Color', type: 'text', required: false },
    ],
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  list.value = null
  load.mockClear()
  openModal.mockClear()
  authState.isAuthenticated.value = false
})

describe('ReviewSummary - sections and fallbacks', () => {
  it('shows em-dashes for an empty store', () => {
    const w = mountSummary()
    // photo, category, location placeholders
    expect(w.text()).toContain('—')
    expect(w.find('img').exists()).toBe(false)
  })

  it('loads the service-type catalog on mount', () => {
    mountSummary()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('renders the photo thumbnail, preferring previewUrl', () => {
    const store = useReportSubmissionStore()
    store.setPhoto({ mediaUrl: 'https://cdn.test/p.jpg', previewUrl: 'blob:preview' })
    const w = mountSummary()
    expect(w.find('img').attributes('src')).toBe('blob:preview')
  })

  it('falls back to mediaUrl when there is no previewUrl', () => {
    useReportSubmissionStore().setPhoto({ mediaUrl: 'https://cdn.test/p.jpg' })
    const w = mountSummary()
    expect(w.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')
  })

  it('renders the category name and its catalog description', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    list.value = [catalogEntry()]
    const w = mountSummary()
    expect(w.text()).toContain('Abandoned Vehicle')
    expect(w.text()).toContain('Cars left on the street for an extended period.')
  })

  it('does not leak contact details that were entered but never opted into sharing', () => {
    const store = useReportSubmissionStore()
    store.setContact({ name: 'Darren', email: 'd@example.com', phone: '215-555-0100' })
    // shareContactInfo stays false — entering contact fields alone doesn't share them.
    const w = mountSummary()
    expect(w.text()).not.toContain('Darren')
    expect(w.text()).not.toContain('d@example.com')
    expect(w.text()).not.toContain('215-555-0100')
    expect(w.text()).toContain('Contact info not shared')
  })
})

describe('ReviewSummary - visibility & contact', () => {
  it('shows Public/Private per the store', () => {
    const store = useReportSubmissionStore()
    expect(mountSummary().text()).toContain('Private')
    store.setPrivacy(true)
    expect(mountSummary().text()).toContain('Public')
  })

  it('summarizes shared contact info once opted in', () => {
    const store = useReportSubmissionStore()
    store.setContact({ name: 'Darren', phone: '2155550100' })
    store.setShareContactInfo(true)
    expect(mountSummary().text()).toContain('Shared: Darren, 2155550100')
  })

  it('shows the account-linked message when signed in, regardless of shareContactInfo', () => {
    authState.isAuthenticated.value = true
    expect(mountSummary().text()).toContain('Contact info is linked to your account')
  })

  it("opens VisibilityContactModal when the section's Edit button is clicked", async () => {
    const w = mountSummary()
    // Only the visibility & contact section's Edit renders a <button> — the
    // other four navigate via the PhilaButton stub's <a>.
    const editButton = w.find('button')
    expect(editButton.exists()).toBe(true)
    expect(editButton.text()).toBe('Edit')
    await editButton.trigger('click')
    expect(openModal).toHaveBeenCalledTimes(1)
  })
})

describe('ReviewSummary - location', () => {
  it('shows the street address, Philadelphia/zip, and coordinates as separate lines', () => {
    useReportSubmissionStore().setLocation({
      streetAddress: '1234 Market St',
      zipCode: '19107',
      lat: 39.95,
      lng: -75.16,
    })
    const w = mountSummary()
    expect(w.find('.review-summary__location-street').text()).toBe('1234 Market St')
    const lines = w.findAll('.review-summary__location-line').map((l) => l.text())
    expect(lines).toEqual(['Philadelphia, PA 19107', '39.95, -75.16'])
  })

  it('omits the street line and still shows Philadelphia when the address is empty', () => {
    useReportSubmissionStore().setLocation({ streetAddress: '', lat: 39.95, lng: -75.16 })
    const w = mountSummary()
    expect(w.find('.review-summary__location-street').exists()).toBe(false)
    expect(w.find('.review-summary__location-line').text()).toBe('Philadelphia, PA')
  })
})

describe('ReviewSummary - details', () => {
  it('lists category answers with a required marker, in catalog order, then the free-text description', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    store.setDescription('Rusty sedan on blocks')
    // Insertion order deliberately scrambled vs catalog order.
    store.setQuestion('Mystery__c', 'huh')
    store.setQuestion('Color__c', 'Red')
    store.setQuestion('Body_Style__c', 'Sedan')
    list.value = [catalogEntry()]
    const w = mountSummary()
    const dts = w.findAll('.review-summary__dt').map((d) => d.text())
    expect(dts).toEqual([
      'Body Style * (required)', // required: true in the catalog
      'Color', // required: false — no marker
      'Mystery__c', // unknown field — falls back to the raw key, no marker
      'Describe the issue * (required)', // always required
    ])
    const dds = w.findAll('.review-summary__dd').map((d) => d.text())
    expect(dds).toEqual(['Sedan', 'Red', 'huh', 'Rusty sedan on blocks'])
  })

  it('shows an em dash for the description when none was entered', () => {
    useReportSubmissionStore().setCategory('Abandoned Vehicle')
    const w = mountSummary()
    const dds = w.findAll('.review-summary__dd').map((d) => d.text())
    expect(dds.at(-1)).toBe('—')
  })

  it('falls back to raw field keys when the catalog has not loaded', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    store.setQuestion('Body_Style__c', 'Sedan')
    const w = mountSummary()
    expect(w.text()).toContain('Body_Style__c')
  })
})

describe('ReviewSummary - edit links', () => {
  it('links each section to its owning step', () => {
    const hrefs = mountSummary()
      .findAll('a')
      .map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/report', '/report/issue-type', '/report/location', '/report/details'])
  })
})
