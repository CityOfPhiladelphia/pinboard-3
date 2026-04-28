import { ref } from 'vue'
import type { LatLon } from '../types'

export function useUserLocation() {
  const userLocation = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((pos) => {
      console.log('Geolocation Accuracy: ', pos.coords.accuracy)
      userLocation.value.latitude = pos.coords.latitude
      userLocation.value.longitude = pos.coords.longitude
    })
  }

  return { userLocation }
}
