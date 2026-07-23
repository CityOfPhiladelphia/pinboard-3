// ABOUTME: Tests for the myCases store — draft persistence to localStorage,
// ABOUTME: hydration on store creation, deletion, corrupt-storage tolerance.
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyCasesStore } from '../myCases'

const draftInput = {
  category: 'Illegal Dumping',
  customFields: { Q1: 'Yes' },
  location: null,
  description: 'Trash on the corner',
  contact: {},
  publicVisibility: false,
}

describe('useMyCasesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    expect(useMyCasesStore().drafts).toEqual([])
  })

  it('saveDraft assigns id/savedAt, prepends, and persists', () => {
    const store = useMyCasesStore()
    const saved = store.saveDraft(draftInput)
    expect(saved.id).toBeTruthy()
    expect(saved.savedAt).toBeTruthy()
    expect(store.drafts[0]).toEqual(saved)
    const raw = JSON.parse(localStorage.getItem('philly311:drafts') ?? '[]')
    expect(raw).toHaveLength(1)
    expect(raw[0].category).toBe('Illegal Dumping')
  })

  it('hydrates drafts from localStorage in a fresh pinia', () => {
    useMyCasesStore().saveDraft(draftInput)
    setActivePinia(createPinia())
    expect(useMyCasesStore().drafts).toHaveLength(1)
  })

  it('deleteDraft removes and persists', () => {
    const store = useMyCasesStore()
    const saved = store.saveDraft(draftInput)
    store.deleteDraft(saved.id)
    expect(store.drafts).toEqual([])
    expect(JSON.parse(localStorage.getItem('philly311:drafts') ?? 'null')).toEqual([])
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem('philly311:drafts', 'not json')
    expect(useMyCasesStore().drafts).toEqual([])
  })

  it('tolerates valid JSON that is not an array', () => {
    localStorage.setItem('philly311:drafts', '{}')
    const store = useMyCasesStore()
    expect(store.drafts).toEqual([])
    const saved = store.saveDraft(draftInput)
    expect(store.drafts).toEqual([saved])
  })
})
