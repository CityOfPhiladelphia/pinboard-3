// ABOUTME: Tests for ReviewStep — submit gating, lazy-body useApi wiring, error
// ABOUTME: display, success recording + navigation, and marking anonymousActivity
// ABOUTME: on an anonymous (not signed-in) submit. useApi and router are mocked.
// ABOUTME: The Submit button itself lives in ReportPage's footer (useWizardSubmit),
// ABOUTME: so it's exercised here via the injected handler, not a rendered button.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useAnonymousActivityStore } from '@/stores/anonymousActivity'
import { ApiError } from '@/composables/useApiError'
import { WIZARD_SUBMIT_KEY, type WizardSubmitHandler } from '@/composables/useWizardSubmit'

vi.mock('@/components/wizard/ReviewSummary.vue', () => ({
  default: { name: 'ReviewSummary', template: '<div data-testid="review-summary" />' },
}))

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const fetchData = vi.fn()
const apiError = ref<ApiError | null>(null)
const isLoading = ref(false)
const useApiMock = vi.fn(() => ({ fetchData, error: apiError, isLoading }))
vi.mock('@/composables/useApi', () => ({ useApi: (...args: unknown[]) => useApiMock(...args) }))

import ReviewStep from '../ReviewStep.vue'

function mountStep() {
  const submit = ref<WizardSubmitHandler | null>(null)
  const w = mount(ReviewStep, { global: { provide: { [WIZARD_SUBMIT_KEY]: submit } } })
  return { w, submit }
}

function fillStore() {
  const store = useReportSubmissionStore()
  store.setCategory('Abandoned Vehicle')
  store.setLocation({ address: '1234 Market St', zipCode: '19107', lat: 39.95, lng: -75.16 })
  store.setDescription('Rusty sedan on blocks')
  return store
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  fetchData.mockReset()
  push.mockClear()
  useApiMock.mockClear()
  apiError.value = null
  isLoading.value = false
  useAuth().isAuthenticated.value = false
})

describe('ReviewStep - setup and gating', () => {
  it('creates the submit api during setup, not in the click handler', () => {
    fillStore()
    mountStep()
    expect(useApiMock).toHaveBeenCalledTimes(1)
    expect(useApiMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/private/key/submit', method: 'POST' }),
    )
  })

  it('titles the step "Review your report" with no required marker, per Figma', () => {
    const { w } = mountStep()
    expect(w.find('.report-step__text').text()).toBe('Review your report')
    expect(w.find('.report-step__required').exists()).toBe(false)
  })

  it('renders the summary and disables Submit while the store is incomplete', () => {
    const { w, submit } = mountStep()
    expect(w.find('[data-testid="review-summary"]').exists()).toBe(true)
    expect(submit.value?.disabled).toBe(true)
  })

  it('enables Submit when category, location, and description are set', () => {
    fillStore()
    const { submit } = mountStep()
    expect(submit.value?.disabled).toBe(false)
  })

  it('disables Submit and relabels while loading', async () => {
    fillStore()
    const { submit } = mountStep()
    isLoading.value = true
    await flushPromises()
    expect(submit.value?.disabled).toBe(true)
    expect(submit.value?.label).toBe('Submitting…')
  })
})

describe('ReviewStep - submit', () => {
  it('sends the store payload as the lazily-assigned body', async () => {
    const store = fillStore()
    // Capture before the click — success runs recordSubmission, which clears
    // the store, so payload() would throw afterwards.
    const expected = store.payload()
    fetchData.mockResolvedValue({ id: 'a1' })
    const { submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    const opts = useApiMock.mock.calls[0][0] as { body: unknown }
    expect(opts.body).toEqual(expected)
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  it('records the submission and navigates to confirmation on success', async () => {
    const store = fillStore()
    fetchData.mockResolvedValue({ id: 'a1', caseNumber: '311-0042' })
    const { submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    expect(store.submitted).toEqual({ id: 'a1', caseNumber: '311-0042' })
    expect(store.category).toBeNull()
    expect(push).toHaveBeenCalledWith('/report/confirmation')
  })

  it('records the submitted report in anonymousActivity when not signed in — the API has no account to check upvote-ownership against', async () => {
    fillStore()
    fetchData.mockResolvedValue({ id: 'a1', caseNumber: '311-0042' })
    const { submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    expect(useAnonymousActivityStore().isSubmitted('a1')).toBe(true)
  })

  it('does not record to anonymousActivity when signed in — the account tracks ownership instead', async () => {
    useAuth().isAuthenticated.value = true
    fillStore()
    fetchData.mockResolvedValue({ id: 'a1', caseNumber: '311-0042' })
    const { submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    expect(useAnonymousActivityStore().isSubmitted('a1')).toBe(false)
  })

  it('shows the API error message and stays on failure', async () => {
    const store = fillStore()
    fetchData.mockImplementation(async () => {
      apiError.value = new ApiError(
        400,
        'latitude must be within Philadelphia bounds (39.86-40.14)',
      )
      return null
    })
    const { w, submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    const alert = w.find('[role="alert"]')
    expect(alert.text()).toContain('latitude must be within Philadelphia bounds')
    expect(push).not.toHaveBeenCalled()
    expect(store.submitted).toBeNull()
    expect(store.description).toBe('Rusty sedan on blocks')
  })

  it('falls back to a generic message when the error has no text', async () => {
    fillStore()
    fetchData.mockImplementation(async () => {
      apiError.value = new ApiError(0, '')
      return null
    })
    const { w, submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(
      'Something went wrong submitting your report. Please try again.',
    )
  })

  it('clears a previous error on the next attempt', async () => {
    fillStore()
    fetchData.mockImplementationOnce(async () => {
      apiError.value = new ApiError(400, 'boom')
      return null
    })
    const { w, submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    apiError.value = null
    fetchData.mockResolvedValue({ id: 'a1' })
    submit.value?.onSubmit()
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('ignores re-entrant clicks while a submit is in flight', async () => {
    fillStore()
    fetchData.mockResolvedValue({ id: 'a1' })
    const { submit } = mountStep()
    isLoading.value = true
    submit.value?.onSubmit()
    await flushPromises()
    expect(fetchData).not.toHaveBeenCalled()
  })

  it('surfaces a payload() throw in the alert instead of an unhandled rejection', async () => {
    const store = fillStore()
    vi.spyOn(store, 'payload').mockImplementation(() => {
      throw new Error('location is required')
    })
    const { w, submit } = mountStep()
    submit.value?.onSubmit()
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe('location is required')
    expect(fetchData).not.toHaveBeenCalled()
  })
})
