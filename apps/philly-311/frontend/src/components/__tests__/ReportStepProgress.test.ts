// ABOUTME: Tests for ReportStepProgress — the grouped vertical step tracker used by
// ABOUTME: the "Next Steps" section of ReportDetailContent.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportStepProgress from '../ReportStepProgress.vue'
import type { ReportStepSection } from '@/composables/useReportSteps'

const sections: ReportStepSection[] = [
  {
    title: 'Philly311',
    steps: [
      { title: 'Submitted and received by 311' },
      { title: 'Reviewed by 311', subtitle: '311 has forwarded your request to Streets.' },
    ],
  },
  {
    title: 'Streets',
    steps: [
      {
        title: 'Reviewed by servicing department',
        subtitle: 'Streets will investigate and address the request.',
      },
      { title: 'Request closed' },
    ],
  },
]

describe('ReportStepProgress', () => {
  it('renders every section heading and step title/subtitle', () => {
    const w = mount(ReportStepProgress, { props: { sections, currentStep: 1 } })
    expect(w.text()).toContain('Philly311')
    expect(w.text()).toContain('Streets')
    expect(w.text()).toContain('Submitted and received by 311')
    expect(w.text()).toContain('Reviewed by 311')
    expect(w.text()).toContain('311 has forwarded your request to Streets.')
    expect(w.text()).toContain('Reviewed by servicing department')
    expect(w.text()).toContain('Request closed')
  })

  it('marks steps before currentStep as complete', () => {
    const w = mount(ReportStepProgress, { props: { sections, currentStep: 1 } })
    const circles = w.findAll('.report-step-progress__circle')
    expect(circles[0].classes()).toContain('report-step-progress__circle--complete')
  })

  it('marks the currentStep as active', () => {
    const w = mount(ReportStepProgress, { props: { sections, currentStep: 1 } })
    const circles = w.findAll('.report-step-progress__circle')
    expect(circles[1].classes()).toContain('report-step-progress__circle--active')
  })

  it('marks steps after currentStep as upcoming', () => {
    const w = mount(ReportStepProgress, { props: { sections, currentStep: 1 } })
    const circles = w.findAll('.report-step-progress__circle')
    expect(circles[2].classes()).toContain('report-step-progress__circle--upcoming')
    expect(circles[3].classes()).toContain('report-step-progress__circle--upcoming')
  })

  it('treats step index as continuous across section boundaries', () => {
    const w = mount(ReportStepProgress, { props: { sections, currentStep: 3 } })
    const circles = w.findAll('.report-step-progress__circle')
    expect(circles[0].classes()).toContain('report-step-progress__circle--complete')
    expect(circles[1].classes()).toContain('report-step-progress__circle--complete')
    expect(circles[2].classes()).toContain('report-step-progress__circle--complete')
    expect(circles[3].classes()).toContain('report-step-progress__circle--active')
  })
})
