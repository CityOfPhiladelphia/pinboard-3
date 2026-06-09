import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ReportCallout from './ReportCallout.vue'

describe('ReportCallout', () => {
  it('renders the heading and a CTA linking to /report', () => {
    const w = mount(ReportCallout, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.text()).toContain('Report Issues Around You')
    const cta = w.findComponent(RouterLinkStub)
    expect(cta.props('to')).toBe('/report')
    expect(cta.text()).toContain('Report an Issue')
  })
})
