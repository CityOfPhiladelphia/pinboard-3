// ABOUTME: Tests for App — Answers navbar-end entry and the phila .content
// ABOUTME: wrapper around routed pages.
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('@pinboard/ui', () => ({
  PinboardShell: defineComponent({
    name: 'PinboardShell',
    setup(_, { slots }) {
      return () =>
        h('div', [
          h('div', { 'data-test': 'navbar-end' }, slots['navbar-end']?.()),
          h('div', { 'data-test': 'mobile-nav' }, slots['mobile-nav']?.()),
          slots.default?.(),
        ])
    },
  }),
}))

function mountApp() {
  return mount(App, {
    global: { stubs: { RouterLink: RouterLinkStub, RouterView: { template: '<div />' } } },
  })
}

describe('App', () => {
  it('puts an Answers link in the navbar-end slot', () => {
    const w = mountApp()
    const link = w.find('[data-test="navbar-end"]').findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toBe('/answers')
    expect(link.text()).toBe('Answers')
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
})
