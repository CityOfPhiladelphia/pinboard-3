// ABOUTME: Tests for ImageStep — photo selection, /classify call, store mutation, and error display.
// ABOUTME: useApi and processForClassify are mocked; real store state is verified.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

vi.mock('@/utils/photo', () => ({
  processForClassify: vi.fn().mockResolvedValue('data:image/jpeg;base64,xxx'),
}))
const fetchData = vi.fn()
const apiError = ref<{ message: string } | null>(null)
const useApiMock = vi.fn(() => ({ fetchData, error: apiError }))
vi.mock('@/composables/useApi', () => ({ useApi: (...args: unknown[]) => useApiMock(...args) }))

import ImageStep from './ImageStep.vue'
import { processForClassify } from '@/utils/photo'

function selectFile(w: ReturnType<typeof mount>) {
  const input = w.find('input[type="file"]')
  const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  return input.trigger('change')
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchData.mockReset()
  apiError.value = null
  useApiMock.mockClear()
  ;(processForClassify as unknown as ReturnType<typeof vi.fn>).mockClear()
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:x', configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: () => {}, configurable: true })
  }
})

describe('ImageStep', () => {
  it('creates the classify api during setup, not in the change handler', () => {
    mount(ImageStep)
    expect(useApiMock).toHaveBeenCalledTimes(1)
  })
  it('classifies a chosen photo and stores mediaUrl + suggestions', async () => {
    fetchData.mockResolvedValue({
      imageUrl: 'https://cdn.test/p.jpg',
      classifications: [{ serviceType: 'Pothole Repair', confidence: 0.9, caseType: 'X' }],
    })
    const w = mount(ImageStep)
    expect(useApiMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/private/key/classify', method: 'POST' }),
    )
    const body = useApiMock.mock.calls[0][0].body as { imgB64: string }
    await selectFile(w)
    await flushPromises()
    expect(body.imgB64).toBe('data:image/jpeg;base64,xxx')
    expect(processForClassify).toHaveBeenCalled()
    const store = useReportSubmissionStore()
    expect(store.photo?.mediaUrl).toBe('https://cdn.test/p.jpg')
    expect(store.photoSuggestions).toEqual([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
  })
  it('shows an inline error and does not throw when classify fails', async () => {
    apiError.value = { message: 'Classification failed.' }
    fetchData.mockResolvedValue(null)
    const w = mount(ImageStep)
    await selectFile(w)
    await flushPromises()
    expect(w.text()).toContain('Classification failed.')
    expect(useReportSubmissionStore().photo).toBeNull()
  })
})
