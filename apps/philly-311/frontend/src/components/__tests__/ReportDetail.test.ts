// ABOUTME: Tests for ReportDetail — the location-detail panel wrapper that renders
// ABOUTME: instantly from the lightweight Report, then loads the full issue by id, and
// ABOUTME: folds anonymousActivity (already-upvoted / own-submitted-report) into props.
// ABOUTME: Also keeps ReportDetailContent's sub-panel in sync with a ?panel= route query.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import ReportDetail from '../ReportDetail.vue'
import ReportDetailContent from '../ReportDetailContent.vue'
import { useAnonymousActivityStore } from '@/stores/anonymousActivity'
import type { Report } from '@/composables/useNearbyReports'

const issue = ref<unknown>(null)
const isUpvoting = ref(false)
const upvoteError = ref<string | null>(null)
const load = vi.fn()
const upvote = vi.fn()
vi.mock('@/composables/useIssue', () => ({
  useIssue: () => ({ issue, isUpvoting, upvoteError, load, upvote }),
}))

vi.mock('../ReportDetailContent.vue', () => ({
  default: {
    name: 'ReportDetailContent',
    props: [
      'report',
      'onClose',
      'showUpvote',
      'alreadyUpvoted',
      'upvoting',
      'upvoteError',
      'onUpvote',
      'initialSubpanel',
      'onSubpanelChange',
    ],
    template: '<div />',
  },
}))

const report: Report = {
  id: '12345678',
  lat: 39.95,
  lng: -75.16,
  serviceType: 'Pothole Repair',
  status: 'In Progress',
  address: '1234 Market St',
  description: 'big hole',
  createdAt: '2026-07-01T13:14:00Z',
  slaDate: '2026-08-01',
}

// Fresh router per test — tests push ?panel= query changes, and a router shared
// across tests would leak one test's query state into the next.
let router: Router

function mountReportDetail(
  props: { report?: Report; onClose?: () => void; showUpvote?: boolean } = {},
) {
  return mount(ReportDetail, {
    props: { report, onClose: vi.fn(), ...props },
    global: { plugins: [router] },
  })
}

