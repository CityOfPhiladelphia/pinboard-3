import { ref, watch } from 'vue'
import { useBrowserType } from './useBrowserType'
import { type LatLon, type LocationPermissionState, Browsers } from '../types'

const userLocationPermission = ref<LocationPermissionState>(null)
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const { browserType } = useBrowserType()

export function useUserLocation() {
  awaitUserPermissionResponse()

  watch(
    userLocationPermission,
    async (newPermissionState, oldPermissionState) => {
      if (
        (newPermissionState === 'granted' && oldPermissionState !== 'prompt') ||
        newPermissionState === 'prompt'
      ) {
        await getUserLocation()
      }
    }
  )

  return { userLocation, userLocationPermission }
}

async function awaitUserPermissionResponse() {
  await getGeolocatePermissionState()
  await getUserLocation()
}

async function getGeolocatePermissionState() {
  try {
    const useLocationPermission = await navigator.permissions.query({
      name: 'geolocation',
    })
    userLocationPermission.value = useLocationPermission.state
    if (browserType.value !== Browsers.SAFARI) {
      useLocationPermission.onchange = () => {
        userLocationPermission.value = useLocationPermission.state
      }
    }
  } catch (err) {
    console.log(err)
    userLocationPermission.value = 'denied'
  }
}

async function getUserLocation() {
  return await new Promise<boolean>(async () => {
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
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
          case error.POSITION_UNAVAILABLE:
          case error.TIMEOUT: {
            userLocationPermission.value = 'denied'
            break
          }
        }
      },
      { timeout: Infinity, maximumAge: 0 }
    )
  })
}

function checkLatitudeInRange(latitude: number) {
  return 39.84911 < latitude && latitude < 40.175
}

function checkLongitudeInRange(longitude: number) {
  return -75.35227 < longitude && longitude < -74.91583
}
