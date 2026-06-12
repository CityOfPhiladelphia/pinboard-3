// ABOUTME: Tests for ReportListingCard — Figma .311 Report listing fidelity:
// ABOUTME: photo/placeholder, status tag, icon+title, address, date line, dot, distance.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportListingCard from './ReportListingCard.vue'
import type { Report } from '@/composables/useNearbyReports'

const TagsStub = {
  name: 'Tags',
  props: ['text', 'color'],
  template: '<span class="tag-stub" :data-color="color">{{ text }}</span>',
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
    // 161 m ≈ 0.10006 mi — just over the feet/miles boundary in formatDistance.
    distance: 161,
    mediaUrl: 'https://cdn.test/p.jpg',
    createdAt: new Date(2026, 9, 10, 10, 41).toISOString(),
    ...overrides,
  }
}

function mountCard(r: Report = report()) {
  return mount(ReportListingCard, {
    props: { report: r },
    global: { stubs: { Tags: TagsStub, FontAwesomeIcon: true } },
  })
}

describe('ReportListingCard', () => {
  it('renders type, address, date line, and distance', () => {
    const w = mountCard()
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).toContain('1234 Market St')
    expect(w.text()).toContain('10/10/26 · 10:41 AM')
    expect(w.text()).toContain('0.1 mi')
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

  it('overlays a status tag colored by statusTagColor', () => {
    const w = mountCard()
    const tag = w.find('.tag-stub')
    expect(tag.text()).toBe('In Progress')
    expect(tag.attributes('data-color')).toBe('purple')
  })

  it('renders no status tag when status is empty', () => {
    const w = mountCard(report({ status: '' }))
    expect(w.find('.tag-stub').exists()).toBe(false)
  })

  it('renders the service-color dot', () => {
    const w = mountCard()
    expect(w.find('.listing-card__dot').exists()).toBe(true)
  })

  it('omits date and distance rows when data is missing', () => {
    const w = mountCard(report({ createdAt: undefined, distance: undefined as unknown as number }))
    expect(w.text()).not.toContain('·')
    expect(w.text()).not.toContain('mi')
  })
})
