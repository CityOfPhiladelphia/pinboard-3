// ABOUTME: Tests for useReportSteps — builds the generic "Next Steps" section/step
// ABOUTME: scaffold and derives which step is current from the report's status.
import { describe, it, expect } from 'vitest'
import { useReportSteps } from '../useReportSteps'
import type { Issue } from '@/types/api'

const baseIssue: Issue = {
  id: '12345678',
  serviceType: 'Illegal Dumping',
  department: 'Streets',
  status: 'In Progress',
}

describe('useReportSteps', () => {
  it('builds a Philly311 section with the submitted and reviewed steps', () => {
    const { sections } = useReportSteps(baseIssue)
    const philly311 = sections[0]
    expect(philly311.title).toBe('Philly311')
    expect(philly311.steps.map((s) => s.title)).toEqual([
      'Submitted and received by 311',
      'Reviewed by 311',
    ])
    expect(philly311.steps[1].subtitle).toBe('311 has forwarded your request to Streets.')
  })

  it('builds a servicing-department section named after the report department', () => {
    const { sections } = useReportSteps(baseIssue)
    const department = sections[1]
    expect(department.title).toBe('Streets')
    expect(department.steps.map((s) => s.title)).toEqual([
      'Reviewed by servicing department',
      'Request closed',
    ])
    expect(department.steps[0].subtitle).toBe('Streets will investigate and address the request.')
  })

  it('falls back to a generic department name and subtitle when department is missing', () => {
    const { sections } = useReportSteps({ ...baseIssue, department: undefined })
    expect(sections[0].steps[1].subtitle).toBe(
      '311 has forwarded your request to the responsible department.',
    )
    expect(sections[1].title).toBe('Servicing department')
    expect(sections[1].steps[0].subtitle).toBe(
      'The responsible department will investigate and address the request.',
    )
  })

  it('is on the "Reviewed by 311" step while the report is open', () => {
    const { currentStep } = useReportSteps({ ...baseIssue, status: 'New' })
    expect(currentStep).toBe(1)
  })

  it('is on the "Reviewed by 311" step while the report is on hold', () => {
    const { currentStep } = useReportSteps({ ...baseIssue, status: 'On Hold' })
    expect(currentStep).toBe(1)
  })

  it('is on the last step once the report is closed', () => {
    const { currentStep } = useReportSteps({ ...baseIssue, status: 'Closed' })
    expect(currentStep).toBe(3)
  })

  it('defaults to the "Reviewed by 311" step when status is missing', () => {
    const { currentStep } = useReportSteps({ ...baseIssue, status: undefined })
    expect(currentStep).toBe(1)
  })
})
