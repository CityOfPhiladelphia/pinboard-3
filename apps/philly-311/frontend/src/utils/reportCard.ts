// ABOUTME: Maps a 311 Report to a Pinboard BasicLocation for the finder's map and list;
// ABOUTME: provides tag-color utilities for report status display.
import type { PinboardTypes } from '@pinboard/ui'
import type { TagColor } from '@phila/phila-ui-tags'
import type { Report } from '@/composables/useNearbyReports'

const STATUS_COLORS: Record<string, TagColor> = {
  New: 'blue',
  Open: 'blue',
  'In Progress': 'purple',
  Closed: 'green',
  Resolved: 'green',
}

export function statusTagColor(status: string | undefined | null): TagColor {
  if (!status) return 'grey'
  return STATUS_COLORS[status] ?? 'grey'
}

export function reportToLocation(report: Report): PinboardTypes.BasicLocation {
  return {
    id: report.id,
    name: report.serviceType,
    latitude: report.lat,
    longitude: report.lng,
  }
}
