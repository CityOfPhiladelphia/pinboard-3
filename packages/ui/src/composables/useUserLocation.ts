import { ref } from 'vue'
import type { LatLon, LocationPermissionState } from '../types'

const userLocationPermission = ref<LocationPermissionState>(null)
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

export function useUserLocation() {
  getGeolocatePermissionState().then(() => {
    if (userLocationPermission.value !== 'denied') {
      awaitUserPermissionResponse().catch(() => {
        userLocationPermission.value = 'denied'
        getUserLocation()
      })
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
  await Promise.race([getUserLocation(), waitForUserTimeout()])
}

function waitForUserTimeout() {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request took too long!'))
    }, 5_000)
  })
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
            userLocationPermission.value = 'prompt'
            resolve(true)
            break
          }
        }
      }
    )
  })
}
