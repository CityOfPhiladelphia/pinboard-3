// ABOUTME: Map a 311 Report to a Pinboard BasicLocation whose card (MapCardProps) drives
// ABOUTME: the left-panel list row: service type, address, status + distance tags.
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { TagsProps } from '@phila/phila-ui-tags'
import type { PinboardTypes } from '@pinboard/ui'
import type { Report } from '@/composables/useNearbyReports'
import { formatDistance } from '@/utils/distance'

type TagColor = NonNullable<TagsProps['color']>

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
  const tags: TagsProps[] = []
  if (report.status) tags.push({ text: report.status, color: statusTagColor(report.status) })
  const distance = formatDistance(report.distance)
  if (distance) tags.push({ text: distance, color: 'grey' })

  const card: MapCardProps = {
    heading: report.serviceType,
    subheader: report.address,
    src: report.mediaUrl,
    tags,
  }

  return {
    id: report.id,
    name: report.serviceType,
    latitude: report.lat,
    longitude: report.lng,
    locationCardInfo: card,
  }
}
