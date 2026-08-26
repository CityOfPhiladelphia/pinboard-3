// ABOUTME: Single source of truth for how a 311 report's status maps to a bucket,
// ABOUTME: chip color/style, and icon — every status display in the app should go through this.
import type { IconComponent } from '@phila/phila-ui-core/icons'
import { IconCircleCheck, IconClock, IconCircleExclamation } from '@phila/phila-ui-core/icons'
import type { FilterChipColor } from '@phila/phila-ui-filter-chip'

export type StatusBucket = 'open' | 'onHold' | 'closed'

export function statusBucket(status: string | undefined | null): StatusBucket | null {
  if (!status) return null
  if (status === 'Closed') return 'closed'
  if (status === 'On Hold') return 'onHold'
  return 'open'
}

const BUCKET_COLOR: Record<StatusBucket, FilterChipColor> = {
  open: 'blue',
  onHold: 'yellow',
  closed: 'green',
}

const BUCKET_ICON: Record<StatusBucket, IconComponent> = {
  open: IconClock,
  onHold: IconCircleExclamation,
  closed: IconCircleCheck,
}

export function statusTagColor(bucket: StatusBucket): FilterChipColor {
  return BUCKET_COLOR[bucket]
}

export function statusTagIcon(bucket: StatusBucket): IconComponent {
  return BUCKET_ICON[bucket]
}

export function statusTagStyle(bucket: StatusBucket): Record<string, string> {
  if (bucket !== 'open') return { cursor: 'default' }
  return {
    cursor: 'default',
    backgroundColor: 'var(--Palettes-Visited-Visited-650, #e5cefa)',
    color: 'var(--Palettes-Visited-Visited-250, #4a00c9)',
    borderColor: 'var(--Palettes-Visited-Visited-250, #4a00c9)',
  }
}
