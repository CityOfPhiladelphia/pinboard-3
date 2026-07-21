// ABOUTME: Tests for the wizardGuard route guard.
// ABOUTME: Verifies category deep-link seeding, gated redirects, and pass-through behaviour.
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { type RouteLocationNormalized } from 'vue-router'
import { wizardGuard } from '../index'
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
  it('satisfies the deep-step category gate via a category deep link', () => {
    expect(wizardGuard(makeRoute('/report/details', { category: 'Pothole Repair' }))).toBe(true)
  })
  it('does not modify the store on a non-wizard route', () => {
    wizardGuard(makeRoute('/'))
    const store = useReportSubmissionStore()
    expect(store.category).toBeNull()
    expect(store.location).toBeNull()
  })
  it('redirects /report/confirmation to /report when nothing was submitted', () => {
    expect(wizardGuard(makeRoute('/report/confirmation'))).toBe('/report')
  })
  it('allows /report/confirmation after a recorded submission, with no category set', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1', caseNumber: '311-0042' })
    expect(wizardGuard(makeRoute('/report/confirmation'))).toBe(true)
  })
})
