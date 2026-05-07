import { ref } from 'vue'
import type { LatLon, LocationPermissionState } from '../types'

const userLocationPermission = ref<LocationPermissionState>(null)
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})
let awaitingUserResponse: boolean = true
let numGetLocationAttempts = 3

export function useUserLocation() {
  getGeolocatePermissionState().then(() => {
    awaitingUserResponse = userLocationPermission.value !== 'denied'
    if (awaitingUserResponse) {
      awaitUserPermissionResponse()
    }
  })
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

async function awaitUserPermissionResponse() {
  while (awaitingUserResponse) {
    awaitingUserResponse = await getUserLocation()
  }
}

async function getUserLocation() {
  return new Promise<boolean>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value.latitude = position.coords.latitude
        userLocation.value.longitude = position.coords.longitude
        userLocationPermission.value = 'granted'
        resolve(false)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
          case error.POSITION_UNAVAILABLE: {
            userLocationPermission.value = 'denied'
            resolve(false)
            break
          }
          case error.TIMEOUT: {
            numGetLocationAttempts--
            if (numGetLocationAttempts) {
              userLocationPermission.value = 'prompt'
              resolve(true)
            } else {
              userLocationPermission.value = 'denied'
              resolve(false)
            }
            break
          }
        }
      },
      { timeout: 7_000 }
    )
  })
}
