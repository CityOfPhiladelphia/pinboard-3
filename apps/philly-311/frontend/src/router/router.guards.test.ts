// ABOUTME: Tests for the beforeEach route guard — verifies public routes pass,
// ABOUTME: auth-gated routes allow authenticated users, and redirect unauthenticated ones.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises } from '@vue/test-utils'

const authState = {
  isAuthenticated: ref(false),
  authReady: ref(true),
  signIn: vi.fn(),
}

vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
}))

// Import the guard AFTER mocking so useAuth picks up our mock.
import { authGuard } from './index'

// Local stub route table — /protected stands in for any requiresAuth route.
// The real `routes` are Increment-1 only (no auth-gated paths yet), so we
// build a minimal table here to exercise the guard logic in isolation.
const Stub = defineComponent({ template: '<div />' })
const testRoutes = [
  { path: '/', component: Stub },
  { path: '/protected', component: Stub, meta: { requiresAuth: true } },
]

function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
  router.beforeEach(authGuard)
  return router
}

beforeEach(() => {
  authState.isAuthenticated.value = false
  authState.authReady.value = true
  authState.signIn.mockReset()
  sessionStorage.clear()
})

describe('route guard', () => {
  it('allows navigation to a public route without checking auth', async () => {
    const router = makeRouter()
    await router.push('/')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
    expect(authState.signIn).not.toHaveBeenCalled()
  })

  it('allows navigation to a protected route when authenticated', async () => {
    authState.isAuthenticated.value = true
    const router = makeRouter()
    await router.push('/protected')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/protected')
    expect(authState.signIn).not.toHaveBeenCalled()
  })

  it('blocks navigation and calls signIn when not authenticated', async () => {
    const router = makeRouter()
    await router.push('/protected')
    await flushPromises()

    // Navigation cancelled — router stays at its initial location (/)
    expect(router.currentRoute.value.path).not.toBe('/protected')
    expect(authState.signIn).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('auth:redirectTo')).toBe('/protected')
  })

  it('awaits authReady before deciding, then allows authenticated user', async () => {
    authState.authReady.value = false
    authState.isAuthenticated.value = false

    const router = makeRouter()
    const navigation = router.push('/protected')

    // Flip to ready + authenticated while the guard is waiting
    authState.authReady.value = true
    authState.isAuthenticated.value = true
    await flushPromises()
    await navigation

    expect(router.currentRoute.value.path).toBe('/protected')
    expect(authState.signIn).not.toHaveBeenCalled()
  })
})
