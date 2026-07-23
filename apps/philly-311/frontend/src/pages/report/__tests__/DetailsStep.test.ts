// ABOUTME: Tests for DetailsStep — per-question screens with picklist auto-advance,
// ABOUTME: required-empty messaging, back/next nav handlers, and the final description/
// ABOUTME: contact/privacy screen (store sync, 10-char floor).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { ServiceType } from '@/types/api'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_NAV_KEY, type WizardNavHandlers } from '@/composables/useWizardNav'
import QuestionField from '@/components/wizard/QuestionField.vue'

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
        field: 'Notes__c',
        label: 'Notes',
        type: 'string',
        required: false,
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

vi.mock('@/components/wizard/ContactInfo.vue', () => ({
  default: { name: 'ContactInfo', template: '<div data-testid="contact-info" />' },
}))

import DetailsStep from '../DetailsStep.vue'

function mountStep() {
  const nav = ref<WizardNavHandlers | null>(null)
  const w = mount(DetailsStep, {
    global: { provide: { [WIZARD_NAV_KEY]: nav } },
  })
  return { w, nav }
}

beforeEach(() => {
  setActivePinia(createPinia())
  list.value = CATALOG
  isLoading.value = false
  error.value = null
  load.mockClear()
})

describe('DetailsStep - question screens', () => {
  it('renders the first question alone as a heading with the required marker', async () => {
    useReportSubmissionStore().setCategory('Pothole Repair')
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('h1').text()).toContain('Severity')
    expect(w.find('h1').text()).toContain('* (required)')
    expect(w.text()).not.toContain('Notes')
    expect(w.find('textarea').exists()).toBe(false)
  })

  it('next() on a required, empty question shows the picklist message and returns true', async () => {
    useReportSubmissionStore().setCategory('Pothole Repair')
    const { w, nav } = mountStep()
    await flushPromises()
    expect(nav.value?.next()).toBe(true)
    await flushPromises()
    expect(w.text()).toContain('Select an option to continue')
  })

  it('back() steps back one question, and returns false at index 0', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Shallow')
    const { w, nav } = mountStep()
    await flushPromises()

    expect(nav.value?.next()).toBe(true)
    await flushPromises()
    expect(w.find('h1').text()).toContain('Notes')

    expect(nav.value?.back()).toBe(true)
    await flushPromises()
    expect(w.find('h1').text()).toContain('Severity')

    expect(nav.value?.back()).toBe(false)
  })

  it('a category with zero questions lands directly on the final screen', async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('h1').text()).toBe('Details')
    expect(w.find('textarea').exists()).toBe(true)
  })

  describe('auto-advance', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('answering a picklist auto-advances after 300ms and clears the error', async () => {
      useReportSubmissionStore().setCategory('Pothole Repair')
      const { w, nav } = mountStep()
      await nextTick()

      expect(nav.value?.next()).toBe(true)
      await nextTick()
      expect(w.text()).toContain('Select an option to continue')

      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'Shallow')
      await nextTick()
      expect(w.text()).not.toContain('Select an option to continue')
      expect(w.find('h1').text()).toContain('Severity')

      vi.advanceTimersByTime(300)
      await nextTick()
      expect(w.find('h1').text()).toContain('Notes')
    })

    it('a non-picklist type does not auto-advance', async () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setQuestion('Severity__c', 'Shallow')
      const { w, nav } = mountStep()
      await nextTick()

      expect(nav.value?.next()).toBe(true)
      await nextTick()
      expect(w.find('h1').text()).toContain('Notes')

      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'some notes')
      await nextTick()
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(w.find('h1').text()).toContain('Notes')
    })
  })
})

describe('DetailsStep - final screen', () => {
  it('renders after the last question (textarea, contact stub, privacy)', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Shallow')
    store.setQuestion('Notes__c', 'fine')
    const { w, nav } = mountStep()
    await flushPromises()

    expect(nav.value?.next()).toBe(true) // Severity -> Notes
    await flushPromises()
    expect(nav.value?.next()).toBe(true) // Notes -> final screen
    await flushPromises()

    expect(w.find('h1').text()).toBe('Details')
    expect(w.find('textarea').exists()).toBe(true)
    expect(w.find('[data-testid="contact-info"]').exists()).toBe(true)
    expect(w.find('.details-step__privacy').exists()).toBe(true)
  })

  it("next() with a 9-character description shows 'Add a description to continue' and returns true", async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w, nav } = mountStep()
    await flushPromises()
    await w.find('textarea').setValue('123456789')
    expect(nav.value?.next()).toBe(true)
    await flushPromises()
    expect(w.text()).toContain('Add a description to continue')
  })

  it('next() with a valid (10 trimmed chars) description returns false', async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w, nav } = mountStep()
    await flushPromises()
    await w.find('textarea').setValue('1234567890')
    expect(nav.value?.next()).toBe(false)
  })
})

describe('DetailsStep - store sync', () => {
  it('typing writes store.description', async () => {
    const { w } = mountStep()
    await flushPromises()
    await w.find('textarea').setValue('Big pothole on my street')
    expect(useReportSubmissionStore().description).toBe('Big pothole on my street')
  })

  it('shows a store-seeded description', async () => {
    useReportSubmissionStore().setDescription('Seeded description text')
    const { w } = mountStep()
    await flushPromises()
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe(
      'Seeded description text',
    )
  })

  it('the visibility checkbox reflects and writes store.publicVisibility', async () => {
    const { w } = mountStep()
    await flushPromises()
    const box = w.find('input[type="checkbox"]')
    expect((box.element as HTMLInputElement).checked).toBe(false)
    await box.setValue(true)
    expect(useReportSubmissionStore().publicVisibility).toBe(true)
  })
})

describe('DetailsStep - composition', () => {
  it('renders the ContactInfo section', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('[data-testid="contact-info"]').exists()).toBe(true)
  })

  it('has no Continue button (the shell owns Next)', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('button').exists()).toBe(false)
  })
})

describe('DetailsStep - aria wiring', () => {
  it('description textarea has aria-required="true"', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('textarea').attributes('aria-required')).toBe('true')
  })

  it('description textarea has aria-describedby pointing at the hint', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('textarea').attributes('aria-describedby')).toBe('details-description-hint')
  })

  it('hint paragraph has the id referenced by aria-describedby', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('.details-step__hint').attributes('id')).toBe('details-description-hint')
  })

  it('privacy checkbox has aria-describedby pointing at the privacy note', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('input[type="checkbox"]').attributes('aria-describedby')).toBe(
      'details-privacy-note',
    )
  })

  it('privacy note paragraph has the id referenced by the checkbox aria-describedby', async () => {
    const { w } = mountStep()
    await flushPromises()
    expect(w.find('.details-step__privacy-note').attributes('id')).toBe('details-privacy-note')
  })

  it('description textarea aria-describedby does not include the privacy note id', async () => {
    const { w } = mountStep()
    await flushPromises()
    const describedBy = w.find('textarea').attributes('aria-describedby') ?? ''
    expect(describedBy).not.toContain('details-privacy-note')
  })
})
