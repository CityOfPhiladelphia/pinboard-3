// ABOUTME: Tests for ReportDetail — the location-detail panel wrapper that renders
// ABOUTME: instantly from the lightweight Report, then loads the full issue by id.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ReportDetail from '../ReportDetail.vue'
import ReportDetailContent from '../ReportDetailContent.vue'
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
    props: ['report', 'onClose', 'showUpvote', 'upvoting', 'upvoteError', 'onUpvote'],
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

beforeEach(() => {
  issue.value = null
  isUpvoting.value = false
  upvoteError.value = null
  load.mockReset()
  upvote.mockReset()
})

describe('ReportDetail', () => {
  it('loads the full issue by id on mount', () => {
    mount(ReportDetail, { props: { report, onClose: vi.fn() } })
    expect(load).toHaveBeenCalledWith('12345678')
  })

  it('reloads when the selected report id changes', async () => {
    const w = mount(ReportDetail, { props: { report, onClose: vi.fn() } })
    await w.setProps({ report: { ...report, id: '87654321' } })
    expect(load).toHaveBeenCalledWith('87654321')
  })

  it('renders a placeholder Issue built from the lightweight Report before the fetch resolves', () => {
    const w = mount(ReportDetail, { props: { report, onClose: vi.fn() } })
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
    const w = mount(ReportDetail, { props: { report, onClose: vi.fn() } })
    expect(w.findComponent(ReportDetailContent).props('report')).toEqual(issue.value)
  })

  it('wires onUpvote to upvote() with the selected report id', () => {
    const w = mount(ReportDetail, { props: { report, onClose: vi.fn() } })
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
    const w = mount(ReportDetail, {
      props: { report, onClose, showUpvote: false },
    })
    const content = w.findComponent(ReportDetailContent)
    expect(content.props('onClose')).toBe(onClose)
    expect(content.props('showUpvote')).toBe(false)
    expect(content.props('upvoting')).toBe(true)
    expect(content.props('upvoteError')).toBe('boom')
  })
})
