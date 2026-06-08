// ABOUTME: Tests for the wizardGuard route guard.
// ABOUTME: Verifies deep-link seeding, empty-store redirect, and pass-through behaviour.
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
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects to /report when store is empty and navigating to a wizard sub-step', () => {
    const result = wizardGuard(makeRoute('/report/questions'))
    expect(result).toBe('/report')
  })

  it('seeds category from query param and returns true', () => {
    const result = wizardGuard(makeRoute('/report/questions', { category: 'Pothole Repair' }))
    expect(result).toBe(true)
    const store = useReportSubmissionStore()
    expect(store.category).toBe('Pothole Repair')
  })

  it('seeds location from lat/lng query params and returns true', () => {
    const result = wizardGuard(makeRoute('/report/location', { lat: '39.95', lng: '-75.16' }))
    expect(result).toBe(true)
    const store = useReportSubmissionStore()
    expect(store.location).toEqual({ address: '', lat: 39.95, lng: -75.16 })
  })

  it('does not seed location when lat is invalid', () => {
    wizardGuard(makeRoute('/report/location', { lat: 'invalid', lng: '-75.16' }))
    const store = useReportSubmissionStore()
    expect(store.location).toBeNull()
  })

  it('does not seed location when lng is invalid', () => {
    wizardGuard(makeRoute('/report/location', { lat: '39.95', lng: 'invalid' }))
    const store = useReportSubmissionStore()
    expect(store.location).toBeNull()
  })

  it('does not seed location when only lat is present', () => {
    wizardGuard(makeRoute('/report/location', { lat: '39.95' }))
    const store = useReportSubmissionStore()
    expect(store.location).toBeNull()
  })

  it('allows navigation when store is non-empty', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    const result = wizardGuard(makeRoute('/report/details'))
    expect(result).toBe(true)
  })

  it('does not modify the store when navigating to a non-wizard route', () => {
    wizardGuard(makeRoute('/'))
    const store = useReportSubmissionStore()
    expect(store.isEmpty).toBe(true)
  })

  it('allows navigation to /report exactly without checking the store', () => {
    const result = wizardGuard(makeRoute('/report'))
    expect(result).toBe(true)
  })

  it('overwrites the store category when the query carries a different one', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Graffiti Removal')
    store.setQuestion('Color__c', 'Red')
    wizardGuard(makeRoute('/report/questions', { category: 'Pothole Repair' }))
    expect(store.category).toBe('Pothole Repair')
    // Custom fields are tied to the previous category and must reset.
    expect(store.customFields).toEqual({})
  })

  it('leaves the store category alone when the query category matches', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    wizardGuard(makeRoute('/report/questions', { category: 'Pothole Repair' }))
    expect(store.category).toBe('Pothole Repair')
    // No category change → custom fields preserved.
    expect(store.customFields).toEqual({ Severity__c: 'Deep' })
  })

  it('does not overwrite location in store with query params when location already set', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
    wizardGuard(makeRoute('/report/location', { lat: '40.00', lng: '-76.00' }))
    expect(store.location).toEqual({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
  })
})
