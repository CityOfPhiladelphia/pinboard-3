// ABOUTME: Tests for ReportDetailContent — the shared report-details view rendered
// ABOUTME: in both the location-detail panel and the confirmation page. Sub-panel
// ABOUTME: content itself is covered by ReportUpvotePanel/ReportActivityPanel's own tests;
// ABOUTME: these only cover which sub-panel is shown, and the orchestration around it
// ABOUTME: (opening, closing, focus return, scroll reset, deep-linking).
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { CloseButton } from '@phila/phila-ui-button'
import { IconCar, IconLocationDot } from '@phila/phila-ui-core/icons'
import ReportDetailContent from '../ReportDetailContent.vue'
import ReportStepProgress from '../ReportStepProgress.vue'
import ReportUpvotePanel from '../ReportUpvotePanel.vue'
import ReportActivityPanel from '../ReportActivityPanel.vue'
import type { Issue } from '@/types/api'

vi.mock('../ReportUpvotePanel.vue', () => ({
  default: {
    name: 'ReportUpvotePanel',
    props: ['onBack', 'onClose', 'upvoting', 'upvoteError', 'onUpvote'],
    template: '<div><button data-test="subpanel-back" @click="onBack">Back</button></div>',
  },
}))
vi.mock('../ReportActivityPanel.vue', () => ({
  default: {
    name: 'ReportActivityPanel',
    props: ['report', 'onBack', 'onClose'],
    template: '<div><button data-test="subpanel-back" @click="onBack">Back</button></div>',
  },
}))

