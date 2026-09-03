// ABOUTME: Builds the "Next Steps" progress-timeline scaffold for a report. No API
// ABOUTME: yet returns real step/milestone data (see 311-mobile-app's StepProgressView,
// ABOUTME: which hardcodes the same shape) — this generic scaffold is a stand-in until one does.
import { statusBucket } from './useReportStatus'
import type { Issue } from '@/types/api'

export interface ReportStep {
  title: string
  subtitle?: string
}

export interface ReportStepSection {
  title: string
  steps: ReportStep[]
}

export interface ReportSteps {
  sections: ReportStepSection[]
  /** 0-based index of the current step, counting across all sections in order. */
  currentStep: number
}

const GENERIC_DEPARTMENT = 'the responsible department'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function useReportSteps(report: Issue): ReportSteps {
  const department = report.department ?? GENERIC_DEPARTMENT
  const departmentTitle = report.department ?? 'Servicing department'

  const sections: ReportStepSection[] = [
    {
      title: 'Philly311',
      steps: [
        { title: 'Submitted and received by 311' },
        {
          title: 'Reviewed by 311',
          subtitle: `311 has forwarded your request to ${department}.`,
        },
      ],
    },
    {
      title: departmentTitle,
      steps: [
        {
          title: 'Reviewed by servicing department',
          subtitle: `${capitalize(department)} will investigate and address the request.`,
        },
        { title: 'Request closed' },
      ],
    },
  ]

  const currentStep = statusBucket(report.status) === 'closed' ? 3 : 1

  return { sections, currentStep }
}
