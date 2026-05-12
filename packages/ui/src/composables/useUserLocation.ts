import { ref } from 'vue'
import type { LatLon, LocationPermissionState } from '../types'

const userLocationPermission = ref<LocationPermissionState>(null)
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

let timeoutOrWait = 'waiting'

export function useUserLocation() {
  navigator.permissions
    .query({ name: 'geolocation' })
    .then((permissionStatus) => {
      userLocationPermission.value = permissionStatus.state
      console.log(`geolocation permission status is ${permissionStatus.state}`)
      permissionStatus.onchange = () => {
        userLocationPermission.value = permissionStatus.state
        console.log(
          `geolocation permission status has changed to ${permissionStatus.state}`
        )
      }
    })

  awaitUserPermissionResponse()

  return { userLocation, userLocationPermission }
}

async function getGeolocatePermissionState() {
  try {
    // const permissionState = await navigator.permissions.query({
    //   name: 'geolocation',
    // })
    // userLocationPermission.value = permissionState.state
  } catch (err) {
    console.log(err)
    userLocationPermission.value = 'denied'
  }
}

async function awaitUserPermissionResponse() {
  try {
    if (userLocationPermission.value !== 'denied') {
      await getUserLocation()
      while (userLocationPermission.value === 'prompt') {
        userLocationPermission.value = (
          await navigator.permissions.query({
            name: 'geolocation',
          })
        ).state
        await getUserLocation()
      }
    }
  } catch (err) {
    console.log(err)
  }
}

function waitForUserTimeout() {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request took too long!'))
    }, 25_000)
  })
}

async function getUserLocation() {
  return await new Promise<boolean>(async (resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value.latitude = checkLatitudeInRange(
          position.coords.latitude
        )
          ? position.coords.latitude
          : NaN
        userLocation.value.longitude = checkLongitudeInRange(
          position.coords.longitude
        )
          ? position.coords.longitude
          : NaN
        userLocationPermission.value = 'granted'
        resolve(false)
      },
      (error) => {
        console.log(error.message)
        switch (error.code) {
          case error.PERMISSION_DENIED:
          case error.POSITION_UNAVAILABLE: {
            userLocationPermission.value = 'denied'
            resolve(false)
            break
          }
          case error.TIMEOUT: {
            resolve(true)
            break
          }
        }
      },
      { timeout: 10_000 }
    )
  })
}

function checkLatitudeInRange(latitude: number) {
  return 39.84911 < latitude && latitude < 40.175
}

function checkLongitudeInRange(longitude: number) {
  return -75.35227 < longitude && longitude < -74.91583
}
