import { toValue, type Ref } from 'vue'
import { PinboardUtilities, type PinboardTypes } from '@pinboard/ui'
import type { PrimaryCareLocation, SortMode } from '@/types'

export function sortLocations(
  locations: Ref<PrimaryCareLocation[]> | PrimaryCareLocation[],
  currentLocation: Ref<PinboardTypes.LatLon>,
  sortMode: Ref<SortMode> | SortMode
) {
  locations = toValue(locations)
  sortMode = toValue(sortMode)
  switch (
    PinboardUtilities.hasLocationData(currentLocation.value) && !sortMode ? 'distance' : sortMode
  ) {
    case 'name': {
      locations.sort((a, b) => a.name.localeCompare(b.name))
      break
    }
    case 'distance': {
      locations.forEach((location) => {
        location.locationCardInfo.subheader = PinboardUtilities.hasLocationData(
          currentLocation.value
        )
          ? `${PinboardUtilities.getHaversineDistance(
              { latitude: location.latitude, longitude: location.longitude },
              {
                latitude: currentLocation.value.latitude,
                longitude: currentLocation.value.longitude,
              },
              1
            )} mi`
          : undefined
      })
      locations.sort(
        (a, b) =>
          Number(a.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(b.locationCardInfo.subheader?.replace(' mi', ''))
      )
      break
    }
  }
  return locations
}
