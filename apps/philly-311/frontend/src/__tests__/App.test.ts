// ABOUTME: Tests for App — the header's Report-an-issue/Map/My Requests/Answers/
// ABOUTME: login nav links (now all passed through PinboardShell's `links` prop
// ABOUTME: rather than app-provided slots), the sub-footer links, and the phila
// ABOUTME: .content wrapper.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref, computed } from 'vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'

vi.mock('@pinboard/ui', () => ({
  PinboardShell: defineComponent({
    name: 'PinboardShell',
    props: { links: { type: Array, default: undefined } },
    setup(_, { slots }) {
      return () =>
        h('div', [
          h('div', { 'data-test': 'mobile-nav' }, slots['mobile-nav']?.()),
          h('div', { 'data-test': 'sub-footer' }, slots['sub-footer']?.()),
          slots.default?.(),
        ])
    },
  }),
}))

const signIn = vi.fn()
const signOut = vi.fn()
const isAuthenticated = ref(false)
vi.mock('@phila/sso-vue', () => ({
  useAuth: () => ({
    signIn,
    signOut,
    isAuthenticated,
    userName: computed(() => (isAuthenticated.value ? 'Ben Franklin' : null)),
  }),
}))

const accountStatus = ref<'idle' | 'pending' | 'ready' | 'error'>('idle')
const accountError = ref<string | null>(null)
const retryAccountProvisioning = vi.fn()
vi.mock('@/composables/useAccountProvisioning', () => ({
  useAccountProvisioning: () => ({
    status: accountStatus,
    errorMessage: accountError,
    retry: retryAccountProvisioning,
  }),
}))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
}

async function mountApp(initialPath = '/') {
  const router = makeRouter()
  await router.push(initialPath)
  return mount(App, {
    global: {
      plugins: [router],
      stubs: { RouterLink: RouterLinkStub, RouterView: { template: '<div />' } },
    },
  })
}

beforeEach(() => {
  sessionStorage.clear()
  signIn.mockClear()
  signOut.mockClear()
  isAuthenticated.value = false
  accountStatus.value = 'idle'
  accountError.value = null
  retryAccountProvisioning.mockClear()
})

// Shape of the objects App.vue passes as PinboardShell's `links` prop; `icon` is
// omitted from most assertions below since it's a component reference, not data.
type TestNavLink = { text: string; href?: string; selected?: boolean; onClick?: () => void }

describe('App', () => {
  it('passes Report an issue, Map, My Requests, Answers, and Login / Sign up as the header nav links', async () => {
    const w = await mountApp()
    const shell = w.findComponent({ name: 'PinboardShell' })
    const links = shell.props('links') as TestNavLink[]
    expect(links.map(({ text, href }) => ({ text, href }))).toEqual([
      { text: 'Report an issue', href: '/report' },
      { text: 'Map', href: '/' },
      { text: 'My Requests', href: '/reports' },
      { text: 'Answers', href: '/answers' },
      { text: 'Login / Sign up', href: '#' },
    ])
  })

  it('gives the "Report an issue" link a large icon', async () => {
    const w = await mountApp()
    const shell = w.findComponent({ name: 'PinboardShell' })
    const links = shell.props('links') as (TestNavLink & { icon?: unknown; iconSize?: string })[]
    const reportLink = links.find((link) => link.text === 'Report an issue')
    expect(reportLink?.icon).toBeTruthy()
    expect(reportLink?.iconSize).toBe('large')
  })

  it('marks the nav link matching the current route as selected', async () => {
    const w = await mountApp('/answers')
    const shell = w.findComponent({ name: 'PinboardShell' })
    const links = shell.props('links') as TestNavLink[]
    expect(links.find((link) => link.text === 'Answers')?.selected).toBe(true)
    expect(links.find((link) => link.text === 'Map')?.selected).toBe(false)
  })

  it('starts the sso-vue login flow and records the current route as the post-login redirect when Login / Sign up is triggered', async () => {
    const w = await mountApp('/report/location')
    const shell = w.findComponent({ name: 'PinboardShell' })
    const links = shell.props('links') as TestNavLink[]
    links.find((link) => link.text === 'Login / Sign up')?.onClick?.()
    expect(signIn).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('auth:redirectTo')).toBe('/report/location')
  })

  it('does not populate the mobile-nav slot, so no burger menu renders', async () => {
    const w = await mountApp()
    const mobileNav = w.find('[data-test="mobile-nav"]')
    expect(mobileNav.findComponent(RouterLinkStub).exists()).toBe(false)
  })

  it('wraps routed pages in a phila .content region', async () => {
    const w = await mountApp()
    expect(w.find('.content.app-content').exists()).toBe(true)
  })

  it('adds a Feedback link alongside the standard sub-footer legal links', async () => {
    const w = await mountApp()
    const subFooter = w.find('[data-test="sub-footer"]')
    const links = subFooter.findAll('a')
    expect(links.map((a) => a.text())).toEqual([
      'Terms of use',
      'Right to know',
      'Privacy Policy',
      'Accessibility',
      'Feedback',
    ])
    expect(links.map((a) => a.attributes('href'))).toEqual([
      'https://www.phila.gov/terms-of-use/',
      'https://www.phila.gov/open-records-policy/',
      'https://www.phila.gov/privacypolicy/',
      'https://www.phila.gov/accessibility-policy/',
      'https://www.phila.gov/feedback/',
    ])
  })

  it('shows the user name and a Sign out link instead of Login when authenticated', async () => {
    isAuthenticated.value = true
    const w = await mountApp()
    const shell = w.findComponent({ name: 'PinboardShell' })
    const links = shell.props('links') as TestNavLink[]
    expect(links.find((link) => link.text === 'Ben Franklin')).toBeTruthy()
    expect(links.find((link) => link.text === 'Login / Sign up')).toBeFalsy()
    const signOutLink = links.find((link) => link.text === 'Sign out')
    signOutLink?.onClick?.()
    expect(signOut).toHaveBeenCalledOnce()
  })
})

describe('App — account-provisioning gate', () => {
  it('renders the routed page when provisioning is idle', async () => {
    const w = await mountApp()
    expect(w.find('.content.app-content').find('div').exists()).toBe(true)
    expect(w.text()).not.toContain('Logging in')
  })

  it('blocks the routed page and shows a status message while provisioning is pending', async () => {
    accountStatus.value = 'pending'
    const w = await mountApp()
    expect(w.text()).toContain('Logging in')
  })

  it('blocks the routed page and shows a retry action when provisioning fails', async () => {
    accountStatus.value = 'error'
    accountError.value = 'No contact for a@b.com'
    const w = await mountApp()
    expect(w.text()).toContain("Couldn't log you in")
    expect(w.text()).toContain('No contact for a@b.com')
    const retryButton = w.findAll('button').find((b) => b.text() === 'Try again')
    await retryButton?.trigger('click')
    expect(retryAccountProvisioning).toHaveBeenCalledOnce()
  })
})
