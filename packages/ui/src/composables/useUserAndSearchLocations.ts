import { type Ref, ref, watch } from 'vue'
import { hasLocationData } from '../utilities/hasLocationData'
import type { AddressLocation, LatLon, UserLocation, ZipcodeLocation } from '../types'

export function useUserAndSearchLocations(
  userLocation: Ref<UserLocation>,
  addressLocation: Ref<AddressLocation>,
  zipcodeLocation: Ref<ZipcodeLocation>
) {
  const searchOrUserLocation = ref<LatLon>(userLocation.value.location)
  console.log(searchOrUserLocation.value)

  watch(zipcodeLocation.value.centroid, (newLoc) => {
    if (!hasLocationData(newLoc)) {
      searchOrUserLocation.value = userLocation.value.location
    }
  })

  watch(addressLocation.value.location, (newLoc) => {
    if (!hasLocationData(newLoc)) {
      searchOrUserLocation.value = userLocation.value.location
    }
  })

  watch(
    () => addressLocation.value.fetchComplete,
    (newState) => {
      if (newState && hasLocationData(addressLocation.value.location)) {
        searchOrUserLocation.value = addressLocation.value.location
      }
    }
  )

  watch(
    () => zipcodeLocation.value.fetchComplete,
    (newState) => {
      if (newState && hasLocationData(zipcodeLocation.value.centroid)) {
        searchOrUserLocation.value = zipcodeLocation.value.centroid
      }
    }
  )

  return { searchOrUserLocation }
}
