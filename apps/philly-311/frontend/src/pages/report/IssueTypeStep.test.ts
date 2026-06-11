// ABOUTME: Tests IssueTypeStep — pick/questions view swap, validity gating, Change reset,
// ABOUTME: conditional follow-ups, zero-question types, catalog error retry, suggestions band.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import type { ServiceType } from '@/types/api'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

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

import IssueTypeStep from './IssueTypeStep.vue'

function mountStep(canAdvance = ref(false)) {
  const w = mount(IssueTypeStep, {
    global: { provide: { [WIZARD_CAN_ADVANCE_KEY]: canAdvance } },
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
  it('selecting from the directory writes the store and swaps to questions', async () => {
    const { w } = mountStep()
    const rows = w.findAll('button').filter((b) => b.text().includes('Pothole Repair'))
    await rows[0].trigger('click')
    expect(useReportSubmissionStore().category).toBe('Pothole Repair')
    expect(w.text()).toContain('Severity')
    expect(w.text()).not.toContain('All issue types')
  })
  it('gates canAdvance on required visible questions', async () => {
    const store = useReportSubmissionStore()
    const { w, canAdvance } = mountStep()
    store.setCategory('Pothole Repair')
    await flushPromises()
    expect(canAdvance.value).toBe(false)
    store.setQuestion('Severity__c', 'Shallow')
    await flushPromises()
    expect(canAdvance.value).toBe(true)
    expect(w.text()).toContain('* Required')
  })
  it('reveals conditional follow-ups when the controller answer matches', async () => {
    const store = useReportSubmissionStore()
    const { w } = mountStep()
    store.setCategory('Pothole Repair')
    await flushPromises()
    expect(w.text()).not.toContain('Depth detail')
    store.setQuestion('Severity__c', 'Deep')
    await flushPromises()
    expect(w.text()).toContain('Depth detail')
  })
  it('zero-question types advance immediately with a no-details message', async () => {
    const store = useReportSubmissionStore()
    const { w, canAdvance } = mountStep()
    store.setCategory('Graffiti Removal')
    await flushPromises()
    expect(canAdvance.value).toBe(true)
    expect(w.text()).toContain('No additional details needed')
  })
  it('Change returns to the pick view and clears answers', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    const { w } = mountStep()
    await w.find('[data-test="change-type"]').trigger('click')
    expect(store.category).toBeNull()
    expect(store.customFields).toEqual({})
    expect(w.text()).toContain('All issue types')
  })
  it('catalog error shows a retry that re-calls load', async () => {
    list.value = null
    error.value = { message: 'boom' }
    const { w } = mountStep()
    expect(w.text()).toContain('boom')
    await w.find('[data-test="retry-types"]').trigger('click')
    expect(load).toHaveBeenCalledTimes(2) // mount + retry
  })
})