// The chassis index pulls phila dist CSS vitest can't load; stub DetailActions.
// Share behavior itself is covered by the chassis's DetailActions.test.ts.
vi.mock('@pinboard/ui', () => ({
  DetailActions: defineComponent({
    name: 'DetailActions',
    setup() {
      return () => h('div')
    },
  }),
  LocationThumbnail: defineComponent({
    name: 'LocationThumbnail',
    props: ['latitude', 'longitude', 'icon', 'color'],
    setup() {
      return () => h('div')
    },
  }),
  Tags: defineComponent({
    name: 'Tags',
    props: ['text', 'variant', 'size', 'color', 'icon'],
    setup(props) {
      return () => h('span', props.text)
    },
  }),
  Tooltip: defineComponent({
    name: 'Tooltip',
    setup(_, { slots }) {
      return () => h('div', [slots.default?.(), slots.body?.()])
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

  it('shows the photo when mediaUrl is present', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, mediaUrl: 'https://cdn.test/p.jpg' } },
    })
    expect(w.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')
    expect(w.find('.report-detail__hero-placeholder-icon').exists()).toBe(false)
  })

  it('shows a service-type icon placeholder when there is no photo', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.find('img').exists()).toBe(false)
    const placeholder = w.findComponent('.report-detail__hero-placeholder-icon')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.props('icon')).toBe(IconCar)
  })

  it('falls back to the generic location icon for an unmapped service type', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, serviceType: 'Something Unmapped' } },
    })
    const placeholder = w.findComponent('.report-detail__hero-placeholder-icon')
    expect(placeholder.props('icon')).toBe(IconLocationDot)
  })

  it('hides the map thumbnail by default (the location-detail flyout already overlays a map)', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, latitude: 39.9526, longitude: -75.1652 } },
    })
    expect(w.find('.report-detail__map-thumb').exists()).toBe(false)
  })

  it('passes the report coordinates to the map thumbnail when showMap is true', () => {
    const w = mount(ReportDetailContent, {
      props: {
        report: { ...baseIssue, latitude: 39.9526, longitude: -75.1652 },
        showMap: true,
      },
    })
    const thumb = w.find('.report-detail__map-thumb')
    expect(thumb.exists()).toBe(true)
    const map = thumb.findComponent({ name: 'LocationThumbnail' })
    expect(map.exists()).toBe(true)
    expect(map.props('latitude')).toBe(39.9526)
    expect(map.props('longitude')).toBe(-75.1652)
  })

  it('pins the report with the same icon and color the main map uses for its service type', () => {
    const w = mount(ReportDetailContent, {
      props: {
        report: { ...baseIssue, latitude: 39.9526, longitude: -75.1652 },
        showMap: true,
      },
    })
    const map = w.find('.report-detail__map-thumb').findComponent({ name: 'LocationThumbnail' })
    expect(map.props('icon')).toStrictEqual(IconCar)
    expect(map.props('color')).toBe('#734db3')
  })

  it('still renders the map thumbnail when the report has no coordinates — LocationThumbnail handles its own fallback', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue, showMap: true } })
    const map = w.find('.report-detail__map-thumb').findComponent({ name: 'LocationThumbnail' })
    expect(map.exists()).toBe(true)
    expect(map.props('latitude')).toBeUndefined()
    expect(map.props('longitude')).toBeUndefined()
  })

  it('shows the address and last-updated meta row', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, updatedAt: '2026-07-02T18:30:00Z' } },
    })
    const meta = w.find('.report-detail__meta')
    expect(meta.text()).toContain('1234 Market St, 19107')
    expect(meta.text()).not.toBe('')
  })

  it('falls back to createdAt in the meta row when updatedAt is absent', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.find('.report-detail__meta').exists()).toBe(true)
  })

  it('shows a Service Request # card with the case number', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    const card = w.find('.report-detail__request-card')
    expect(card.text()).toContain('Service Request #')
    expect(card.text()).toContain('12345678')
  })

  it('falls back to id for the Service Request # card when caseNumber is absent', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, caseNumber: undefined } },
    })
    expect(w.find('.report-detail__request-card').text()).toContain('12345678')
  })

  it('no longer renders the old summary table', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.find('.report-detail__fields').exists()).toBe(false)
  })

  it('shows the estimated-update banner only when slaDate is present', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w.find('.report-detail__sla').text()).toContain('Estimated update')
    const w2 = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, slaDate: undefined } },
    })
    expect(w2.find('.report-detail__sla').exists()).toBe(false)
  })

  it('shows the Next Steps heading icon', () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    const badge = w.find('.report-detail__next-steps-icon')
    expect(badge.exists()).toBe(true)
    expect(badge.findComponent({ name: 'Icon' }).exists()).toBe(true)
  })

  it('renders the Next Steps progress tracker from the report', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, department: 'Streets' } },
    })
    expect(w.text()).toContain('Next Steps')
    const tracker = w.findComponent(ReportStepProgress)
    expect(tracker.exists()).toBe(true)
    expect(tracker.props('sections')[0].title).toBe('Philly311')
    expect(tracker.props('sections')[1].title).toBe('Streets')
    expect(tracker.props('currentStep')).toBe(1)
  })

  it('puts the Next Steps tracker on its last step once the report is closed', () => {
    const w = mount(ReportDetailContent, {
      props: { report: { ...baseIssue, status: 'Closed' } },
    })
    expect(w.findComponent(ReportStepProgress).props('currentStep')).toBe(3)
  })

  it('calls onClose when a close handler is given, and hides the button otherwise', async () => {
    const onClose = vi.fn()
    const w = mount(ReportDetailContent, { props: { report: baseIssue, onClose } })
    await w.findComponent(CloseButton).trigger('click')
    expect(onClose).toHaveBeenCalled()

    const w2 = mount(ReportDetailContent, { props: { report: baseIssue } })
    expect(w2.findComponent(CloseButton).exists()).toBe(false)
  })

  it('shows the status pill floating on the hero photo, as a read-only Tag, and no public/private badge', () => {
    const w = mount(ReportDetailContent, { props: { report: { ...baseIssue, private: false } } })
    const status = w.findComponent({ name: 'Tags' })
    expect(status.exists()).toBe(true)
    expect(status.classes()).toContain('report-detail__hero-status')
    expect(status.props('variant')).toBe('readonly')
    expect(w.text()).not.toContain('Public')
    expect(w.text()).not.toContain('Private')
  })

  it('resets scroll position when switching to a different report while mounted', async () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    const scrollContainer = w.find('.report-detail__body').element as HTMLElement
    scrollContainer.scrollTop = 200

    await w.setProps({ report: { ...baseIssue, id: 'different-id' } })
    await flushPromises()
    expect(scrollContainer.scrollTop).toBe(0)
  })

  it('does not reset scroll position on updates that keep the same report', async () => {
    const w = mount(ReportDetailContent, { props: { report: baseIssue } })
    const scrollContainer = w.find('.report-detail__body').element as HTMLElement
    scrollContainer.scrollTop = 200

    await w.setProps({ report: { ...baseIssue, description: 'Updated description.' } })
    await flushPromises()
    expect(scrollContainer.scrollTop).toBe(200)
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

    it('shows the "Additional details" heading alongside answered fields', () => {
      const w = mount(ReportDetailContent, { props: { report: withFields } })
      expect(w.text()).toContain('Additional details')
    })

    it('omits the custom-fields section and heading entirely when none are answered', () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      expect(w.find('.report-detail__custom-fields').exists()).toBe(false)
      expect(w.text()).not.toContain('Additional details')
    })
  })

  describe('header actions', () => {
    it('shows I-see-this and Share when an upvote handler is given', () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, showUpvote: true },
      })
      expect(w.find('[aria-label="I see this"]').exists()).toBe(true)
      expect(w.findComponent({ name: 'DetailActions' }).exists()).toBe(true)
    })

    it('hides the I-see-this button when no handler is given', () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      expect(w.find('[aria-label="I see this"]').exists()).toBe(false)
    })

    it('hides the I-see-this button when showUpvote is false, even with a handler', () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, showUpvote: false },
      })
      expect(w.find('[aria-label="I see this"]').exists()).toBe(false)
    })

    it('shows an enabled Activity button regardless of upvote availability', () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      const activity = w.find('[aria-label="Activity"]')
      expect(activity.exists()).toBe(true)
      expect(activity.attributes('disabled')).toBeUndefined()
    })

    it('has no Follow action — dropped due to mobile technical limitations', () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      expect(w.find('[aria-label="Follow"]').exists()).toBe(false)
    })

    it('shows the already-upvoted state and does not open the sub-panel when alreadyUpvoted', async () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote, alreadyUpvoted: true },
      })
      const trigger = w.find('[aria-label="I see this"]')
      expect(trigger.attributes('selected')).toBe('true')
      expect(w.text()).toContain('You already flagged this')

      await trigger.trigger('click')
      expect(w.findComponent(ReportUpvotePanel).exists()).toBe(false)
    })

    it('swaps to the ReportUpvotePanel on click, replacing the main content', async () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, { props: { report: baseIssue, onUpvote } })
      await w.find('[aria-label="I see this"]').trigger('click')

      expect(w.findComponent(ReportUpvotePanel).exists()).toBe(true)
      expect(w.find('.report-detail__hero').exists()).toBe(false)
      expect(w.find('.report-detail__body-inner').exists()).toBe(false)
    })

    it('swaps to the ReportActivityPanel on click, passing the report through', async () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      await w.find('[aria-label="Activity"]').trigger('click')

      const panel = w.findComponent(ReportActivityPanel)
      expect(panel.exists()).toBe(true)
      expect(panel.props('report')).toEqual(baseIssue)
      expect(w.find('.report-detail__hero').exists()).toBe(false)
    })

    it('the sub-panel Back button returns to the main report content and refocuses the trigger', async () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote },
        attachTo: document.body,
      })
      await w.find('[aria-label="I see this"]').trigger('click')
      await w.find('[data-test="subpanel-back"]').trigger('click')

      expect(w.findComponent(ReportUpvotePanel).exists()).toBe(false)
      expect(w.find('.report-detail__hero').exists()).toBe(true)
      // The main content (including the trigger button) was remounted, not just
      // revealed, so it's a fresh DOM node — assert on the element's identity
      // (its aria-label), not object equality with the pre-remount reference.
      expect(document.activeElement?.getAttribute('aria-label')).toBe('I see this')
      w.unmount()
    })

    it('passes onUpvote/upvoting/upvoteError through to ReportUpvotePanel', () => {
      const onUpvote = vi.fn()
      const w = mount(ReportDetailContent, {
        // initialSubpanel opens it without needing a click, since these are just
        // prop-forwarding assertions — see the "sub-panel deep-linking" describe below.
        props: {
          report: baseIssue,
          onUpvote,
          upvoting: true,
          upvoteError: 'boom',
          initialSubpanel: 'upvote',
        },
      })
      const panel = w.findComponent(ReportUpvotePanel)
      expect(panel.props('onUpvote')).toBe(onUpvote)
      expect(panel.props('upvoting')).toBe(true)
      expect(panel.props('upvoteError')).toBe('boom')
    })
  })

  describe('sub-panel deep-linking', () => {
    it('opens directly to the upvote sub-panel when initialSubpanel is "upvote"', () => {
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onUpvote: vi.fn(), initialSubpanel: 'upvote' },
      })
      expect(w.findComponent(ReportUpvotePanel).exists()).toBe(true)
    })

    it('opens directly to the Activity sub-panel when initialSubpanel is "activity"', () => {
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, initialSubpanel: 'activity' },
      })
      expect(w.findComponent(ReportActivityPanel).exists()).toBe(true)
    })

    it('does not open the upvote sub-panel via initialSubpanel when the report is already upvoted', () => {
      const w = mount(ReportDetailContent, {
        props: {
          report: baseIssue,
          onUpvote: vi.fn(),
          alreadyUpvoted: true,
          initialSubpanel: 'upvote',
        },
      })
      expect(w.findComponent(ReportUpvotePanel).exists()).toBe(false)
    })

    it('calls onSubpanelChange when a sub-panel opens and when it closes', async () => {
      const onSubpanelChange = vi.fn()
      const w = mount(ReportDetailContent, {
        props: { report: baseIssue, onSubpanelChange },
      })
      await w.find('[aria-label="Activity"]').trigger('click')
      expect(onSubpanelChange).toHaveBeenLastCalledWith('activity')

      await w.find('[data-test="subpanel-back"]').trigger('click')
      expect(onSubpanelChange).toHaveBeenLastCalledWith(null)
    })

    it('reacts to initialSubpanel changing after mount (e.g. browser back/forward)', async () => {
      const w = mount(ReportDetailContent, { props: { report: baseIssue } })
      expect(w.findComponent(ReportActivityPanel).exists()).toBe(false)

      await w.setProps({ initialSubpanel: 'activity' })
      expect(w.findComponent(ReportActivityPanel).exists()).toBe(true)

      await w.setProps({ initialSubpanel: undefined })
      expect(w.findComponent(ReportActivityPanel).exists()).toBe(false)
    })
  })
})
