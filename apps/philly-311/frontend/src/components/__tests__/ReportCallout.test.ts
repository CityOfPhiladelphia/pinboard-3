import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ReportCallout from '../ReportCallout.vue'

describe('ReportCallout', () => {
  it('renders the heading and a CTA linking to /report', () => {
    const w = mount(ReportCallout, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.text()).toContain('Submit a report to 311')
    const cta = w.findComponent(RouterLinkStub)
    expect(cta.props('to')).toBe('/report')
    expect(cta.text()).toContain('Submit request')
  })

  it('renders the intro copy with an About Philly311 link opening in a new tab', () => {
    const w = mount(ReportCallout, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.text()).toContain(
      "Let us know if there's a non-emergency issue that needs attention. The Philly311 team will direct your report to the right department.",
    )
    const link = w.find('a.report-callout__about-link')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('About Philly311.')
    expect(link.attributes('href')).toBe('https://www.phila.gov/departments/philly311/')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
  })

  it('renders the decorative document illustration hidden from assistive tech', () => {
    const w = mount(ReportCallout, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const icon = w.find('img.report-callout__cta-icon')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('alt')).toBe('')
    expect(icon.attributes('aria-hidden')).toBe('true')
  })
})
