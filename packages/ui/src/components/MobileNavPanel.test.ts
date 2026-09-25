// ABOUTME: Tests for MobileNavPanel — the mobile-nav flyout's content wrapper, rendered
// ABOUTME: inside NavbarBurger's own absolutely-positioned flyout chrome.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileNavPanel from './MobileNavPanel.vue'

describe('MobileNavPanel', () => {
  it('renders the default slot content', () => {
    const w = mount(MobileNavPanel, {
      slots: { default: '<a href="/report">Report an issue</a>' },
    })
    expect(w.find('a[href="/report"]').exists()).toBe(true)
  })

  it('does not carry the "nav-flyout" class', () => {
    // That class belongs to NavbarBurger's own wrapper (already absolutely
    // positioned, with a scrolling max-height) — duplicating it here makes
    // this root position: absolute too, so it drops out of that wrapper's
    // normal flow; with nothing left contributing to its height, the
    // wrapper's auto height collapses to 0 and the whole flyout renders
    // invisible despite being otherwise correctly positioned and z-indexed.
    const w = mount(MobileNavPanel)
    expect(w.classes()).not.toContain('nav-flyout')
  })
})
