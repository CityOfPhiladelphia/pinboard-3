// ABOUTME: Tests for ReviewStep — submit gating, lazy-body useApi wiring, error
// ABOUTME: display, and success recording + navigation. useApi and router are mocked.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { ApiError } from '@/composables/useApiError'

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

function fillStore() {
  const store = useReportSubmissionStore()
  store.setCategory('Abandoned Vehicle')
  store.setLocation({ address: '1234 Market St', zipCode: '19107', lat: 39.95, lng: -75.16 })
  store.setDescription('Rusty sedan on blocks')
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchData.mockReset()
  push.mockClear()
  useApiMock.mockClear()
  apiError.value = null
  isLoading.value = false
})

describe('ReviewStep - setup and gating', () => {
  it('creates the submit api during setup, not in the click handler', () => {
    fillStore()
    mount(ReviewStep)
    expect(useApiMock).toHaveBeenCalledTimes(1)
    expect(useApiMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/private/key/submit', method: 'POST' }),
    )
  })

  it('renders the summary and disables Submit while the store is incomplete', () => {
    const w = mount(ReviewStep)
    expect(w.find('[data-testid="review-summary"]').exists()).toBe(true)
    expect(w.find('[data-test="review-submit"]').attributes('disabled')).toBeDefined()
  })

  it('enables Submit when category, location, and description are set', () => {
    fillStore()
    const w = mount(ReviewStep)
    expect(w.find('[data-test="review-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('disables Submit and relabels while loading', async () => {
    fillStore()
    const w = mount(ReviewStep)
    isLoading.value = true
    await flushPromises()
    const btn = w.find('[data-test="review-submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toBe('Submitting…')
  })
})

describe('ReviewStep - submit', () => {
  it('sends the store payload as the lazily-assigned body', async () => {
    const store = fillStore()
    // Capture before the click — success runs recordSubmission, which clears
    // the store, so payload() would throw afterwards.
    const expected = store.payload()
    fetchData.mockResolvedValue({ id: 'a1' })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    const opts = useApiMock.mock.calls[0][0] as { body: unknown }
    expect(opts.body).toEqual(expected)
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  it('records the submission and navigates to confirmation on success', async () => {
    const store = fillStore()
    fetchData.mockResolvedValue({ id: 'a1', caseNumber: '311-0042' })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(store.submitted).toEqual({ id: 'a1', caseNumber: '311-0042' })
    expect(store.category).toBeNull()
    expect(push).toHaveBeenCalledWith('/report/confirmation')
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
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
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
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
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
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    apiError.value = null
    fetchData.mockResolvedValue({ id: 'a1' })
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('ignores re-entrant clicks while a submit is in flight', async () => {
    fillStore()
    fetchData.mockResolvedValue({ id: 'a1' })
    const w = mount(ReviewStep)
    isLoading.value = true
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(fetchData).not.toHaveBeenCalled()
  })

  it('surfaces a payload() throw in the alert instead of an unhandled rejection', async () => {
    const store = fillStore()
    vi.spyOn(store, 'payload').mockImplementation(() => {
      throw new Error('location is required')
    })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe('location is required')
    expect(fetchData).not.toHaveBeenCalled()
  })
})
