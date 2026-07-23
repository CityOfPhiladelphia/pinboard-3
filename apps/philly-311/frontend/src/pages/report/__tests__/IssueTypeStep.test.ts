// ABOUTME: Tests IssueTypeStep — pick/selected view swap, category-only validity gating,
// ABOUTME: Change reset, catalog error retry, suggestions band, showErrors alert.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import type { ServiceType } from '@/types/api'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY, WIZARD_SHOW_ERRORS_KEY } from '@/composables/useWizardValidity'

const CATALOG: ServiceType[] = [
  {
    serviceType: 'Pothole Repair',
    caseType: 'Street Defect',
    description: 'Pothole in the road',
    recordTypeID: 'rt1',
    department: 'Streets',
    questions: [
      {
        field: 'Severity__c',
        label: 'Severity',
        type: 'picklist',
        required: true,
        options: ['Shallow', 'Deep'],
      },
      {
        field: 'Depth__c',
        label: 'Depth detail',
        type: 'string',
        required: false,
        controllerName: 'Severity__c',
        dependentValues: { a: ['Deep'] },
      },
    ],
  },
  {
    serviceType: 'Graffiti Removal',
    caseType: 'Graffiti Removal',
    description: 'Graffiti on property',
    recordTypeID: 'rt2',
    department: 'CLIP',
    questions: [],
  },
]

const list = ref<ServiceType[] | null>(CATALOG)
const isLoading = ref(false)
const error = ref<{ message: string } | null>(null)
const load = vi.fn().mockResolvedValue(CATALOG)
vi.mock('@/composables/useServiceTypes', () => ({
  useServiceTypes: () => ({ list, isLoading, error, load }),
}))

import IssueTypeStep from '../IssueTypeStep.vue'

function mountStep(canAdvance = ref(false), showErrors = ref(false)) {
  const w = mount(IssueTypeStep, {
    global: { provide: { [WIZARD_CAN_ADVANCE_KEY]: canAdvance, [WIZARD_SHOW_ERRORS_KEY]: showErrors } },
  })
  return { w, canAdvance }
}

beforeEach(() => {
  setActivePinia(createPinia())
  list.value = CATALOG
  isLoading.value = false
  error.value = null
  load.mockClear()
})

describe('IssueTypeStep', () => {
  it('shows the pick view (directory, no suggestions) when no category and no photo', () => {
    const { w } = mountStep()
    expect(w.text()).toContain('Issue type')
    expect(w.text()).toContain('All issue types')
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).not.toContain('AI generated recommendations')
  })
  it('shows suggestions when a photo and surviving suggestions exist', () => {
    const store = useReportSubmissionStore()
    store.setPhoto({ mediaUrl: 'https://cdn.test/p.jpg', previewUrl: 'blob:x' })
    store.setPhotoSuggestions([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
    const { w } = mountStep()
    expect(w.text()).toContain('AI generated recommendations')
    expect(w.find('img').attributes('src')).toBe('blob:x')
  })
  it('hides the photo band when no suggestion survives the catalog filter', () => {
    const store = useReportSubmissionStore()
    store.setPhoto({ mediaUrl: 'https://cdn.test/p.jpg', previewUrl: 'blob:x' })
    store.setPhotoSuggestions([{ serviceType: 'Miscellaneous', confidence: 1 }])
    const { w } = mountStep()
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).not.toContain('AI generated recommendations')
    expect(w.text()).toContain('All issue types')
  })
  it('selecting from the directory writes the store and swaps to the selected view', async () => {
    const { w } = mountStep()
    const rows = w.findAll('button').filter((b) => b.text().includes('Pothole Repair'))
    await rows[0].trigger('click')
    expect(useReportSubmissionStore().category).toBe('Pothole Repair')
    expect(w.text()).not.toContain('All issue types')
  })
  it('canAdvance becomes true as soon as a category is chosen', async () => {
    const store = useReportSubmissionStore()
    const { canAdvance } = mountStep()
    store.setCategory('Pothole Repair')
    await flushPromises()
    expect(canAdvance.value).toBe(true)
  })
  it('Change returns to the pick view and clears answers', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    const { w, canAdvance } = mountStep()
    await w.find('[data-test="change-type"]').trigger('click')
    await flushPromises()
    expect(store.category).toBeNull()
    expect(store.customFields).toEqual({})
    expect(w.text()).toContain('All issue types')
    expect(canAdvance.value).toBe(false)
  })
  it('keeps canAdvance false when the catalog load failed, even with a category', async () => {
    list.value = null
    error.value = { message: 'boom' }
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    const { canAdvance } = mountStep(ref(true))
    await flushPromises()
    expect(canAdvance.value).toBe(false)
  })
  it('catalog error shows a retry that re-calls load', async () => {
    list.value = null
    error.value = { message: 'boom' }
    const { w } = mountStep()
    expect(w.text()).toContain('boom')
    await w.find('[data-test="retry-types"]').trigger('click')
    expect(load).toHaveBeenCalledTimes(2) // mount + retry
  })
  it('shows a "select an issue type" alert when showErrors is true and no category is chosen', () => {
    const { w } = mountStep(ref(false), ref(true))
    const alert = w.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Select an issue type to continue')
  })
  it('hides the alert when showErrors is false', () => {
    const { w } = mountStep(ref(false), ref(false))
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })
  it('hides the alert once a category is chosen, even with showErrors true', async () => {
    const store = useReportSubmissionStore()
    const { w } = mountStep(ref(false), ref(true))
    store.setCategory('Pothole Repair')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })
})
