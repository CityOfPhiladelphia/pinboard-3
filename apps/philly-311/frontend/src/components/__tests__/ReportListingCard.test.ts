// ABOUTME: Tests for ReportListingCard — Figma report-listing card fidelity:
// ABOUTME: photo/placeholder, title + status icon chip, address, timestamp, no distance.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleCheck, faClock } from '@fortawesome/pro-solid-svg-icons'
import ReportListingCard from '../ReportListingCard.vue'
import type { Report } from '@/composables/useNearbyReports'

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

  it('shows a green circle-check chip for a resolved/closed status, labeled for screen readers', () => {
    const w = mountCard(report({ status: 'Closed' }))
    const chip = w.find('.listing-card__status-icon')
    expect(chip.classes()).toContain('listing-card__status-icon--resolved')
    expect(chip.attributes('aria-label')).toBe('Closed')
    expect(w.findComponent(FontAwesomeIcon).props('icon')).toBe(faCircleCheck)
  })

  it('also treats Resolved as the resolved/green chip', () => {
    const w = mountCard(report({ status: 'Resolved' }))
    expect(w.find('.listing-card__status-icon').classes()).toContain(
      'listing-card__status-icon--resolved',
    )
  })

  it('shows a purple clock chip for an open/in-progress status, labeled for screen readers', () => {
    const w = mountCard(report({ status: 'In Progress' }))
    const chip = w.find('.listing-card__status-icon')
    expect(chip.classes()).toContain('listing-card__status-icon--open')
    expect(chip.attributes('aria-label')).toBe('In Progress')
    expect(w.findComponent(FontAwesomeIcon).props('icon')).toBe(faClock)
  })

  it('also treats New and Open as the open/purple chip', () => {
    expect(
      mountCard(report({ status: 'New' })).find('.listing-card__status-icon').classes(),
    ).toContain('listing-card__status-icon--open')
    expect(
      mountCard(report({ status: 'Open' })).find('.listing-card__status-icon').classes(),
    ).toContain('listing-card__status-icon--open')
  })

  it('omits the status chip when status is empty', () => {
    const w = mountCard(report({ status: '' }))
    expect(w.find('.listing-card__status-icon').exists()).toBe(false)
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
