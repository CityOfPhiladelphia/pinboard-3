// ABOUTME: Tests for DetailSubpanel — the reusable Back/Title/Close shell a detail
// ABOUTME: panel swaps in over its main content.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { CloseButton } from '@phila/phila-ui-button'
import DetailSubpanel from './DetailSubpanel.vue'

describe('DetailSubpanel', () => {
  it('shows the title and a back button labeled for where it returns to', () => {
    const w = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack: vi.fn() },
    })
    expect(w.find('.detail-subpanel__title').text()).toBe('I see this')
    expect(w.find('[data-test="subpanel-back"]').text()).toContain('Request details')
  })

  it('calls onBack when the back button is clicked', async () => {
    const onBack = vi.fn()
    const w = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack },
    })
    await w.find('[data-test="subpanel-back"]').trigger('click')
    expect(onBack).toHaveBeenCalled()
  })

  it('renders the Close button and calls onClose when given, hides it otherwise', async () => {
    const onClose = vi.fn()
    const w = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack: vi.fn(), onClose },
    })
    await w.findComponent(CloseButton).trigger('click')
    expect(onClose).toHaveBeenCalled()

    const w2 = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack: vi.fn() },
    })
    expect(w2.findComponent(CloseButton).exists()).toBe(false)
  })

  it('renders the default slot as the body content', () => {
    const w = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack: vi.fn() },
      slots: { default: '<p class="body-marker">Panel body</p>' },
    })
    expect(w.find('.detail-subpanel__body .body-marker').text()).toBe('Panel body')
  })

  it('only renders a footer region when a footer slot is provided', () => {
    const w = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack: vi.fn() },
    })
    expect(w.find('.detail-subpanel__footer').exists()).toBe(false)

    const w2 = mount(DetailSubpanel, {
      props: { title: 'I see this', backLabel: 'Request details', onBack: vi.fn() },
      slots: { footer: '<button class="footer-marker">Submit</button>' },
    })
    expect(w2.find('.detail-subpanel__footer .footer-marker').exists()).toBe(true)
  })
})
