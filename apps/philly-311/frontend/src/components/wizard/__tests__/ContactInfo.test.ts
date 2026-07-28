// ABOUTME: Tests for ContactInfo — unauthenticated empty state, auth prefill-once,
// ABOUTME: field edits updating the store, and no-clobber of user edits.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ContactInfo from '../ContactInfo.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

// Per-test controllable auth state (overrides the global setup mock)
const authState = {
  isAuthenticated: ref(false),
  user: ref<{ name?: string; username?: string } | null>(null),
  userName: computed(() => authState.user.value?.name ?? null),
}

vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
  createB2CPlugin: () => ({ install: () => undefined }),
}))

function inputValue(w: ReturnType<typeof mount>, selector: string): string {
  return (w.find(selector).element as HTMLInputElement).value
}

beforeEach(() => {
  setActivePinia(createPinia())
  authState.isAuthenticated.value = false
  authState.user.value = null
})

describe('ContactInfo', () => {
  it('renders empty fields when unauthenticated and does not touch the store', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('')
    expect(inputValue(w, 'input[autocomplete="tel"]')).toBe('')
    const store = useReportSubmissionStore()
    expect(store.contact.name).toBeUndefined()
    expect(store.contact.email).toBeUndefined()
  })

  it('prefills name and email when authenticated', async () => {
    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    const w = mount(ContactInfo)
    await flushPromises()
    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('Jane')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('jane@phila.gov')
    expect(inputValue(w, 'input[autocomplete="tel"]')).toBe('')
    await flushPromises()
    const store = useReportSubmissionStore()
    expect(store.contact.name).toBe('Jane')
    expect(store.contact.email).toBe('jane@phila.gov')
  })

  it('seeds fields from existing store values and prefill does not overwrite them', async () => {
    const store = useReportSubmissionStore()
    store.setContact({ name: 'Stored Name', email: 'stored@example.com' })
    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    const w = mount(ContactInfo)
    await flushPromises()
    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('Stored Name')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('stored@example.com')
  })

  it('updates store.contact when a field is edited', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    await w.find('input[autocomplete="name"]').setValue('Bob')
    await flushPromises()
    expect(useReportSubmissionStore().contact.name).toBe('Bob')
  })

  it('does not clobber a user-edited field when auth arrives after the edit', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    await w.find('input[autocomplete="name"]').setValue('My Own Name')
    await flushPromises()

    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    await flushPromises()

    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('My Own Name')
    expect(useReportSubmissionStore().contact.name).toBe('My Own Name')
  })

  it('handles sign-out gracefully — no throw, values retained', async () => {
    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    const w = mount(ContactInfo)
    await flushPromises()

    authState.isAuthenticated.value = false
    authState.user.value = null
    await flushPromises()

    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('Jane')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('jane@phila.gov')
  })

  it('clearing a field writes an empty string', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    await w.find('input[autocomplete="name"]').setValue('Bob')
    await w.find('input[autocomplete="name"]').setValue('')
    await flushPromises()
    const store = useReportSubmissionStore()
    expect(store.contact.name).toBe('')
  })
})
