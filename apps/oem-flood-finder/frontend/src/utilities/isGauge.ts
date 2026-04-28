import type { OemLocation } from '@/types'

export function isGauge(loc: OemLocation): boolean {
  return loc.deviceType === 'Aware' || loc.deviceType === 'Usgs'
}
