// ABOUTME: Maps a 311 Report to a Pinboard BasicLocation for the finder's map and list.
// ABOUTME: Status display lives in composables/useReportStatus.ts.
import type { PinboardTypes } from '@pinboard/ui'
import type { Report } from '@/composables/useNearbyReports'

export function reportToLocation(report: Report): PinboardTypes.BasicLocation {
  return {
    id: report.id,
    name: report.serviceType,
    latitude: report.lat,
    longitude: report.lng,
  }
}
