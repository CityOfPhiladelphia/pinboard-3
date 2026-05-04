import { ref } from 'vue'
import type { LatLon, LocationPermissionState } from '../types'

const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const userLocationPermission = ref<LocationPermissionState>('denied')

export function useUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((pos) => {
      userLocation.value.latitude = pos.coords.latitude
      userLocation.value.longitude = pos.coords.longitude
    })
  }

  return { userLocation, userLocationPermission }
}

export function useUserLocationPermission() {
  navigator.permissions
    .query({ name: 'geolocation' })
    .then(function (permission) {
      userLocationPermission.value = permission.state
    })
}
