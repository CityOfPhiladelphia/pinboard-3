// ABOUTME: Maps a 311 Report to a Pinboard BasicLocation for the finder's map and list.
// ABOUTME: Status display lives in composables/useReportStatus.ts.
import type { ReportLocation } from '@/types/app'
import type { Report } from '@/types/api'

export function reportToLocation(report: Report): ReportLocation {
  return {
    name: report.serviceType,
    caseNumber: report.id,
    latitude: report.lat,
    longitude: report.lng,
    ...report,
    distance: undefined,
  }
}
