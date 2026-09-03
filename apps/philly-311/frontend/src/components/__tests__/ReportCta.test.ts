// ABOUTME: Tests for ReportCta — the floating "Report an issue" CTA that overlays
// ABOUTME: the bottom of the landing page's locations panel.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportCta from '../ReportCta.vue'

const RouterLinkStub = {
  template: '<a :href="String(to)"><slot /></a>',
  props: ['to'],
}

describe('ReportCta', () => {
  it('renders a "Report an issue" link to /report', () => {
    const w = mount(ReportCta, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const cta = w.find('a[href="/report"]')
    expect(cta.exists()).toBe(true)
    expect(cta.text()).toContain('Report an issue')
  })
})
