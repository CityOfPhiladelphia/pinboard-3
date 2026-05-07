import { ref } from 'vue'
import type { LatLon, LocationPermissionState } from '../types'

const userLocationPermission = ref<LocationPermissionState>(null)
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

export function useUserLocation() {
  getGeolocatePermissionState()
  if (userLocationPermission.value !== 'denied') {
    getUserLocation()
  }

  return { userLocation, userLocationPermission }
}

async function getGeolocatePermissionState() {
  try {
    const permissionState = await navigator.permissions.query({
      name: 'geolocation',
    })
    userLocationPermission.value = permissionState.state
  } catch (err) {
    console.log(err)
    userLocationPermission.value = 'denied'
  }
}

async function getUserLocation() {
  await new Promise(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value.latitude = position.coords.latitude
        userLocation.value.longitude = position.coords.longitude
        userLocationPermission.value = 'granted'
      },
      () => {
        userLocationPermission.value = 'denied'
      }
    )
  })
}
