// ABOUTME: Tests for App — Map/Reports/Answers header nav links, the "Report an
// ABOUTME: issue" CTA, the login trigger, the sub-footer links, and the phila
// ABOUTME: .content wrapper.
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('@pinboard/ui', () => ({
  PinboardShell: defineComponent({
    name: 'PinboardShell',
    props: { links: { type: Array, default: undefined } },
    setup(_, { slots }) {
      return () =>
        h('div', [
          h('div', { 'data-test': 'navbar-end' }, slots['navbar-end']?.()),
          h('div', { 'data-test': 'mobile-nav' }, slots['mobile-nav']?.()),
          h('div', { 'data-test': 'sub-footer' }, slots['sub-footer']?.()),
          slots.default?.(),
        ])
    },
  }),
}))

const signIn = vi.fn()
vi.mock('@phila/sso-vue', () => ({
  useAuth: () => ({ signIn }),
}))

function mountApp() {
  return mount(App, {
    global: { stubs: { RouterLink: RouterLinkStub, RouterView: { template: '<div />' } } },
  })
}

describe('App', () => {
  it('passes Map/Reports/Answers as the header nav links', () => {
    const w = mountApp()
    const shell = w.findComponent({ name: 'PinboardShell' })
    expect(shell.props('links')).toEqual([
      { text: 'Map', href: '/' },
      { text: 'Reports', href: '/reports' },
      { text: 'Answers', href: '/answers' },
    ])
  })

  it('puts a "Report an issue" button routing to /report in the navbar-end slot', () => {
    const w = mountApp()
    const navbarEnd = w.find('[data-test="navbar-end"]')
    const link = navbarEnd.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/report')
    expect(link.text()).toBe('Report an issue')
  })

  it('puts a Login / Sign up trigger in the navbar-end slot that starts the sso-vue login flow', async () => {
    const w = mountApp()
    const navbarEnd = w.find('[data-test="navbar-end"]')
    const loginButton = navbarEnd.findAll('button').find((b) => b.text() === 'Login / Sign up')
    expect(loginButton).toBeTruthy()
    await loginButton?.trigger('click')
    expect(signIn).toHaveBeenCalledOnce()
  })

  it('does not populate the mobile-nav slot, so no burger menu renders', () => {
    const w = mountApp()
    const mobileNav = w.find('[data-test="mobile-nav"]')
    expect(mobileNav.findComponent(RouterLinkStub).exists()).toBe(false)
  })

  it('wraps routed pages in a phila .content region', () => {
    const w = mountApp()
    expect(w.find('.content.app-content').exists()).toBe(true)
  })

  it('adds a Feedback link alongside the standard sub-footer legal links', () => {
    const w = mountApp()
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
})
