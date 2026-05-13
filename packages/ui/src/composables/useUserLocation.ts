import { ref, watch } from 'vue'
import { getBrowserType } from '../utilities/getBrowserType'
import { type LatLon, type LocationPermissionState, Browsers } from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

const userLocationPermission = ref<LocationPermissionState>('denied')
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

watch(userLocationPermission, async (newPermissionState) => {
  if (newPermissionState !== 'denied') {
    await getUserLocation()
  }
})

export function useUserLocation() {
  getGeolocatePermissionState()
  return { userLocation, userLocationPermission }
}

async function getGeolocatePermissionState() {
  try {
    const useLocationPermission = await navigator.permissions.query({
      name: 'geolocation',
    })
    userLocationPermission.value = useLocationPermission.state
    if (getBrowserType() !== Browsers.SAFARI) {
      useLocationPermission.onchange = () => {
        userLocationPermission.value = useLocationPermission.state
      }
    }
  } catch (error) {
    console.error(error)
    userLocationPermission.value = 'denied'
  }
}

async function getUserLocation() {
  return await new Promise<boolean>(async () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value.latitude = checkLatitudeInRange(position.coords.latitude)
          ? position.coords.latitude
          : NaN
        userLocation.value.longitude = checkLongitudeInRange(position.coords.longitude)
          ? position.coords.longitude
          : NaN
        if (hasLocationData(userLocation)) {
          userLocationPermission.value = 'granted'
        } else {
          userLocationPermission.value = 'denied'
          console.error(`Location not in range`)
        }
      },
      (error) => {
        userLocationPermission.value = 'denied'
        console.error(error)
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
