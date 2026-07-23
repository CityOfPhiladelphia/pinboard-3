import { toValue, type Ref } from 'vue'
import { PinboardUtilities, type PinboardTypes } from '@pinboard/ui'
import type { OemLocation, SortMode } from '@/types'

export function sortLocations(
  locations: Ref<OemLocation[]> | OemLocation[],
  currentLocation: Ref<PinboardTypes.LatLon> | PinboardTypes.LatLon,
  sortMode: Ref<SortMode> | SortMode,
) {
  locations = toValue(locations)
  currentLocation = toValue(currentLocation)
  sortMode = toValue(sortMode)
  locations.forEach((location) => {
    location.distance = PinboardUtilities.hasLocationData(currentLocation)
      ? `${PinboardUtilities.getHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          1,
        )} mi`
      : undefined
  })

  switch (PinboardUtilities.hasLocationData(currentLocation) && !sortMode ? 'DistAsc' : sortMode) {
    case 'AlphaAsc': {
      locations.sort((a, b) => a.name.localeCompare(b.name))
      break
    }
    case 'DistAsc': {
      locations.sort(
        (a, b) => Number(a.distance?.replace(' mi', '')) - Number(b.distance?.replace(' mi', '')),
      )
      break
    }
    default: {
      // south to north
      locations.sort((a, b) => a.latitude - b.latitude)
    }
  }
  return locations
}
