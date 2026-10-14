import { toValue, type Ref } from 'vue'
import { isGauge } from './isGauge'
import type { Filters, OemLocation } from '@/types'

export function filterLocations(
  locations: Ref<OemLocation[]> | OemLocation[],
  filterMode: Ref<Filters>,
) {
  locations = toValue(locations)
  switch (filterMode.value) {
    case 'gauges': {
      return locations.filter((loc) => isGauge(loc))
    }
    case 'cameras': {
      return locations.filter((loc) => loc.deviceType === 'Camera')
    }
    case 'all':
    default: {
      return locations
    }
  }
}
