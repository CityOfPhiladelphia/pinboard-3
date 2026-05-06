import { ref, watchEffect } from 'vue'
// import { useUserLocationPermission } from './useUserLocationPermission'
import type { LatLon, LocationPermissionState } from '../types'

const userLocationPermission = ref<LocationPermissionState>('prompt')
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

export function useUserLocation() {
  getUserLocationPermission()
  if (userLocationPermission.value === 'granted' && navigator.geolocation) {
    navigator.geolocation.watchPosition((pos) => {
      userLocation.value.latitude = pos.coords.latitude
      userLocation.value.longitude = pos.coords.longitude
    })
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

async function detectPermissionDenial() {
  await new Promise(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('POS: ', position)
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

async function getUserLocationPermission() {
  await getGeolocatePermissionState()

  if (userLocationPermission.value === 'prompt') {
    await detectPermissionDenial()
  } else {
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permissionStatus) => {
        userLocationPermission.value = permissionStatus.state
        permissionStatus.onchange = () => {
          userLocationPermission.value = permissionStatus.state
        }
      })
  }
}