beforeEach(() => {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  issue.value = null
  isUpvoting.value = false
  upvoteError.value = null
  load.mockReset()
  upvote.mockReset()
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('ReportDetail', () => {
  it('loads the full issue by id on mount', () => {
    mountReportDetail()
    expect(load).toHaveBeenCalledWith('12345678')
  })

  it('reloads when the selected report id changes', async () => {
    const w = mountReportDetail()
    await w.setProps({ report: { ...report, id: '87654321' } })
    expect(load).toHaveBeenCalledWith('87654321')
  })

  it('renders a placeholder Issue built from the lightweight Report before the fetch resolves', () => {
    const w = mountReportDetail()
    const content = w.findComponent(ReportDetailContent)
    expect(content.props('report')).toMatchObject({
      id: '12345678',
      serviceType: 'Pothole Repair',
      status: 'In Progress',
      address: '1234 Market St',
      description: 'big hole',
      slaDate: '2026-08-01',
    })
  })

  it('swaps in the full issue once the fetch resolves', () => {
    issue.value = { id: '12345678', serviceType: 'Pothole Repair', private: true, customFields: [] }
    const w = mountReportDetail()
    expect(w.findComponent(ReportDetailContent).props('report')).toEqual(issue.value)
  })

  it('wires onUpvote to upvote() with the selected report id', () => {
    const w = mountReportDetail()
    const onUpvote = w.findComponent(ReportDetailContent).props('onUpvote') as (
      description: string,
    ) => void
    onUpvote('Still there today.')
    expect(upvote).toHaveBeenCalledWith('12345678', 'Still there today.')
  })

  it('passes onClose, showUpvote, and upvote state through to ReportDetailContent', () => {
    const onClose = vi.fn()
    isUpvoting.value = true
    upvoteError.value = 'boom'
    const w = mountReportDetail({ onClose, showUpvote: false })
    const content = w.findComponent(ReportDetailContent)
    expect(content.props('onClose')).toBe(onClose)
    expect(content.props('showUpvote')).toBe(false)
    expect(content.props('upvoting')).toBe(true)
    expect(content.props('upvoteError')).toBe('boom')
  })

  it('passes alreadyUpvoted through from the anonymousActivity store', () => {
    useAnonymousActivityStore().markUpvoted('12345678')
    const w = mountReportDetail()
    expect(w.findComponent(ReportDetailContent).props('alreadyUpvoted')).toBe(true)
  })

  it('defaults alreadyUpvoted to false for a report this browser has not upvoted', () => {
    const w = mountReportDetail()
    expect(w.findComponent(ReportDetailContent).props('alreadyUpvoted')).toBe(false)
  })

  it('suppresses showUpvote for a report this browser submitted anonymously, even when the caller opts in', () => {
    useAnonymousActivityStore().markSubmitted('12345678')
    const w = mountReportDetail({ showUpvote: true })
    expect(w.findComponent(ReportDetailContent).props('showUpvote')).toBe(false)
  })

  describe('sub-panel deep-linking', () => {
    it('passes the ?panel= query value through as initialSubpanel', async () => {
      await router.push({ query: { panel: 'activity' } })
      const w = mountReportDetail()
      expect(w.findComponent(ReportDetailContent).props('initialSubpanel')).toBe('activity')
    })

    it('ignores an unrecognized ?panel= value', async () => {
      await router.push({ query: { panel: 'bogus' } })
      const w = mountReportDetail()
      expect(w.findComponent(ReportDetailContent).props('initialSubpanel')).toBeUndefined()
    })

    it('leaves initialSubpanel undefined when there is no ?panel= query', () => {
      const w = mountReportDetail()
      expect(w.findComponent(ReportDetailContent).props('initialSubpanel')).toBeUndefined()
    })

    it('pushes a ?panel= query when ReportDetailContent reports a sub-panel change', async () => {
      const w = mountReportDetail()
      const onSubpanelChange = w.findComponent(ReportDetailContent).props('onSubpanelChange') as (
        panel: 'upvote' | 'activity' | null,
      ) => void

      onSubpanelChange('activity')
      await flushPromises()
      expect(router.currentRoute.value.query.panel).toBe('activity')

      onSubpanelChange(null)
      await flushPromises()
      expect(router.currentRoute.value.query.panel).toBeUndefined()
    })

    it('preserves the existing ?location= query when adding ?panel=', async () => {
      await router.push({ query: { location: '12345678' } })
      const w = mountReportDetail()
      const onSubpanelChange = w.findComponent(ReportDetailContent).props('onSubpanelChange') as (
        panel: 'upvote' | 'activity' | null,
      ) => void

      onSubpanelChange('upvote')
      await flushPromises()
      expect(router.currentRoute.value.query.location).toBe('12345678')
      expect(router.currentRoute.value.query.panel).toBe('upvote')
    })

    it('clears a stale ?panel= query when a different report is selected', async () => {
      await router.push({ query: { panel: 'activity' } })
      const w = mountReportDetail()
      await w.setProps({ report: { ...report, id: '87654321' } })
      await flushPromises()
      expect(router.currentRoute.value.query.panel).toBeUndefined()
    })

    it('clears ?panel= when the flyout closes entirely (unmounts), not just when switching reports', async () => {
      await router.push({ query: { panel: 'activity' } })
      const w = mountReportDetail()
      w.unmount()
      await flushPromises()
      expect(router.currentRoute.value.query.panel).toBeUndefined()
    })

    it("closing the flyout on one report, then opening a different one, doesn't reopen its sub-panel", async () => {
      await router.push({ query: { location: '12345678', panel: 'activity' } })
      const w = mountReportDetail()
      // Closing the flyout unmounts ReportDetail (rather than changing its report
      // prop) — this is the exact "click a pin, open Activity, hit Close, click a
      // different pin" bug: a fresh mount for the next report must not inherit it.
      w.unmount()
      await flushPromises()

      const next = mountReportDetail({ report: { ...report, id: '87654321' } })
      expect(next.findComponent(ReportDetailContent).props('initialSubpanel')).toBeUndefined()
    })
  })
})
