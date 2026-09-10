// ABOUTME: Tests for ReportUpvotePanel — the "I see this" sub-panel content: an optional
// ABOUTME: comment, a private-comment toggle, and submit/error/loading states.
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ReportUpvotePanel from '../ReportUpvotePanel.vue'

// A lightweight stand-in for the real shell (covered on its own by the chassis's
// DetailSubpanel.test.ts) — just enough markup for this panel's own tests below.
vi.mock('@pinboard/ui', () => ({
  DetailSubpanel: defineComponent({
    name: 'DetailSubpanel',
    props: ['title', 'backLabel', 'onBack', 'onClose'],
    setup(props, { slots }) {
      return () =>
        h('div', { class: 'detail-subpanel' }, [
          h('h2', { class: 'detail-subpanel__title' }, props.title),
          h('div', { class: 'detail-subpanel__body' }, slots.default?.()),
          slots.footer ? h('div', { class: 'detail-subpanel__footer' }, slots.footer()) : null,
        ])
    },
  }),
}))

describe('ReportUpvotePanel', () => {
  it('shows the comment prompt, a 500-char counter, and a privacy toggle', async () => {
    const w = mount(ReportUpvotePanel, { props: { onBack: vi.fn() } })

    expect(w.text()).toContain('Add a comment (optional)')
    expect(w.find('textarea').attributes('placeholder')).toBe('Enter comment here...')
    expect(w.find('.phila-text-area-counter').text()).toBe('0/500 characters')

    await w.find('textarea').setValue('Still an issue.')
    expect(w.find('.phila-text-area-counter').text()).toBe('15/500 characters')

    const privacyToggle = w.find('input[aria-label="Comment privately"]')
    expect(privacyToggle.exists()).toBe(true)
    expect((privacyToggle.element as HTMLInputElement).checked).toBe(false)
    await privacyToggle.setValue(true)
    expect((privacyToggle.element as HTMLInputElement).checked).toBe(true)
  })

  it('submits the trimmed description and calls onBack on success', async () => {
    const onBack = vi.fn()
    const onUpvote = vi.fn().mockResolvedValue(true)
    const w = mount(ReportUpvotePanel, { props: { onBack, onUpvote } })

    await w.find('textarea').setValue('  Still there today.  ')
    await w.find('[data-test="upvote-confirm"]').trigger('click')
    await flushPromises()
    expect(onUpvote).toHaveBeenCalledWith('Still there today.')
    expect(onBack).toHaveBeenCalled()
  })

  it('stays open and shows upvoteError when the upvote fails, without calling onBack', async () => {
    const onBack = vi.fn()
    const onUpvote = vi.fn().mockResolvedValue(false)
    const w = mount(ReportUpvotePanel, {
      props: { onBack, onUpvote, upvoteError: 'Issue has already been upvoted' },
    })
    await w.find('textarea').setValue('Still an issue.')
    await w.find('[data-test="upvote-confirm"]').trigger('click')
    await flushPromises()
    expect(onBack).not.toHaveBeenCalled()
    expect(w.text()).toContain('Issue has already been upvoted')
  })

  it('disables the submit button while upvoting is in progress', () => {
    const w = mount(ReportUpvotePanel, { props: { onBack: vi.fn(), upvoting: true } })
    expect(w.find('[data-test="upvote-confirm"]').attributes('disabled')).toBeDefined()
  })

  it('submits with an empty comment — the comment is optional', async () => {
    const onBack = vi.fn()
    const onUpvote = vi.fn().mockResolvedValue(true)
    const w = mount(ReportUpvotePanel, { props: { onBack, onUpvote } })

    expect(w.find('[data-test="upvote-confirm"]').attributes('disabled')).toBeUndefined()
    await w.find('[data-test="upvote-confirm"]').trigger('click')
    await flushPromises()
    expect(onUpvote).toHaveBeenCalledWith('')
    expect(onBack).toHaveBeenCalled()
  })
})
