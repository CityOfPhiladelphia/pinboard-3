// ABOUTME: Tests for ReportConfirmationPage — the success banner, the submitted
// ABOUTME: report detail, and the report-another / finder links.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import ReportConfirmationPage from '../ReportConfirmationPage.vue'

// The chassis index pulls phila dist CSS vitest can't load; stub DetailActions.
// Share behavior itself is covered by the chassis's DetailActions.test.ts.
vi.mock('@pinboard/ui', () => ({
  DetailActions: defineComponent({
    name: 'DetailActions',
    setup() {
      return () => h('div')
    },
  }),
}))

const RouterLinkStub = {
  template: '<a :href="String(to)" class="router-link-stub"><slot /></a>',
  props: ['to'],
}

function mountPage() {
  return mount(ReportConfirmationPage, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

beforeEach(() => setActivePinia(createPinia()))

describe('ReportConfirmationPage', () => {
  it('announces success in a status region', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1', caseNumber: '311-0042' })
    const w = mountPage()
    const status = w.find('[role="status"]')
    expect(status.text()).toContain('Success!')
    expect(status.text()).toContain('Your report was submitted')
  })

  it('renders the submitted report, including its request id, via ReportDetailContent', () => {
    useReportSubmissionStore().recordSubmission({
      id: 'a1',
      caseNumber: '311-0042',
      serviceType: 'Pothole Repair',
      address: '1234 Market St',
    })
    const w = mountPage()
    expect(w.find('.confirmation__detail').text()).toContain('Pothole Repair')
    expect(w.find('.confirmation__detail').text()).toContain('1234 Market St')
    expect(w.find('.confirmation__detail').text()).toContain('311-0042')
  })

  it('renders without a detail panel when nothing was submitted', () => {
    const w = mountPage()
    expect(w.find('.confirmation__detail').exists()).toBe(false)
  })

  it('links to a new report and to the finder', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1' })
    const hrefs = mountPage()
      .findAll('a')
      .map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/report', '/'])
  })

  it('moves focus to the heading on mount', async () => {
    const w = mount(ReportConfirmationPage, {
      attachTo: document.body,
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    await flushPromises()
    const h1 = w.find('h1')
    expect(h1.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(h1.element)
    w.unmount()
  })
})
