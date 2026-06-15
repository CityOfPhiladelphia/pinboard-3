// ABOUTME: Tests for DetailsStep — description floor gating canAdvance, store sync
// ABOUTME: for description and visibility, store-seeded values, ContactInfo presence.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import DetailsStep from './DetailsStep.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

vi.mock('@/components/wizard/ContactInfo.vue', () => ({
  default: { name: 'ContactInfo', template: '<div data-testid="contact-info" />' },
}))

function mountStep(canAdvance = ref(false)) {
  return {
    canAdvance,
    w: mount(DetailsStep, {
      global: { provide: { [WIZARD_CAN_ADVANCE_KEY]: canAdvance } },
    }),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('DetailsStep - description floor', () => {
  it('canAdvance is false when the description is empty', async () => {
    const { canAdvance } = mountStep()
    await flushPromises()
    expect(canAdvance.value).toBe(false)
  })

  it('canAdvance stays false at 9 characters and for whitespace padding', async () => {
    const { w, canAdvance } = mountStep()
    await w.find('textarea').setValue('123456789')
    expect(canAdvance.value).toBe(false)
    await w.find('textarea').setValue('   1234567   ')
    expect(canAdvance.value).toBe(false)
  })

  it('canAdvance is true at 10 trimmed characters', async () => {
    const { w, canAdvance } = mountStep()
    await w.find('textarea').setValue('1234567890')
    expect(canAdvance.value).toBe(true)
  })
})

describe('DetailsStep - store sync', () => {
  it('typing writes store.description', async () => {
    const { w } = mountStep()
    await w.find('textarea').setValue('Big pothole on my street')
    expect(useReportSubmissionStore().description).toBe('Big pothole on my street')
  })

  it('shows a store-seeded description and is immediately valid', async () => {
    useReportSubmissionStore().setDescription('Seeded description text')
    const { w, canAdvance } = mountStep()
    await flushPromises()
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe(
      'Seeded description text',
    )
    expect(canAdvance.value).toBe(true)
  })

  it('the visibility checkbox reflects and writes store.publicVisibility', async () => {
    const { w } = mountStep()
    const box = w.find('input[type="checkbox"]')
    expect((box.element as HTMLInputElement).checked).toBe(false)
    await box.setValue(true)
    expect(useReportSubmissionStore().publicVisibility).toBe(true)
  })
})

describe('DetailsStep - composition', () => {
  it('renders the ContactInfo section', () => {
    const { w } = mountStep()
    expect(w.find('[data-testid="contact-info"]').exists()).toBe(true)
  })

  it('has no Continue button (the shell owns Next)', () => {
    const { w } = mountStep()
    expect(w.find('button').exists()).toBe(false)
  })
})

describe('DetailsStep - aria wiring', () => {
  it('description textarea has aria-required="true"', () => {
    const { w } = mountStep()
    expect(w.find('textarea').attributes('aria-required')).toBe('true')
  })

  it('description textarea has aria-describedby pointing at the hint', () => {
    const { w } = mountStep()
    expect(w.find('textarea').attributes('aria-describedby')).toBe('details-description-hint')
  })

  it('hint paragraph has the id referenced by aria-describedby', () => {
    const { w } = mountStep()
    expect(w.find('.details-step__hint').attributes('id')).toBe('details-description-hint')
  })

  it('privacy checkbox has aria-describedby pointing at the privacy note', () => {
    const { w } = mountStep()
    expect(w.find('input[type="checkbox"]').attributes('aria-describedby')).toBe(
      'details-privacy-note',
    )
  })

  it('privacy note paragraph has the id referenced by the checkbox aria-describedby', () => {
    const { w } = mountStep()
    expect(w.find('.details-step__privacy-note').attributes('id')).toBe('details-privacy-note')
  })

  it('description textarea aria-describedby does not include the privacy note id', () => {
    const { w } = mountStep()
    const describedBy = w.find('textarea').attributes('aria-describedby') ?? ''
    expect(describedBy).not.toContain('details-privacy-note')
  })
})
