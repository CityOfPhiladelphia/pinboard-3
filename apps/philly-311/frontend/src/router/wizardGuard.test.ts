// ABOUTME: Tests for the wizardGuard route guard.
// ABOUTME: Verifies deep-link seeding, category-gated redirects, and pass-through behaviour.
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { type RouteLocationNormalized } from 'vue-router'
import { wizardGuard } from './index'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

function makeRoute(path: string, query: Record<string, string> = {}): RouteLocationNormalized {
  return {
    path,
    query,
    fullPath: path,
    hash: '',
    name: undefined,
    params: {},
    matched: [],
    meta: {},
    redirectedFrom: undefined,
  } as unknown as RouteLocationNormalized
}

describe('wizardGuard', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('allows /report exactly without checking the store', () => {
    expect(wizardGuard(makeRoute('/report'))).toBe(true)
  })
  it('allows /report/issue-type even when the store is empty', () => {
    expect(wizardGuard(makeRoute('/report/issue-type'))).toBe(true)
  })
  it('redirects deep steps to /report when no category is chosen', () => {
    expect(wizardGuard(makeRoute('/report/location'))).toBe('/report')
    expect(wizardGuard(makeRoute('/report/details'))).toBe('/report')
    expect(wizardGuard(makeRoute('/report/review'))).toBe('/report')
  })
  it('allows deep steps once a category is set', () => {
    useReportSubmissionStore().setCategory('Pothole Repair')
    expect(wizardGuard(makeRoute('/report/location'))).toBe(true)
  })
  it('seeds category from a query param and allows', () => {
    const result = wizardGuard(makeRoute('/report/issue-type', { category: 'Pothole Repair' }))
    expect(result).toBe(true)
    expect(useReportSubmissionStore().category).toBe('Pothole Repair')
  })
  it('overwrites a different query category and clears custom fields', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Graffiti Removal')
    store.setQuestion('Color__c', 'Red')
    wizardGuard(makeRoute('/report/issue-type', { category: 'Pothole Repair' }))
    expect(store.category).toBe('Pothole Repair')
    expect(store.customFields).toEqual({})
  })
  it('preserves custom fields when the query category matches', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    wizardGuard(makeRoute('/report/issue-type', { category: 'Pothole Repair' }))
    expect(store.customFields).toEqual({ Severity__c: 'Deep' })
  })
  it('seeds location from lat/lng (with a category present) and allows', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    const result = wizardGuard(makeRoute('/report/location', { lat: '39.95', lng: '-75.16' }))
    expect(result).toBe(true)
    expect(store.location).toEqual({ address: '', lat: 39.95, lng: -75.16 })
  })
  it('does not seed location when lat/lng are invalid or partial', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    wizardGuard(makeRoute('/report/location', { lat: 'x', lng: '-75.16' }))
    wizardGuard(makeRoute('/report/location', { lat: '39.95' }))
    wizardGuard(makeRoute('/report/location', { lat: '39.95', lng: 'x' }))
    expect(store.location).toBeNull()
  })
  it('does not overwrite an existing location with query params', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
    wizardGuard(makeRoute('/report/location', { lat: '40.0', lng: '-76.0' }))
    expect(store.location).toEqual({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
  })
  it('does not modify the store on a non-wizard route', () => {
    wizardGuard(makeRoute('/'))
    expect(useReportSubmissionStore().isEmpty).toBe(true)
  })
})
