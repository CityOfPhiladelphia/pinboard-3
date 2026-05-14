import { ref, watch } from 'vue'
import { getBrowserType } from '../utilities/getBrowserType'
import { type LatLon, type LocationPermissionState, Browsers } from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

// excluding 'prompt' to ensure behavior of Firefox and similarly behaving browsers are coerced into behaving like Chrome
const userLocationPermission = ref<Exclude<LocationPermissionState, 'prompt'> | null>(null)
const userLocation = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

const geolocationOptions = { timeout: Infinity, maximumAge: 10_000, enableHighAccuracy: false }
let watchId: number | null = null

watch(userLocationPermission, async (newPermissionState) => {
  switch (newPermissionState) {
    case 'granted': {
      watchId = navigator.geolocation.watchPosition(
        locationSuccess,
        (error) => {
          console.error(error)
        },
        geolocationOptions
      )
      break
    }
    case 'denied': {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
      clearUserLocation()
      watchId = null
    }
  }
})

export function useUserLocation() {
  // set userLocationPermission to navigator.permissions.state, watcher calls getUserLocation() if not 'denied'
  getUserLocation()
  getGeolocatePermissionState()
  return { userLocation, userLocationPermission }
}

async function getGeolocatePermissionState() {
  try {
    const useLocationPermission = await navigator.permissions.query({
      name: 'geolocation',
    })
    switch (useLocationPermission.state) {
      case 'granted':
      case 'denied': {
        userLocationPermission.value = useLocationPermission.state
        break
      }
      case 'prompt': {
        // if useLocationPermission.state is 'prompt' remain in whatever state resulted from getUserLocation()
        userLocationPermission.value = userLocationPermission.value
        break
      }
    }

    if (getBrowserType() !== Browsers.SAFARI) {
      // set userLocationPermission to change whenever navigator.permissions.state changes
      // skip this if browser is Safari because Safari has a known bug that keeps this from working (https://bugs.webkit.org/show_bug.cgi?id=259432)
      useLocationPermission.onchange = async () => {
        switch (useLocationPermission.state) {
          case 'granted': {
            userLocationPermission.value = 'granted'
            break
          }
          case 'denied': {
            clearUserLocation()
            userLocationPermission.value = 'denied'
            break
          }
          case 'prompt': {
            userLocationPermission.value = 'denied'
            await getUserLocation()
            break
          }
        }
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
      locationSuccess,
      (error) => {
        userLocationPermission.value = 'denied'
        console.error(error)
      },
      geolocationOptions
    )
  })
}

// verify location is in or near enough to Philadelphia
function checkLongitudeInRange(longitude: number) {
  return -75.35227 < longitude && longitude < -74.91583
}
function checkLatitudeInRange(latitude: number) {
  return 39.84911 < latitude && latitude < 40.175
}

function locationSuccess(position: GeolocationPosition) {
  // only show location on map if user is in or near Philly
  userLocation.value.latitude = checkLatitudeInRange(position.coords.latitude)
    ? position.coords.latitude
    : NaN
  userLocation.value.longitude = checkLongitudeInRange(position.coords.longitude)
    ? position.coords.longitude
    : NaN
  if (!hasLocationData(userLocation)) {
    console.error(`Location not in range`)
  }

  // if navigator.permissions is 'prompt' or 'granted' resolve both to 'granted' if user allows location services
  userLocationPermission.value = 'granted'
}

function clearUserLocation() {
  userLocation.value.latitude = NaN
  userLocation.value.longitude = NaN
}
