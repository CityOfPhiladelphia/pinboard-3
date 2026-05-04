import { ref } from 'vue'
import { useUserLocationPermission } from './useUserLocationPermission'
import type { LatLon } from '../types'

const { userLocationPermission } = useUserLocationPermission()

const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

export function useUserLocation() {
  if (userLocationPermission.value === 'granted' && navigator.geolocation) {
    navigator.geolocation.watchPosition((pos) => {
      userLocation.value.latitude = pos.coords.latitude
      userLocation.value.longitude = pos.coords.longitude
    })
  }

  return { userLocation, userLocationPermission }
}
