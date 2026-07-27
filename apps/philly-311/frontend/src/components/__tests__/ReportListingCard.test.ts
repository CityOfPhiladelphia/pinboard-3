// ABOUTME: Tests for ReportListingCard — Figma report-listing card fidelity:
// ABOUTME: photo/placeholder, title + status tag, address, timestamp, no distance.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { IconCircleCheck, IconClock } from '@phila/phila-ui-core/icons'
import ReportListingCard from '../ReportListingCard.vue'
import type { Report } from '@/composables/useNearbyReports'

function statusTag(w: ReturnType<typeof mount>) {
  return w.findComponent({ name: 'Tags' })
}

function report(overrides: Partial<Report> = {}): Report {
  return {
    id: 'a1',
    caseNumber: 'a1',
    lat: 39.95,
    lng: -75.16,
    serviceType: 'Pothole Repair',
    status: 'In Progress',
    address: '1234 Market St',
    mediaUrl: 'https://cdn.test/p.jpg',
    createdAt: new Date(2026, 9, 10, 13, 57).toISOString(),
    ...overrides,
  }
}

function mountCard(r: Report = report()) {
  return mount(ReportListingCard, { props: { report: r } })
}

describe('ReportListingCard', () => {
  it('renders the service type title, address, and formatted timestamp', () => {
    const w = mountCard()
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).toContain('1234 Market St')
    expect(w.find('.listing-card__meta').text()).toBe('10/10/26 • 1:57 PM')
  })

  it('shows the photo when mediaUrl is present', () => {
    const w = mountCard()
    expect(w.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')
    expect(w.find('.listing-card__photo--placeholder').exists()).toBe(false)
  })

  it('shows a placeholder block when there is no photo', () => {
    const w = mountCard(report({ mediaUrl: undefined }))
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('.listing-card__photo--placeholder').exists()).toBe(true)
  })

  it('shows a green circle-check tag with the status text for a resolved/closed status', () => {
    const w = mountCard(report({ status: 'Closed' }))
    const tag = statusTag(w)
    expect(tag.props('color')).toBe('green')
    expect(tag.props('icon')).toBe(IconCircleCheck)
    expect(tag.props('text')).toBe('Closed')
  })

  it('also treats Resolved as the green tag', () => {
    expect(statusTag(mountCard(report({ status: 'Resolved' }))).props('color')).toBe('green')
  })

  it('shows a purple clock tag for an open/in-progress status', () => {
    const w = mountCard(report({ status: 'In Progress' }))
    const tag = statusTag(w)
    expect(tag.props('color')).toBe('purple')
    expect(tag.props('icon')).toBe(IconClock)
    expect(tag.props('text')).toBe('In Progress')
  })

  it('also treats New and Open as the purple tag', () => {
    expect(statusTag(mountCard(report({ status: 'New' }))).props('color')).toBe('purple')
    expect(statusTag(mountCard(report({ status: 'Open' }))).props('color')).toBe('purple')
  })

  it('omits the status tag when status is empty', () => {
    const w = mountCard(report({ status: '' }))
    expect(statusTag(w).exists()).toBe(false)
  })

  it('does not render a distance row', () => {
    const w = mountCard()
    expect(w.find('.listing-card__distance').exists()).toBe(false)
    expect(w.text()).not.toContain('mi')
  })

  it('omits the timestamp row when createdAt is missing', () => {
    const w = mountCard(report({ createdAt: undefined }))
    expect(w.find('.listing-card__meta').exists()).toBe(false)
  })
})
