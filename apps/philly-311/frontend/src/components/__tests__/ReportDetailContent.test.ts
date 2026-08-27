// ABOUTME: Tests for ReportDetailContent — the shared report-details view rendered
// ABOUTME: in both the location-detail panel and the confirmation page.
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { CloseButton } from '@phila/phila-ui-button'
import ReportDetailContent from '../ReportDetailContent.vue'
import type { Issue } from '@/types/api'

// The chassis index pulls phila dist CSS vitest can't load; stub DetailActions.
// Share behavior itself is covered by the chassis's DetailActions.test.ts.
vi.mock('@pinboard/ui', () => ({
  DetailActions: defineComponent({
    name: 'DetailActions',
    setup() {
      return () => h('div')
    },
  }),
}))

const baseIssue: Issue = {
  id: '12345678',
  caseNumber: '12345678',
  serviceType: 'Abandoned Vehicle',
  status: 'In Progress',
  address: '1234 Market St, 19107',
  description: 'A blue van has been parked here for weeks.',
  createdAt: '2026-07-01T13:14:00Z',
  slaDate: '2026-08-01',
}

describe('ReportDetailContent', () => {
  it('renders the report fields', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.text()).toContain('Abandoned Vehicle')
    expect(w.text()).toContain('1234 Market St, 19107')
    expect(w.text()).toContain('In Progress')
    expect(w.text()).toContain('A blue van has been parked here for weeks.')
  })

  it('shows the photo when mediaUrl is present, and hides it entirely otherwise', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, mediaUrl: 'https://cdn.test/p.jpg' } },
    })
    expect(w.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')

    const w2 = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w2.find('img').exists()).toBe(false)
    expect(w2.find('.report-detail__img').exists()).toBe(false)
  })

  it('shows the fields table with issue type, location, submitted, and request id', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    const rows = w.findAll('.report-detail__fields tr')
    const text = rows.map((r) => r.text())
    expect(text.some((t) => t.includes('Issue type') && t.includes('Abandoned Vehicle'))).toBe(true)
    expect(text.some((t) => t.includes('Location') && t.includes('1234 Market St'))).toBe(true)
    expect(text.some((t) => t.includes('Submitted'))).toBe(true)
    expect(text.some((t) => t.includes('Request ID') && t.includes('12345678'))).toBe(true)
  })

  it('shows the estimated-update banner only when slaDate is present', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.find('.report-detail__sla').text()).toContain('Estimated update')
    const w2 = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, slaDate: undefined } },
    })
    expect(w2.find('.report-detail__sla').exists()).toBe(false)
  })

  it('calls onClose when a close handler is given, and hides the button otherwise', async () => {
    const onClose = vi.fn()
    const w = mount(ReportDetailContent, { props: { report: baseIssue, onClose } })
    await w.findComponent(CloseButton).trigger('click')
    expect(onClose).toHaveBeenCalled()

    const w2 = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w2.findComponent(CloseButton).exists()).toBe(false)
  })

  it('omits the public/private tag while privacy is unknown', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.findComponent({ name: 'Tags' }).exists()).toBe(true) // status tag still shows
    expect(w.text()).not.toContain('Private')
    expect(w.text()).not.toContain('Public')
  })

  it('shows a Public tag once privacy is known and the report is public', () => {
    const w = mount(ReportDetailContent, { props: { report: { ...baseIssue, private: false } } })
    expect(w.text()).toContain('Public')
    expect(w.text()).not.toContain('Private')
  })

  it('shows a Private tag when the report is private', () => {
    const w = mount(ReportDetailContent, { props: { report: { ...baseIssue, private: true } } })
    expect(w.text()).toContain('Private')
    expect(w.text()).not.toContain('Public')
  })

  describe('custom fields', () => {
    const withFields: Issue = {
      ...baseIssue,
      customFields: [
        { field: 'Color__c', label: 'Color of the vehicle', type: 'text', value: 'Blue' },
        { field: 'Plate__c', label: 'License Plate #', type: 'text', value: null },
      ],
    }

    it('renders answered custom fields and skips unanswered ones', () => {
      const w = mount(ReportDetailContent, { props: { report: withFields } })
      expect(w.text()).toContain('Color of the vehicle')
      expect(w.text()).toContain('Blue')
      expect(w.text()).not.toContain('License Plate #')
    })

    it('omits the custom-fields section entirely when there are none answered', () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      expect(w.find('.report-detail__custom-fields').exists()).toBe(false)
    })
  })

  describe('upvote and share actions', () => {
    it('hides Upvote and Share entirely — pending an updated design', () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, showUpvote: true },
      })
      expect(w.find('.report-detail__actions').exists()).toBe(false)
      expect(w.text()).not.toContain('Upvote')
      expect(w.findComponent({ name: 'DetailActions' }).exists()).toBe(false)
    })

    it('hides the upvote button when no handler is given', () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      expect(w.text()).not.toContain('Upvote')
    })

    it('hides the upvote button when showUpvote is false, even with a handler', () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, showUpvote: false },
      })
      expect(w.text()).not.toContain('Upvote')
    })

    // Upvote/Share are hidden behind the SHOW_ACTIONS flag (see ReportDetailContent.vue)
    // pending an updated design, so these can't drive the dialog through the rendered
    // UI right now. Skipped rather than deleted — flip SHOW_ACTIONS back on to restore.
    it.skip('opens the dialog on click and submits the trimmed description', async () => {
      // jsdom doesn't implement showModal/close, so stub them directly.
      const showModal = vi.fn()
      const close = vi.fn()
      HTMLDialogElement.prototype.showModal = showModal
      HTMLDialogElement.prototype.close = close

      const onUpvote = vi.fn().mockResolvedValue(true)
      const w = mount(ReportDetailContent, { props: { report: baseIssue, onUpvote } })
      await w.find('button').trigger('click') // Upvote is the first button rendered
      expect(showModal).toHaveBeenCalled()

      await w.find('.report-detail__upvote-textarea').setValue('  Still there today.  ')
      await w.find('[data-test="upvote-confirm"]').trigger('click')
      await flushPromises()
      expect(onUpvote).toHaveBeenCalledWith('Still there today.')
      expect(close).toHaveBeenCalled()
    })

    it.skip('keeps the dialog open and shows upvoteError when the upvote fails', async () => {
      HTMLDialogElement.prototype.showModal = vi.fn()
      const close = vi.fn()
      HTMLDialogElement.prototype.close = close

      const onUpvote = vi.fn().mockResolvedValue(false)
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, upvoteError: 'Issue has already been upvoted' },
      })
      await w.find('.report-detail__upvote-textarea').setValue('Still an issue.')
      await w.find('[data-test="upvote-confirm"]').trigger('click')
      await flushPromises()
      expect(close).not.toHaveBeenCalled()
      expect(w.text()).toContain('Issue has already been upvoted')
    })

    it.skip('disables the submit button while an empty description or upvoting is in progress', () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, upvoting: true },
      })
      expect(w.find('[data-test="upvote-confirm"]').attributes('disabled')).toBeDefined()
    })
  })
})
