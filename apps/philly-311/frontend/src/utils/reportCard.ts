// ABOUTME: Maps a 311 Report to a Pinboard BasicLocation for the finder's map and list;
// ABOUTME: provides the status-icon treatment and status bucketing for report status display.
import type { PinboardTypes } from '@pinboard/ui'
import type { IconComponent } from '@phila/phila-ui-core'
import { IconCircleCheck, IconClock } from '@phila/phila-ui-core/icons'
import type { TagColor } from '@phila/phila-ui-tags'
import type { Report } from '@/composables/useNearbyReports'

export type StatusIconTreatment = 'resolved' | 'open'

export function statusIconTreatment(status: string | undefined | null): StatusIconTreatment | null {
  if (!status) return null
  return statusBucket(status) === 'inProgress' ? 'open' : 'resolved'
}

/** Icon for the status Tag: a check once resolved/closed, a clock while still open. */
export function statusTagIcon(status: string | undefined | null): IconComponent {
  return statusIconTreatment(status) === 'resolved' ? IconCircleCheck : IconClock
}

/** Color for the status Tag, matching statusTagIcon's resolved/open split. */
export function statusTagColor(status: string | undefined | null): TagColor {
  return statusIconTreatment(status) === 'resolved' ? 'green' : 'purple'
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
