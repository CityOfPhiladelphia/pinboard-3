import { toValue, type Ref } from 'vue'
import type { BasicLocation, CustomSort, LatLon, SortMode } from '../types'
import { hasLocationData } from './_index'

export function sortLocations<PinboardLocation extends BasicLocation>(
  locations: Ref<PinboardLocation[]> | PinboardLocation[],
  currentLocation: Ref<LatLon> | LatLon,
  sortMode: Ref<SortMode> | SortMode,
  customSort?: CustomSort<PinboardLocation>
) {
  locations = toValue(locations)
  sortMode = toValue(sortMode)

  switch (hasLocationData(currentLocation) && !sortMode ? 'DistAsc' : sortMode) {
    case 'AlphaAsc': {
      return customSort?.AlphaAsc
        ? customSort.AlphaAsc(locations)
        : locations.sort((a, b) => a.name.localeCompare(b.name))
    }
    case 'AlphaDesc': {
      return customSort?.AlphaDesc
        ? customSort.AlphaDesc(locations)
        : locations.sort((b, a) => a.name.localeCompare(b.name))
    }
    case 'DistAsc': {
      return customSort?.DistAsc
        ? customSort.DistAsc(locations)
        : locations.sort(
            (a, b) =>
              Number(a.distance?.replace(' mi', '')) - Number(b.distance?.replace(' mi', ''))
          )
    }
    case 'DistDesc': {
      return customSort?.DistDesc
        ? customSort.DistDesc(locations)
        : locations.sort(
            (b, a) =>
              Number(a.distance?.replace(' mi', '')) - Number(b.distance?.replace(' mi', ''))
          )
    }
    default: {
      return customSort?.default ? customSort.default(locations) : locations
    }
  }
}
