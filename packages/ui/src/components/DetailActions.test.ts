// ABOUTME: Tests for DetailActions — the detail-overlay Share control: clipboard
// ABOUTME: copy, assistive-tech announcement, and graceful clipboard failure.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DetailActions from './DetailActions.vue'

function shareButton(w: ReturnType<typeof mount>) {
  return w.find('button')
}

describe('DetailActions', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copies the current URL to the clipboard on Share', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const w = mount(DetailActions)
    await shareButton(w).trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })

  it('announces the copy confirmation to assistive tech', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const w = mount(DetailActions)
    await shareButton(w).trigger('click')
    await flushPromises()
    expect(w.find('[aria-live="polite"]').text()).not.toBe('')
  })

  it('does not show a false confirmation when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const w = mount(DetailActions)
    await shareButton(w).trigger('click')
    await flushPromises()
    expect(w.find('[aria-live="polite"]').text()).toBe('')
  })
})
