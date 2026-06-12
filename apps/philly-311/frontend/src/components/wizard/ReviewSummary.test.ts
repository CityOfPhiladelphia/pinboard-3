// ABOUTME: Tests for ReviewSummary — section rendering, em-dash fallbacks,
// ABOUTME: catalog-ordered question labels, and Edit links per section.
import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import ReviewSummary from './ReviewSummary.vue'

const RouterLinkStub = {
  template: '<a :href="String(to)" class="router-link-stub"><slot /></a>',
  props: ['to'],
}

function mountSummary() {
  return mount(ReviewSummary, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

function catalogEntry(): ServiceType {
  return {
    serviceType: 'Abandoned Vehicle',
    caseType: 'Abandoned Vehicle',
    description: '',
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

  it('renders category, description, contact, and visibility', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    store.setDescription('Rusty sedan on blocks')
    store.setContact({ name: 'Darren', email: 'd@example.com', phone: '215-555-0100' })
    store.setPrivacy(true)
    const w = mountSummary()
    expect(w.text()).toContain('Abandoned Vehicle')
    expect(w.text()).toContain('Rusty sedan on blocks')
    expect(w.text()).toContain('Darren')
    expect(w.text()).toContain('d@example.com')
    expect(w.text()).toContain('215-555-0100')
    expect(w.text()).toContain('Yes')
  })

  it('shows visibility No by default', () => {
    expect(mountSummary().text()).toContain('No')
  })
})

describe('ReviewSummary - location', () => {
  it('shows the address with zip in parens', () => {
    useReportSubmissionStore().setLocation({
      address: '1234 Market St',
      zipCode: '19107',
      lat: 39.95,
      lng: -75.16,
    })
    expect(mountSummary().text()).toContain('1234 Market St (19107)')
  })

  it('falls back to coordinates when the address is empty', () => {
    useReportSubmissionStore().setLocation({ address: '', lat: 39.95, lng: -75.16 })
    expect(mountSummary().text()).toContain('39.95, -75.16')
  })
})

describe('ReviewSummary - questions', () => {
  it('labels answers from the catalog, in catalog order, unknown keys last', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    // Insertion order deliberately scrambled vs catalog order.
    store.setQuestion('Mystery__c', 'huh')
    store.setQuestion('Color__c', 'Red')
    store.setQuestion('Body_Style__c', 'Sedan')
    list.value = [catalogEntry()]
    const w = mountSummary()
    const dts = w.findAll('.review-summary__answers dt').map((d) => d.text())
    expect(dts.slice(0, 3)).toEqual(['Body Style', 'Color', 'Mystery__c'])
    expect(w.text()).toContain('Sedan')
    expect(w.text()).toContain('Red')
  })

  it('falls back to raw field keys when the catalog has not loaded', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    store.setQuestion('Body_Style__c', 'Sedan')
    const w = mountSummary()
    expect(w.text()).toContain('Body_Style__c')
  })

  it('renders no answers block when there are no answers', () => {
    useReportSubmissionStore().setCategory('Abandoned Vehicle')
    const w = mountSummary()
    expect(w.find('.review-summary__answers').exists()).toBe(false)
  })
})

describe('ReviewSummary - edit links', () => {
  it('links each section to its owning step', () => {
    const hrefs = mountSummary()
      .findAll('a.router-link-stub')
      .map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/report', '/report/issue-type', '/report/location', '/report/details'])
  })
})
