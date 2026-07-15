import { toValue, type Ref } from 'vue'
import { PinboardUtilities, type PinboardTypes } from '@pinboard/ui'
import type { OemLocation, SortMode } from '@/types'

export function sortLocations(
  locations: Ref<OemLocation[]> | OemLocation[],
  currentLocation: Ref<PinboardTypes.LatLon>,
  sortMode: Ref<SortMode>,
) {
  locations = toValue(locations)
  locations.forEach((location) => {
    location.distance = PinboardUtilities.hasLocationData(currentLocation.value)
      ? `${PinboardUtilities.getHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: currentLocation.value.latitude,
            longitude: currentLocation.value.longitude,
          },
          1,
        )} mi`
      : undefined

    location.locationCardInfo.subheader = location.distance
  })

  switch (
    PinboardUtilities.hasLocationData(currentLocation.value) && !sortMode.value
      ? 'DistAsc'
      : sortMode.value
  ) {
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
