// ABOUTME: Tests for ReportConfirmationPage — reference number from store.submitted
// ABOUTME: and the report-another / finder links.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import ReportConfirmationPage from './ReportConfirmationPage.vue'

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
  it('announces success and shows the case number in a status region', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1', caseNumber: '311-0042' })
    const w = mountPage()
    const status = w.find('[role="status"]')
    expect(status.text()).toContain('your report was submitted')
    expect(status.text()).toContain('311-0042')
  })

  it('falls back to the id when there is no caseNumber', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1' })
    expect(mountPage().find('[role="status"]').text()).toContain('a1')
  })

  it('links to a new report and to the finder', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1' })
    const hrefs = mountPage()
      .findAll('a.router-link-stub')
      .map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/report', '/'])
  })
})
