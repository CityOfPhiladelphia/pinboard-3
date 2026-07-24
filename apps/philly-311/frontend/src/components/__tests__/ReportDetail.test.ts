// ABOUTME: Tests for ReportDetail — the inline detail panel rendered in Pinboard's
// ABOUTME: location-detail slot when a report marker is selected.
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { CloseButton } from '@phila/phila-ui-button'
import ReportDetail from '../ReportDetail.vue'
import type { Report } from '@/composables/useNearbyReports'

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
  id: '12345678', lat: 39.95, lng: -75.16, serviceType: 'Pothole', status: 'In Progress',
  address: '1515 Market St', createdAt: '2026-07-01T13:14:00Z',
  description: 'Deep pothole', slaDate: '2026-08-01T00:00:00Z', department: 'Streets',
} as Report

describe('case fields view', () => {
  it('renders nothing case-specific by default (landing finder usage)', () => {
    const w = mount(ReportDetail, { props: { report: caseReport, onClose: () => {} } })
    expect(w.find('.report-detail__fields').exists()).toBe(false)
    expect(w.find('.report-detail__sla').exists()).toBe(false)
    expect(w.find('.report-detail__share').exists()).toBe(false)
  })

  it('shows the fields table when showCaseFields is set', () => {
    const w = mount(ReportDetail, { props: { report: caseReport, onClose: () => {}, showCaseFields: true } })
    const rows = w.findAll('.report-detail__fields tr')
    const text = rows.map((r) => r.text())
    expect(text.some((t) => t.includes('Issue type') && t.includes('Pothole'))).toBe(true)
    expect(text.some((t) => t.includes('Location') && t.includes('1515 Market St'))).toBe(true)
    expect(text.some((t) => t.includes('Submitted'))).toBe(true)
    expect(text.some((t) => t.includes('Request ID') && t.includes('12345678'))).toBe(true)
  })

  it('shows the estimated-update banner only when slaDate is present', () => {
    const w = mount(ReportDetail, { props: { report: caseReport, onClose: () => {}, showCaseFields: true } })
    expect(w.find('.report-detail__sla').text()).toContain('Estimated update')
    const w2 = mount(ReportDetail, {
      props: { report: { ...caseReport, slaDate: undefined }, onClose: () => {}, showCaseFields: true },
    })
    expect(w2.find('.report-detail__sla').exists()).toBe(false)
  })

  it('Share copies the current URL to the clipboard and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const w = mount(ReportDetail, { props: { report: caseReport, onClose: () => {}, showCaseFields: true } })
    await w.find('.report-detail__share').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(w.text()).toContain('Link copied')
    vi.unstubAllGlobals()
  })
})
