// ABOUTME: Tests for AuthRedirectPage — verifies holding state while authReady
// ABOUTME: is false, then redirects to the stored destination when ready.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

const authState = {
  authReady: ref(false),
}

vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
}))

import AuthRedirectPage from '../AuthRedirectPage.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/auth/redirect', component: AuthRedirectPage },
      { path: '/some/page', component: { template: '<div>Some page</div>' } },
    ],
  })
}

beforeEach(() => {
  authState.authReady.value = false
  sessionStorage.clear()
})

describe('AuthRedirectPage', () => {
  it('shows holding message and does not redirect while authReady is false', async () => {
    const router = makeRouter()
    await router.push('/auth/redirect')
    const wrapper = mount(AuthRedirectPage, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Signing you in')
    expect(router.currentRoute.value.path).toBe('/auth/redirect')
  })

  it('redirects to / when authReady flips and no stored destination', async () => {
    const router = makeRouter()
    await router.push('/auth/redirect')
    mount(AuthRedirectPage, { global: { plugins: [router] } })
    await flushPromises()

    authState.authReady.value = true
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects to the stored destination when authReady flips', async () => {
    sessionStorage.setItem('auth:redirectTo', '/some/page')
    const router = makeRouter()
    await router.push('/auth/redirect')
    mount(AuthRedirectPage, { global: { plugins: [router] } })
    await flushPromises()

    authState.authReady.value = true
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/some/page')
  })

  it('clears the stored destination after redirect', async () => {
    sessionStorage.setItem('auth:redirectTo', '/some/page')
    const router = makeRouter()
    await router.push('/auth/redirect')
    mount(AuthRedirectPage, { global: { plugins: [router] } })
    await flushPromises()

    authState.authReady.value = true
    await flushPromises()

    expect(sessionStorage.getItem('auth:redirectTo')).toBeNull()
  })
})
