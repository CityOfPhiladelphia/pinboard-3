import type { LatLon } from '@ui/types'
import type { OemLocation, SortMode } from '@/types'
import { getHaversineDistance, hasLocationData } from '@ui/utilities/_index'
import { toValue, type Ref } from 'vue'

export function sortLocations(
  locations: Ref<OemLocation[]> | OemLocation[],
  currentLocation: Ref<LatLon>,
  sortMode: Ref<SortMode>,
) {
  locations = toValue(locations)
  locations.forEach((location) => {
    location.locationCardInfo.subheader = hasLocationData(currentLocation.value)
      ? `${getHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: currentLocation.value.latitude,
            longitude: currentLocation.value.longitude,
          },
          1,
        )} mi`
      : undefined
  })

  switch (hasLocationData(currentLocation.value) && !sortMode.value ? 'DistAsc' : sortMode.value) {
    case 'AlphaAsc': {
      locations.sort((a, b) => a.name.localeCompare(b.name))
      break
    }
    case 'AlphaDes': {
      locations.sort((a, b) => b.name.localeCompare(a.name))
      break
    }
    case 'DistAsc': {
      locations.sort(
        (a, b) =>
          Number(a.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(b.locationCardInfo.subheader?.replace(' mi', '')),
      )
      break
    }
    case 'DistDes': {
      locations.sort(
        (a, b) =>
          Number(b.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(a.locationCardInfo.subheader?.replace(' mi', '')),
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
