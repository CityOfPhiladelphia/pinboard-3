// ABOUTME: Tests for PinboardShell — verifies the `links` prop reaches AppHeader's
// ABOUTME: real nav-link rendering (desktop row + the mobile burger's flyout copy).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useVisibility } from '@phila/phila-ui-core'
import PinboardShell from './PinboardShell.vue'

function mountShell(extra: Record<string, unknown> = {}) {
  return mount(PinboardShell, {
    props: { title: 'Test App', translations: false, showHeaderTooltip: false, ...extra },
  })
}

// The mobile-nav flyout's open/closed state lives in @phila/phila-ui-core's
// shared, module-level useVisibility registry (keyed by id/group, matching
// PinboardShell's own HEADER_ID) rather than per-component state — it
// survives across mounts within a test run, so tests that care about its
// open/closed state reset it first rather than assume a starting value.
beforeEach(() => {
  useVisibility({ id: 'mobile-nav-pinboard-nav', group: 'pinboard-nav' }).setState(
    'mobile-nav-pinboard-nav',
    false
  )
})

describe('PinboardShell', () => {
  it('renders links passed to it as header nav links', () => {
    const w = mountShell({
      links: [
        { text: 'Map', href: '/' },
        { text: 'Reports', href: '/reports' },
        { text: 'Answers', href: '/answers' },
      ],
    })
    // Two copies exist once links are provided — the desktop row and the
    // mobile flyout's own copy (see the burger tests below). The desktop row
    // is a direct child of .phila-navbar; the flyout copy is nested several
    // levels deeper inside the burger's own flyout markup, so a direct-child
    // selector scopes to the desktop row only.
    const desktopLinks = w.findAll('.phila-navbar > .phila-navbar-list a.phila-navbar-link')
    expect(desktopLinks.map((a) => a.text())).toEqual(['Map', 'Reports', 'Answers'])
    expect(desktopLinks.map((a) => a.attributes('href'))).toEqual(['/', '/reports', '/answers'])
  })

  it('renders no header nav links when links is omitted', () => {
    const w = mountShell()
    expect(w.findAll('a.phila-navbar-link')).toHaveLength(0)
  })

  it('shows the mobile burger, with the same links in its flyout, once links are provided', () => {
    const w = mountShell({
      links: [
        { text: 'Map', href: '/' },
        { text: 'Reports', href: '/reports' },
      ],
    })
    w.get('.phila-navbar-burger') // throws if missing — asserts the burger itself renders too
    const flyout = w.get('.phila-mobile-nav')
    const flyoutLinks = flyout.findAll('a.phila-navbar-link')
    expect(flyoutLinks.map((a) => a.text())).toEqual(['Map', 'Reports'])
    // Sanity check they're actually two distinct copies, not one link node
    // matched twice by an over-broad selector.
    expect(w.findAll('a.phila-navbar-link')).toHaveLength(4)
  })

  it('shows no burger when links is omitted and no custom mobile-nav content is given', () => {
    const w = mountShell()
    expect(w.find('.phila-navbar-burger').exists()).toBe(false)
  })

  it('prefers a caller-provided mobile-nav slot over the links fallback', () => {
    const w = mount(PinboardShell, {
      props: { title: 'Test App', translations: false, showHeaderTooltip: false },
      slots: { 'mobile-nav': '<a href="/custom">Custom link</a>' },
    })
    expect(w.get('.phila-navbar-burger')).toBeTruthy()
    const flyout = w.get('.phila-mobile-nav')
    expect(flyout.find('a[href="/custom"]').exists()).toBe(true)
    expect(flyout.find('a.phila-navbar-link').exists()).toBe(false)
  })

  it('closes the mobile-nav flyout when a link inside it is clicked', async () => {
    const w = mountShell({ links: [{ text: 'Map', href: '/' }] })
    await w.get('.phila-navbar-burger').trigger('click')
    expect(w.get('.phila-mobile-nav').element.hasAttribute('hidden')).toBe(false)

    await w.get('.phila-mobile-nav a.phila-navbar-link').trigger('click')
    expect(w.get('.phila-mobile-nav').element.hasAttribute('hidden')).toBe(true)
  })

  it('closes the mobile-nav flyout on any click inside caller-provided content too', async () => {
    const w = mount(PinboardShell, {
      props: { title: 'Test App', translations: false, showHeaderTooltip: false },
      slots: { 'mobile-nav': '<a href="/custom">Custom link</a>' },
    })
    await w.get('.phila-navbar-burger').trigger('click')
    expect(w.get('.phila-mobile-nav').element.hasAttribute('hidden')).toBe(false)

    await w.get('.phila-mobile-nav a[href="/custom"]').trigger('click')
    expect(w.get('.phila-mobile-nav').element.hasAttribute('hidden')).toBe(true)
  })
})
