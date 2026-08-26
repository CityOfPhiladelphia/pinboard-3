// ABOUTME: Tests for ReportListingCard — the thin adapter from Report data + status
// ABOUTME: bucketing onto @phila/phila-ui-cards' Report311 props/#placeholder slot.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  IconCircleCheck,
  IconClock,
  IconCircleExclamation,
  IconPersonDigging,
} from '@phila/phila-ui-core/icons'
import ReportListingCard from '../ReportListingCard.vue'
import type { Report } from '@/composables/useNearbyReports'

function report311(w: ReturnType<typeof mount>) {
  return w.findComponent({ name: 'Report311' })
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
  it('maps serviceType/address/timestamp onto Report311 label/description/timestamp', () => {
    const w = mountCard()
    const card = report311(w)
    expect(card.props('label')).toBe('Pothole Repair')
    expect(card.props('description')).toBe('1234 Market St')
    expect(card.props('timestamp')).toBe('10/10/26 • 1:57 PM')
  })

  it('passes mediaUrl through as src/alt', () => {
    const w = mountCard()
    expect(report311(w).props('src')).toBe('https://cdn.test/p.jpg')
    expect(report311(w).props('alt')).toBe('Pothole Repair')
  })

  it('supplies a service-type icon placeholder when there is no photo', () => {
    const w = mountCard(report({ mediaUrl: undefined }))
    expect(w.find('img').exists()).toBe(false)
    const placeholder = w.find('.listing-card__placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.findComponent({ name: 'Icon' }).props('icon')).toBe(IconPersonDigging)
  })

  it('builds a green check-circle status object for Closed', () => {
    const status = report311(mountCard(report({ status: 'Closed' }))).props('status')
    expect(status).toMatchObject({ color: 'green', icon: IconCircleCheck, text: 'Closed' })
  })

  it('builds a yellow circle-exclamation status object for On Hold', () => {
    const status = report311(mountCard(report({ status: 'On Hold' }))).props('status')
    expect(status).toMatchObject({ color: 'yellow', icon: IconCircleExclamation, text: 'On Hold' })
  })

  it('builds an open/in-progress status object with a purple style override', () => {
    const status = report311(mountCard(report({ status: 'In Progress' }))).props('status')
    expect(status).toMatchObject({ icon: IconClock, text: 'In Progress' })
    expect(status.style.color).toContain('4a00c9')
  })

  it('omits the status object entirely when status is empty', () => {
    const status = report311(mountCard(report({ status: '' }))).props('status')
    expect(status).toBeUndefined()
  })
})
