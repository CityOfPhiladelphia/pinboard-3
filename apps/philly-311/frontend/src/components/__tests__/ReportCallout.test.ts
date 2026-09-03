import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportCallout from '../ReportCallout.vue'

const RouterLinkStub = {
  template: '<a :href="String(to)"><slot /></a>',
  props: ['to'],
}

function mountCallout() {
  return mount(ReportCallout, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('ReportCallout', () => {
  it('renders the heading', () => {
    const w = mountCallout()
    expect(w.text()).toContain('Submit a report to 311')
  })

  it('renders the intro copy with an About Philly311 link opening in a new tab', () => {
    const w = mountCallout()
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
})
