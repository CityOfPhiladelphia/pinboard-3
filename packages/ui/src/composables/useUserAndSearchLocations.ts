import { type Ref, ref, watch } from 'vue'
import { hasLocationData } from '../utilities/hasLocationData'
import type { LatLon, ZipcodePolygon } from '../types'

export function userUserAndSearchLocations(
  userLocation: Ref<LatLon>,
  addressCoordinates: Ref<LatLon>,
  finishedAddressFetch: Ref<Boolean>,
  zipcodePolygon: Ref<ZipcodePolygon>,
  finishedZipFetch: Ref<Boolean>
) {
  const searchOrUserLocation = ref<LatLon>(userLocation.value)

  watch(zipcodePolygon.value.centroid, (newLoc) => {
    if (!hasLocationData(newLoc)) {
      searchOrUserLocation.value = userLocation.value
    }
  })

  watch(addressCoordinates.value, (newLoc) => {
    if (!hasLocationData(newLoc)) {
      searchOrUserLocation.value = userLocation.value
    }
  })

  watch(
    () => finishedAddressFetch.value,
    (newState) => {
      if (newState && hasLocationData(addressCoordinates.value)) {
        searchOrUserLocation.value = addressCoordinates.value
      }
    }
  )

  watch(
    () => finishedZipFetch.value,
    (newState) => {
      if (newState && hasLocationData(zipcodePolygon.value.centroid)) {
        searchOrUserLocation.value = zipcodePolygon.value.centroid
        console.log(
          `LOC: ${searchOrUserLocation.value.latitude}, ${searchOrUserLocation.value.longitude}`
        )
      }
    }
  )

  return { searchOrUserLocation }
}
