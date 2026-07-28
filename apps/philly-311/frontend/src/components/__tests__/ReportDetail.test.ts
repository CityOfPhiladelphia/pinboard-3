// ABOUTME: Tests for ReportDetail — the inline detail panel rendered in Pinboard's
// ABOUTME: location-detail slot when a report marker is selected.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { CloseButton } from '@phila/phila-ui-button'
import ReportDetail from '../ReportDetail.vue'
import type { Report } from '@/composables/useNearbyReports'

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

const report: Report = {
  id: '1',
  caseNumber: '1',
  lat: 39.95,
  lng: -75.16,
  serviceType: 'Pothole Repair',
  status: 'In Progress',
  address: '1234 Market St',
  description: 'big hole',
}

describe('ReportDetail', () => {
  it('renders the report fields', () => {
    const w = mount(ReportDetail, { props: { report, onClose: vi.fn() } })
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).toContain('1234 Market St')
    expect(w.text()).toContain('In Progress')
    expect(w.text()).toContain('big hole')
  })
  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    const w = mount(ReportDetail, { props: { report, onClose } })
    await w.findComponent(CloseButton).trigger('click')
    expect(onClose).toHaveBeenCalled()
  })
})

const caseReport = {
  id: '12345678',
  lat: 39.95,
  lng: -75.16,
  serviceType: 'Pothole',
  status: 'In Progress',
  address: '1515 Market St',
  createdAt: '2026-07-01T13:14:00Z',
  description: 'Deep pothole',
  slaDate: '2026-08-01',
  department: 'Streets',
} as Report

describe('case fields view', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing case-specific by default (landing finder usage)', () => {
    const w = mount(ReportDetail, {
      props: { report: caseReport, onClose: () => {} },
    })
    expect(w.find('.report-detail__fields').exists()).toBe(false)
    expect(w.find('.report-detail__sla').exists()).toBe(false)
    expect(w.findComponent({ name: 'DetailActions' }).exists()).toBe(false)
  })

  it('shows the fields table when showCaseFields is set', () => {
    const w = mount(ReportDetail, {
      props: { report: caseReport, onClose: () => {}, showCaseFields: true },
    })
    const rows = w.findAll('.report-detail__fields tr')
    const text = rows.map((r) => r.text())
    expect(text.some((t) => t.includes('Issue type') && t.includes('Pothole'))).toBe(true)
    expect(text.some((t) => t.includes('Location') && t.includes('1515 Market St'))).toBe(true)
    expect(text.some((t) => t.includes('Submitted'))).toBe(true)
    expect(text.some((t) => t.includes('Request ID') && t.includes('12345678'))).toBe(true)
  })

  it('shows the estimated-update banner only when slaDate is present', () => {
    const w = mount(ReportDetail, {
      props: { report: caseReport, onClose: () => {}, showCaseFields: true },
    })
    expect(w.find('.report-detail__sla').text()).toContain('Estimated update')
    const w2 = mount(ReportDetail, {
      props: {
        report: { ...caseReport, slaDate: undefined },
        onClose: () => {},
        showCaseFields: true,
      },
    })
    expect(w2.find('.report-detail__sla').exists()).toBe(false)
  })

  it('renders the SLA deadline as a date only, without shifting the day', () => {
    const w = mount(ReportDetail, {
      props: { report: caseReport, onClose: () => {}, showCaseFields: true },
    })
    expect(w.find('.report-detail__sla').text()).toContain('8/1/2026')
  })

  // Share behavior (clipboard, announcement, failure) is covered by the chassis's
  // DetailActions.test.ts; here we only assert the control is wired to showCaseFields.
  it('renders DetailActions only in the case view', () => {
    const w = mount(ReportDetail, {
      props: { report: caseReport, onClose: () => {}, showCaseFields: true },
    })
    expect(w.findComponent({ name: 'DetailActions' }).exists()).toBe(true)
  })
})
