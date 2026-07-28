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
      {
        field: 'Depth__c',
        label: 'Depth detail',
        type: 'string',
        required: false,
        controllerName: 'Severity__c',
        dependentValues: { a: ['Deep'] },
      },
      {
        field: 'FollowUp__c',
        label: 'Follow-up notes',
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
  {
    serviceType: 'Illegal Dumping',
    caseType: 'Sanitation',
    description: 'Illegal dumping',
    recordTypeID: 'rt3',
    department: 'Sanitation',
    questions: [
      { field: 'Location__c', label: 'Location details', type: 'string', required: true },
    ],
  },
  {
    serviceType: 'Multi Q',
    caseType: 'Test',
    description: 'Fixture exercising non-picklist answer types',
    recordTypeID: 'rt4',
    department: 'Test',
    questions: [
      {
        field: 'Choices__c',
        label: 'Choices',
        type: 'multipicklist',
        required: false,
        options: ['A', 'B'],
      },
      { field: 'Confirm__c', label: 'Confirm', type: 'boolean', required: false },
    ],
  },
  {
    serviceType: 'Shrink Mid Timer',
    caseType: 'Test',
    description: 'Fixture where the dependent question precedes its controller in the array',
    recordTypeID: 'rt5',
    department: 'Test',
    questions: [
      {
        field: 'Y__c',
        label: 'Y',
        type: 'string',
        required: false,
        controllerName: 'X__c',
        dependentValues: { a: ['first'] },
      },
      {
        field: 'X__c',
        label: 'X',
        type: 'picklist',
        required: false,
        options: ['first', 'second'],
      },
    ],
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

  it('next() on a required, empty NON-picklist question shows the generic message and returns true', async () => {
    useReportSubmissionStore().setCategory('Illegal Dumping')
    const { w, nav } = mountStep()
    await flushPromises()
    expect(w.find('h1').text()).toContain('Location details')
    expect(nav.value?.next()).toBe(true)
    await flushPromises()
    const alert = w.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toBe('Add an answer to continue')
  })

  it('a required string question answered with only whitespace still shows the required message', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Illegal Dumping')
    store.setQuestion('Location__c', '   ')
    const { w, nav } = mountStep()
    await flushPromises()
    expect(nav.value?.next()).toBe(true)
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe('Add an answer to continue')
  })

  it('passes hideLabel: true to QuestionField so the heading is not duplicated', async () => {
    useReportSubmissionStore().setCategory('Pothole Repair')
    const { w } = mountStep()
    await flushPromises()
    expect(w.findComponent(QuestionField).props('hideLabel')).toBe(true)
  })

  it('clamps the index safely when an earlier controller answer change shrinks the question list', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    const { w, nav } = mountStep()
    await flushPromises()

    expect(nav.value?.next()).toBe(true) // Severity -> Notes
    await flushPromises()
    expect(nav.value?.next()).toBe(true) // Notes -> Depth detail
    await flushPromises()
    expect(nav.value?.next()).toBe(true) // Depth detail -> Follow-up notes
    await flushPromises()
    expect(w.find('h1').text()).toContain('Follow-up notes')

    // Something upstream (e.g. the user backing up and re-answering Severity)
    // changes the controller answer — both dependent questions vanish.
    store.setQuestion('Severity__c', 'Shallow')
    await flushPromises()

    // No crash, and the index was pulled back in bounds: a single back() lands
    // on the last real remaining question instead of requiring two.
    expect(nav.value?.back()).toBe(true)
    await flushPromises()
    expect(w.find('h1').text()).toContain('Notes')
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

    it('a multipicklist answer does not auto-advance', async () => {
      useReportSubmissionStore().setCategory('Multi Q')
      const { w } = mountStep()
      await nextTick()
      expect(w.find('h1').text()).toContain('Choices')

      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'A;B')
      await nextTick()
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(w.find('h1').text()).toContain('Choices')
    })

    it('a boolean answer does not auto-advance', async () => {
      useReportSubmissionStore().setCategory('Multi Q')
      const { w, nav } = mountStep()
      await nextTick()

      expect(nav.value?.next()).toBe(true) // Choices (optional, empty) -> Confirm
      await nextTick()
      expect(w.find('h1').text()).toContain('Confirm')

      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'true')
      await nextTick()
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(w.find('h1').text()).toContain('Confirm')
    })
  })

  describe('timer cancellation races', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('back() before the auto-advance timer fires cancels it — no advance ever happens', async () => {
      useReportSubmissionStore().setCategory('Pothole Repair')
      const { w, nav } = mountStep()
      await nextTick()

      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'Shallow')
      await nextTick()
      expect(nav.value?.back()).toBe(false) // index 0: nothing to go back to, but cancels the pending timer

      vi.advanceTimersByTime(500)
      await nextTick()
      expect(w.find('h1').text()).toContain('Severity')
    })

    it('a manual next() before the timer fires advances exactly once — the stale timer does not double-advance', async () => {
      useReportSubmissionStore().setCategory('Pothole Repair')
      const { w, nav } = mountStep()
      await nextTick()

      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'Shallow')
      await nextTick()
      expect(nav.value?.next()).toBe(true) // manual advance to Notes; cancels the pending auto-advance timer
      await nextTick()
      expect(w.find('h1').text()).toContain('Notes')

      vi.advanceTimersByTime(500)
      await nextTick()
      // Still on Notes — the already-cancelled timer did not fire a second advance.
      expect(w.find('h1').text()).toContain('Notes')
    })

    it('guards the pending timer against a stray final-screen error when the question list shrinks underneath it', async () => {
      const store = useReportSubmissionStore()
      store.setCategory('Shrink Mid Timer')
      store.setQuestion('X__c', 'first') // seeds Y__c visible, so the initial order is [Y, X]
      const { w, nav } = mountStep()
      await nextTick()

      expect(nav.value?.next()).toBe(true) // Y (optional, empty) -> X
      await nextTick()
      expect(w.find('h1').text()).toContain('X')

      // Re-answering X to a value Y no longer depends on removes Y from the
      // list. The index (still pointing at X's old slot) now falls off the
      // end, so `current` goes null and the view flips to the final screen
      // — synchronously, before the auto-advance timer ever fires.
      await w.findComponent(QuestionField).vm.$emit('update:modelValue', 'second')
      await nextTick()
      expect(w.find('h1').text()).toBe('Details')

      vi.advanceTimersByTime(300)
      await nextTick()
      // The stale timer must not have run next() against the (now absent)
      // question and stamped a bogus "Add a description to continue" error.
      expect(w.find('[role="alert"]').exists()).toBe(false)
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

  it('next() with whitespace padding (13 raw / 7 trimmed chars) still fails the floor', async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w, nav } = mountStep()
    await flushPromises()
    await w.find('textarea').setValue('   1234567   ')
    expect(nav.value?.next()).toBe(true)
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe('Add a description to continue')
  })

  it('next() with a valid (10 trimmed chars) description returns false', async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w, nav } = mountStep()
    await flushPromises()
    await w.find('textarea').setValue('1234567890')
    expect(nav.value?.next()).toBe(false)
  })

  it('renders the error under role=alert with details-step__error, and marks the textarea errored', async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w, nav } = mountStep()
    await flushPromises()
    await w.find('textarea').setValue('short')
    expect(nav.value?.next()).toBe(true)
    await flushPromises()

    const alert = w.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.classes()).toContain('details-step__error')
    expect(alert.text()).toBe('Add a description to continue')
    expect(w.find('textarea').classes()).toContain('details-step__textarea--error')
  })

  it('typing in the description clears the error before any next() call', async () => {
    useReportSubmissionStore().setCategory('Graffiti Removal')
    const { w, nav } = mountStep()
    await flushPromises()
    expect(nav.value?.next()).toBe(true) // empty description -> error
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)

    await w.find('textarea').setValue('a')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })
})

