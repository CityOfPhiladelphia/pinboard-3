// ABOUTME: Maps a 311 Report to a Pinboard BasicLocation for the finder's map and list;
// ABOUTME: provides the status-icon treatment and status bucketing for report status display.
import type { PinboardTypes } from '@pinboard/ui'
import type { Report } from '@/composables/useNearbyReports'

export type StatusIconTreatment = 'resolved' | 'open'

export function statusIconTreatment(status: string | undefined | null): StatusIconTreatment | null {
  if (!status) return null
  return statusBucket(status) === 'inProgress' ? 'open' : 'resolved'
}

export type StatusBucket = 'resolved' | 'closed' | 'inProgress'

export function statusBucket(status: string | undefined | null): StatusBucket {
  if (status === 'Resolved') return 'resolved'
  if (status === 'Closed') return 'closed'
  return 'inProgress'
}

export function reportToLocation(report: Report): PinboardTypes.BasicLocation {
  return {
    id: report.id,
    name: report.serviceType,
    latitude: report.lat,
    longitude: report.lng,
  }
}
