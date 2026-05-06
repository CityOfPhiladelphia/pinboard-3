import { ref, watchEffect } from 'vue'
import { useUserLocationPermission } from './useUserLocationPermission'
import type { LatLon } from '../types'

const { userLocationPermission } = useUserLocationPermission()

const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

export function useUserLocation() {
  function watchUserPosition() {
    if (
      (userLocationPermission.value === 'granted' ||
        userLocationPermission.value === 'prompt') &&
      navigator.geolocation
    ) {
      navigator.geolocation.watchPosition((pos) => {
        userLocation.value.latitude = pos.coords.latitude
        userLocation.value.longitude = pos.coords.longitude
      })
    }
  }

  watchEffect(() => {
    watchUserPosition()
  })

  return { userLocation, userLocationPermission }
}
