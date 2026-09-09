// ABOUTME: Tests for the anonymousActivity store — upvoted/submitted id persistence
// ABOUTME: to localStorage, hydration on store creation, idempotency, corrupt-storage
// ABOUTME: tolerance, and that the two id sets are tracked independently.
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnonymousActivityStore } from '../anonymousActivity'

describe('useAnonymousActivityStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const store = useAnonymousActivityStore()
    expect(store.upvotedIds).toEqual([])
    expect(store.submittedIds).toEqual([])
  })

  it('markUpvoted records and persists the id, and isUpvoted reflects it', () => {
    const store = useAnonymousActivityStore()
    expect(store.isUpvoted('25012345')).toBe(false)
    store.markUpvoted('25012345')
    expect(store.isUpvoted('25012345')).toBe(true)
    expect(JSON.parse(localStorage.getItem('philly311:anonymousUpvotedIds') ?? '[]')).toEqual([
      '25012345',
    ])
  })

  it('markUpvoted is idempotent — marking the same id twice does not duplicate it', () => {
    const store = useAnonymousActivityStore()
    store.markUpvoted('25012345')
    store.markUpvoted('25012345')
    expect(store.upvotedIds).toEqual(['25012345'])
  })

  it('markSubmitted records and persists the id, and isSubmitted reflects it, independently of upvotes', () => {
    const store = useAnonymousActivityStore()
    store.markSubmitted('25012345')
    expect(store.isSubmitted('25012345')).toBe(true)
    expect(store.isUpvoted('25012345')).toBe(false)
    expect(JSON.parse(localStorage.getItem('philly311:anonymousSubmittedIds') ?? '[]')).toEqual([
      '25012345',
    ])
  })

  it('hydrates both id sets from localStorage in a fresh pinia', () => {
    const store = useAnonymousActivityStore()
    store.markUpvoted('25012345')
    store.markSubmitted('87654321')
    setActivePinia(createPinia())
    const fresh = useAnonymousActivityStore()
    expect(fresh.isUpvoted('25012345')).toBe(true)
    expect(fresh.isSubmitted('87654321')).toBe(true)
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem('philly311:anonymousUpvotedIds', 'not json')
    localStorage.setItem('philly311:anonymousSubmittedIds', '{}')
    const store = useAnonymousActivityStore()
    expect(store.upvotedIds).toEqual([])
    expect(store.submittedIds).toEqual([])
  })
})