describe('DetailsStep - service-types loading (deep-link cold load)', () => {
  it('shows a loading status while the catalog is still loading and blocks nav', async () => {
    list.value = null
    isLoading.value = true
    useReportSubmissionStore().setCategory('Pothole Repair')
    const { w, nav } = mountStep()
    await flushPromises()

    expect(w.text()).toContain('Loading questions')
    expect(w.find('textarea').exists()).toBe(false)
    expect(w.find('h1').exists()).toBe(false)
    expect(nav.value?.next()).toBe(true)
    expect(nav.value?.back()).toBe(false)
  })

  it('shows an error with a retry that re-calls load(), and blocks nav', async () => {
    list.value = null
    isLoading.value = false
    error.value = { message: 'boom' }
    useReportSubmissionStore().setCategory('Pothole Repair')
    const { w, nav } = mountStep()
    await flushPromises()

    const alert = w.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('boom')
    expect(nav.value?.next()).toBe(true)
    expect(nav.value?.back()).toBe(false)

    await w.find('[data-test="retry-questions"]').trigger('click')
    expect(load).toHaveBeenCalledTimes(2) // mount + retry
  })

  it('transitions from loading straight to question 0 once the catalog arrives', async () => {
    list.value = null
    isLoading.value = true
    useReportSubmissionStore().setCategory('Pothole Repair')
    const { w } = mountStep()
    await flushPromises()
    expect(w.text()).toContain('Loading questions')

    list.value = CATALOG
    isLoading.value = false
    await flushPromises()

    expect(w.find('h1').text()).toContain('Severity')
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
