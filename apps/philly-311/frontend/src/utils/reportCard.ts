// ABOUTME: Maps a 311 Report to a Pinboard BasicLocation for the finder's map and list;
// ABOUTME: provides the status-icon treatment for report status display.
import type { PinboardTypes } from '@pinboard/ui'
import type { Report } from '@/composables/useNearbyReports'

export type StatusIconTreatment = 'resolved' | 'open'

const RESOLVED_STATUSES = new Set(['Closed', 'Resolved'])

export function statusIconTreatment(
  status: string | undefined | null,
): StatusIconTreatment | null {
  if (!status) return null
  return RESOLVED_STATUSES.has(status) ? 'resolved' : 'open'
}

export function reportToLocation(report: Report): PinboardTypes.BasicLocation {
  return {
    id: report.id,
    name: report.serviceType,
    latitude: report.lat,
    longitude: report.lng,
  }
}
