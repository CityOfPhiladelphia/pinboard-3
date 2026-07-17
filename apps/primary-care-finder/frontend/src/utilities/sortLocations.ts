import { toValue, type Ref } from 'vue'
import { PinboardUtilities, type PinboardTypes } from '@pinboard/ui'
import type { PrimaryCareLocation, SortMode } from '@/types'

export function sortLocations(
  locations: Ref<PrimaryCareLocation[]> | PrimaryCareLocation[],
  currentLocation: Ref<PinboardTypes.LatLon> | PinboardTypes.LatLon,
  sortMode: Ref<SortMode> | SortMode
): PrimaryCareLocation[] {
  locations = toValue(locations)
  currentLocation = toValue(currentLocation)
  sortMode = toValue(sortMode)
  switch (PinboardUtilities.hasLocationData(currentLocation) && !sortMode ? 'distance' : sortMode) {
    case 'name': {
      return sortAlpha(locations)
    }
    case 'distance': {
      return sortDistance(locations, currentLocation)
    }
    default: {
      return locations
    }
  }
}

function sortAlpha(locations: PrimaryCareLocation[]) {
  locations.sort((a, b) => {
    return a.name
      .replace(/(City of Philadelphia - Health Center )(\d{1}(?!\d))/, '$10$2')
      .localeCompare(
        b.name.replace(/(City of Philadelphia - Health Center )(\d{1}(?!\d))/, '$10$2')
      )
  })
  return locations
}

function sortDistance(locations: PrimaryCareLocation[], currentLocation: PinboardTypes.LatLon) {
  currentLocation = toValue(currentLocation)
  locations.forEach((location) => {
    location.locationCardInfo.subheader = PinboardUtilities.hasLocationData(currentLocation)
      ? `${PinboardUtilities.getHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
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
  return locations
}
