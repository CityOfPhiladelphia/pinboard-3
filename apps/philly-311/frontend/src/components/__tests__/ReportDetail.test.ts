// ABOUTME: Tests for ReportDetail — the inline detail panel rendered in Pinboard's
// ABOUTME: location-detail slot when a report marker is selected.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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
